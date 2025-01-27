import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { CalendarIcon, AlertCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createAllocation, findCompatibleWorkspaces, validateAllocation, autoAllocateSeats } from '@/lib/api/allocations';
import { getEmployees } from '@/lib/api/employees';
import { getWorkspaces } from '@/lib/api/workspaces';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

const allocationFormSchema = z.object({
  employee_id: z.string().min(1, 'חובה לבחור עובד'),
  workspace_id: z.string().min(1, 'חובה לבחור מקום ישיבה'),
  start_date: z.date({
    required_error: 'חובה לבחור תאריך התחלה',
  }),
  end_date: z.date().optional(),
});

type AllocationFormData = {
  employee_id: string;
  workspace_id: string;
  start_date: Date;
  end_date?: Date;
}

interface CreateAllocationFormProps {
  onSuccess: () => void;
}

export function CreateAllocationForm({ onSuccess }: CreateAllocationFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [compatibleWorkspaces, setCompatibleWorkspaces] = useState<{ workspace_id: string; compatibility_score: number }[]>([]);
  const [validationResult, setValidationResult] = useState<{ isValid: boolean; constraints: any } | null>(null);

  const form = useForm<AllocationFormData>({
    resolver: zodResolver(allocationFormSchema),
  });

  const { data: employees } = useQuery({
    queryKey: ['employees'],
    queryFn: getEmployees,
  });

  const { data: workspaces } = useQuery({
    queryKey: ['workspaces'],
    queryFn: getWorkspaces,
  });

  const onEmployeeChange = async (employeeId: string) => {
    form.setValue('employee_id', employeeId);
    form.setValue('workspace_id', ''); 
    setValidationResult(null);
    
    try {
      const compatibleSpaces = await findCompatibleWorkspaces(employeeId);
      setCompatibleWorkspaces(compatibleSpaces);
    } catch (error) {
      console.error('Failed to find compatible workspaces:', error);
      toast({
        title: 'שגיאה',
        description: 'אירעה שגיאה בחיפוש מקומות ישיבה מתאימים',
        variant: 'destructive',
      });
    }
  };

  const onWorkspaceChange = async (workspaceId: string) => {
    form.setValue('workspace_id', workspaceId);
    
    if (form.getValues('employee_id') && workspaceId) {
      try {
        const result = await validateAllocation(form.getValues('employee_id'), workspaceId);
        setValidationResult(result);
      } catch (error) {
        console.error('Failed to validate allocation:', error);
      }
    }
  };

  const handleAutoAllocate = async () => {
    try {
      setIsSubmitting(true);
      const allocations = await autoAllocateSeats();
      
      queryClient.invalidateQueries({ queryKey: ['allocations'] });
      toast({
        title: 'הקצאה אוטומטית בוצעה בהצלחה',
        description: `בוצעו ${allocations.length} הקצאות חדשות`,
      });
      onSuccess();
    } catch (error) {
      console.error('Failed to auto-allocate seats:', error);
      toast({
        title: 'שגיאה',
        description: 'אירעה שגיאה בהקצאה האוטומטית',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  async function onSubmit(data: AllocationFormData) {
    try {
      setIsSubmitting(true);
      await createAllocation({
        ...data,
        start_date: data.start_date.toISOString(),
        end_date: data.end_date?.toISOString(),
        status: 'pending',
      });
      
      queryClient.invalidateQueries({ queryKey: ['allocations'] });
      toast({
        title: 'הקצאה נוצרה בהצלחה',
        description: 'הקצאת המקום נוצרה ומחכה לאישור',
      });
      onSuccess();
    } catch (error) {
      console.error('Failed to create allocation:', error);
      toast({
        title: 'שגיאה',
        description: 'אירעה שגיאה ביצירת ההקצאה',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="flex justify-end mb-4">
          <Button
            type="button"
            onClick={handleAutoAllocate}
            disabled={isSubmitting}
            variant="outline"
          >
            הקצאה אוטומטית
          </Button>
        </div>

        <FormField
          control={form.control}
          name="employee_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>עובד</FormLabel>
              <Select onValueChange={onEmployeeChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="בחר עובד" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {employees?.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.first_name} {employee.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="workspace_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>מקום ישיבה</FormLabel>
              <Select onValueChange={onWorkspaceChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="בחר מקום ישיבה" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {workspaces?.map((workspace) => {
                    const compatibility = compatibleWorkspaces.find(
                      (cw) => cw.workspace_id === workspace.id
                    );
                    const score = compatibility?.compatibility_score || 0;
                    const isCompatible = score > 0;

                    return (
                      <SelectItem
                        key={workspace.id}
                        value={workspace.id}
                        className={cn(
                          "flex items-center justify-between",
                          !isCompatible && "opacity-50"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span>{workspace.name}</span>
                          <Progress value={score} className="w-20" />
                          <span className="text-sm text-muted-foreground">
                            {score}%
                          </span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {validationResult && !validationResult.isValid && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>אזהרה</AlertTitle>
            <AlertDescription>
              <div className="space-y-2">
                {!validationResult.constraints.gender && (
                  <p>• אילוץ מגדרי: מקום הישיבה לא מתאים למגדר העובד</p>
                )}
                {!validationResult.constraints.religious && (
                  <p>• אילוץ דתי: מקום הישיבה לא מתאים לרמת הדתיות של העובד</p>
                )}
                {!validationResult.constraints.health && (
                  <p>• אילוץ בריאותי: מקום הישיבה לא עומד בדרישות הבריאותיות</p>
                )}
                {!validationResult.constraints.schedule && (
                  <p>• אילוץ לוח זמנים: קיימת התנגשות בלוח הזמנים עם עובד אחר</p>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        <FormField
          control={form.control}
          name="start_date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>תאריך התחלה</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-[240px] pl-3 text-right font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP", { locale: he })
                      ) : (
                        <span>בחר תאריך</span>
                      )}
                      <CalendarIcon className="mr-auto h-4 w-4" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="end_date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>תאריך סיום (אופציונלי)</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-[240px] pl-3 text-right font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP", { locale: he })
                      ) : (
                        <span>בחר תאריך</span>
                      )}
                      <CalendarIcon className="mr-auto h-4 w-4" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting || (validationResult && !validationResult.isValid)}>
          צור הקצאה
        </Button>
      </form>
    </Form>
  );
}
