import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Employee } from '@/types/employee';
import { Checkbox } from '@/components/ui/checkbox';
import { MultiSelect } from '@/components/ui/multi-select';

const employeeSchema = z.object({
  first_name: z.string().min(2, 'שם פרטי חייב להכיל לפחות 2 תווים'),
  last_name: z.string().min(2, 'שם משפחה חייב להכיל לפחות 2 תווים'),
  email: z.string().email('כתובת אימייל לא תקינה'),
  gender: z.enum(['male', 'female', 'other']),
  constraints: z.object({
    religious: z.boolean(),
    healthConstraints: z.boolean(),
    preferredArea: z.string().optional(),
    cannotSitWith: z.array(z.string()).optional(),
    mustSitWith: z.array(z.string()).optional(),
    requiresPrivateRoom: z.boolean().optional()
  }),
  status: z.enum(['active', 'inactive']).default('active'),
  work_schedule: z.array(z.object({
    day: z.enum(['sunday', 'monday', 'tuesday', 'wednesday', 'thursday']),
    location: z.enum(['office', 'home']),
  })),
  work_hours: z.object({
    start: z.string(),
    end: z.string()
  })
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

interface EmployeeFormProps {
  initialData?: Partial<Employee>;
  onSubmit: (data: EmployeeFormData) => void;
  onCancel?: () => void;
}

export const EmployeeForm: React.FC<EmployeeFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
}) => {
  const form = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      first_name: initialData?.first_name || '',
      last_name: initialData?.last_name || '',
      email: initialData?.email || '',
      gender: initialData?.gender || 'male',
      constraints: {
        religious: initialData?.constraints?.religious || false,
        healthConstraints: initialData?.constraints?.healthConstraints || false,
        preferredArea: initialData?.constraints?.preferredArea || '',
        cannotSitWith: initialData?.constraints?.cannotSitWith || [],
        mustSitWith: initialData?.constraints?.mustSitWith || [],
        requiresPrivateRoom: initialData?.constraints?.requiresPrivateRoom || false
      },
      status: initialData?.status || 'active',
      work_schedule: initialData?.work_schedule || [
        { day: 'sunday', location: 'office' },
        { day: 'monday', location: 'office' },
        { day: 'tuesday', location: 'office' },
        { day: 'wednesday', location: 'office' },
        { day: 'thursday', location: 'office' }
      ],
      work_hours: {
        start: '09:00',
        end: '17:00'
      }
    }
  });

  const handleFormSubmit = (data: EmployeeFormData) => {
    console.log(`${initialData ? 'Updating' : 'Creating'} employee: ${data.first_name} ${data.last_name}`);
    console.log('Employee details:', {
      ...data,
      constraints: {
        religious: data.constraints.religious,
        healthConstraints: data.constraints.healthConstraints,
        preferredArea: data.constraints.preferredArea || 'Not specified',
        constraintSummary: `Cannot sit with: ${data.constraints.cannotSitWith?.length || 0} people, ` +
                          `Must sit with: ${data.constraints.mustSitWith?.length || 0} people`
      }
    });
    
    // Call the original onSubmit handler with the form data
    onSubmit(data);
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="first_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>שם פרטי</FormLabel>
                <FormControl>
                  <Input {...field} dir="rtl" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="last_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>שם משפחה</FormLabel>
                <FormControl>
                  <Input {...field} dir="rtl" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>אימייל</FormLabel>
                <FormControl>
                  <Input {...field} type="email" dir="ltr" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel>מגדר</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="בחר מגדר" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="male">זכר</SelectItem>
                    <SelectItem value="female">נקבה</SelectItem>
                    <SelectItem value="other">אחר</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="constraints.religious"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>דתי</FormLabel>
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="constraints.healthConstraints"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>אילוצי בריאות</FormLabel>
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="constraints.requiresPrivateRoom"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>דורש חדר פרטי</FormLabel>
                </div>
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end space-x-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              ביטול
            </Button>
          )}
          <Button type="submit">שמור</Button>
        </div>
      </form>
    </Form>
  );
};
