import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { updateAllocation } from '@/lib/api/allocations';
import { getEmployees } from '@/lib/api/employees';
import { getWorkspaces } from '@/lib/api/workspaces';
import { useToast } from '@/components/ui/use-toast';
import { Allocation } from '@/types/allocation';

const allocationFormSchema = z.object({
  employee_id: z.string().min(1, 'חובה לבחור עובד'),
  workspace_id: z.string().min(1, 'חובה לבחור מקום ישיבה'),
  start_date: z.date({
    required_error: 'חובה לבחור תאריך התחלה',
  }),
  end_date: z.date().optional(),
  status: z.enum(['active', 'pending', 'completed', 'cancelled']),
});

type AllocationFormData = z.infer<typeof allocationFormSchema>;

interface EditAllocationFormProps {
  allocation: Allocation;
  onSuccess: () => void;
}

export function EditAllocationForm({ allocation, onSuccess }: EditAllocationFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AllocationFormData>({
    resolver: zodResolver(allocationFormSchema),
    defaultValues: {
      employee_id: allocation.employee_id,
      workspace_id: allocation.workspace_id,
      start_date: new Date(allocation.start_date),
      end_date: allocation.end_date ? new Date(allocation.end_date) : undefined,
      status: allocation.status,
    },
  });

  const { data: employees } = useQuery({
    queryKey: ['employees'],
    queryFn: getEmployees,
  });

  const { data: workspaces } = useQuery({
    queryKey: ['workspaces'],
    queryFn: getWorkspaces,
  });

  async function onSubmit(data: AllocationFormData) {
    try {
      setIsSubmitting(true);
      await updateAllocation(allocation.id, data);
      
      queryClient.invalidateQueries({ queryKey: ['allocations'] });
      toast({
        title: 'הקצאה עודכנה בהצלחה',
        description: 'פרטי ההקצאה עודכנו במערכת',
      });
      onSuccess();
    } catch (error) {
      console.error('Failed to update allocation:', error);
      toast({
        title: 'שגיאה',
        description: 'אירעה שגיאה בעדכון ההקצאה',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
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
              <Select onValueChange={field.onChange} defaultValue={field.value}>
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
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="בחר מקום ישיבה" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {workspaces?.map((workspace) => (
                    <SelectItem key={workspace.id} value={workspace.id}>
                      {workspace.name} - {workspace.room} (קומה {workspace.floor})
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
                      variant="outline"
                      className={cn(
                        'w-full pl-3 text-right font-normal',
                        !field.value && 'text-muted-foreground'
                      )}
                    >
                      {field.value ? (
                        format(field.value, 'dd/MM/yyyy', { locale: he })
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
                      variant="outline"
                      className={cn(
                        'w-full pl-3 text-right font-normal',
                        !field.value && 'text-muted-foreground'
                      )}
                    >
                      {field.value ? (
                        format(field.value, 'dd/MM/yyyy', { locale: he })
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
                    disabled={(date) =>
                      date < (form.getValues('start_date') || new Date())
                    }
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
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>סטטוס</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="בחר סטטוס" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="active">פעיל</SelectItem>
                  <SelectItem value="pending">ממתין</SelectItem>
                  <SelectItem value="completed">הושלם</SelectItem>
                  <SelectItem value="cancelled">בוטל</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'מעדכן הקצאה...' : 'עדכן הקצאה'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
