import { useState, useMemo } from 'react';
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
import { createAllocation, validateAllocation } from '@/lib/api/allocations';
import { getEmployees } from '@/lib/api/employees';
import { getWorkspaces } from '@/lib/api/workspaces';
import { Workspace } from '@/types/workspace';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Employee } from '../../types/employee';

// Enhanced Zod schema with more robust validation
const allocationFormSchema = z.object({
  employee_id: z.string().min(1, 'חובה לבחור עובד'),
  workspace_id: z.string().min(1, 'חובה לבחור מקום ישיבה'),
  start_date: z.date({
    required_error: 'חובה לבחור תאריך התחלה',
  }),
  end_date: z.date().optional(),
}).refine(
  (data) => !data.end_date || data.end_date >= data.start_date, 
  { message: 'תאריך סיום חייב להיות לאחר תאריך ההתחלה', path: ['end_date'] }
);

type AllocationFormData = z.infer<typeof allocationFormSchema>;

interface WorkspaceWithCompatibility extends Workspace {
  compatibility_score: number;
  incompatibility_reasons?: string[];
}

interface CreateAllocationFormProps {
  onSuccess: () => void;
}

export function CreateAllocationForm({ onSuccess }: CreateAllocationFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [compatibleWorkspaces, setCompatibleWorkspaces] = useState<WorkspaceWithCompatibility[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const form = useForm<AllocationFormData>({
    resolver: zodResolver(allocationFormSchema),
    defaultValues: {
      start_date: new Date(),
    }
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
    try {
      const employee = employees?.find((e) => e.id === employeeId);
      if (!employee) return;

      setSelectedEmployee(employee);
      
      // Reset form state
      form.setValue('employee_id', employeeId);
      form.setValue('workspace_id', '');
      
      // Fetch ALL workspaces and compute compatibility
      const allWorkspaces = await getWorkspaces();
      
      const workspacesWithCompatibility = await Promise.all(
        allWorkspaces.map(async (workspace) => {
          const compatibilityResult = await validateAllocation(employeeId, workspace.id);
          return {
            ...workspace,
            compatibility_score: compatibilityResult.isValid ? 1 : 0,
            incompatibility_reasons: compatibilityResult.isValid 
              ? [] 
              : Object.entries(compatibilityResult.constraints)
                  .filter(([, value]) => !value)
                  .map(([key]) => getConstraintDescription(key))
          };
        })
      );

      // Sort workspaces: compatible first, then by compatibility score
      const sortedWorkspaces = workspacesWithCompatibility.sort((a, b) => 
        b.compatibility_score - a.compatibility_score
      );

      setCompatibleWorkspaces(sortedWorkspaces);
    } catch (error) {
      toast({
        title: 'שגיאה',
        description: 'אירעה שגיאה בטעינת מקומות ישיבה',
        variant: 'destructive',
      });
    }
  };

  const onWorkspaceChange = async (workspaceId: string) => {
    try {
      form.setValue('workspace_id', workspaceId);
      
      if (selectedEmployee) {
        const result = await validateAllocation(selectedEmployee.id, workspaceId);
        
        if (!result.isValid) {
          toast({
            title: 'אזהרה',
            description: 'מקום הישיבה אינו תואם באופן מלא לעובד',
            variant: 'destructive',
          });
        }
      }
    } catch (error) {
      console.error('Failed to validate allocation:', error);
    }
  };

  async function onSubmit(data: AllocationFormData) {
    try {
      setIsSubmitting(true);
      
      const workspace = compatibleWorkspaces.find(w => w.id === data.workspace_id);
      const isFullyCompatible = workspace?.compatibility_score === 1;

      await createAllocation({
        ...data,
        start_date: data.start_date.toISOString(),
        end_date: data.end_date?.toISOString(),
        status: isFullyCompatible ? 'approved' : 'pending_review',
      });
      
      queryClient.invalidateQueries({ queryKey: ['allocations'] });
      
      toast({
        title: 'הקצאה נוצרה בהצלחה',
        description: isFullyCompatible 
          ? 'הקצאת המקום אושרה' 
          : 'הקצאת המקום נוצרה ומחכה לבדיקה',
      });
      
      onSuccess();
    } catch (error) {
      toast({
        title: 'שגיאה',
        description: 'אירעה שגיאה ביצירת ההקצאה',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  function getConstraintDescription(key: string): string {
    const descriptions: Record<string, string> = {
      gender: 'מגבלת מגדר',
      religious: 'מגבלה דתית',
      health: 'מגבלת בריאות',
      schedule: 'מגבלת זמנים'
    };
    return descriptions[key] || key;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="employee_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>עובד</FormLabel>
              <Select 
                onValueChange={(value) => {
                  field.onChange(value);
                  onEmployeeChange(value);
                }} 
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="בחר עובד" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {employees?.map((employee, index) => (
                    <SelectItem key={employee.id || `employee-${index}`} value={employee.id}>
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
              <Select 
                onValueChange={(value) => {
                  field.onChange(value);
                  onWorkspaceChange(value);
                }}
                disabled={!selectedEmployee}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="בחר מקום ישיבה" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {compatibleWorkspaces.map((workspace, index) => (
                    <SelectItem 
                      key={workspace.id || `workspace-${index}`} 
                      value={workspace.id}
                      disabled={workspace.compatibility_score === 0}
                    >
                      <div className="flex flex-col">
                        <div className="flex justify-between items-center">
                          <span>{workspace.name || workspace.id}</span>
                          <span className={`text-xs ${workspace.compatibility_score ? 'text-green-500' : 'text-red-500'}`}>
                            {workspace.compatibility_score ? 'מתאים' : 'לא מתאים'}
                          </span>
                        </div>
                        {workspace.incompatibility_reasons && workspace.incompatibility_reasons.length > 0 && (
                          <div className="text-xs text-red-500 mt-1">
                            {workspace.incompatibility_reasons.map(reason => (
                              <div key={reason}>• {reason}</div>
                            ))}
                          </div>
                        )}
                      </div>
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

        <Button 
          type="submit" 
          disabled={isSubmitting || !form.formState.isValid}
        >
          צור הקצאה
        </Button>
      </form>
    </Form>
  );
}
