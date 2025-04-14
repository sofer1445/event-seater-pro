import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Room } from '@/types/workspace';

const formSchema = z.object({
  name: z.string().min(1, 'שם החדר נדרש'),
  floor: z.number().min(1, 'מספר קומה נדרש'),
  capacity: z.number().min(1, 'קיבולת החדר נדרשת'),
  description: z.string().optional(),
});

interface RoomFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Room) => void;
}

export const RoomForm: React.FC<RoomFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      floor: 1,
      capacity: 1,
      description: '',
    },
  });

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    // Ensure all required fields are present in the room object
    const room: Room = {
      id: crypto.randomUUID(),
      name: values.name,
      floor: values.floor,
      capacity: values.capacity,
      description: values.description,
      gender_restriction: null,
      features: [], // Add empty features array
      coordinates: { x: 0, y: 0 },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    onSubmit(room);
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>הוספת חדר חדש</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>שם החדר</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="floor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>קומה</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      {...field} 
                      onChange={e => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="capacity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>קיבולת (מספר מקומות ישיבה)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      {...field}
                      onChange={e => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>תיאור (אופציונלי)</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end space-x-2">
              <Button type="submit">הוסף חדר</Button>
              <Button variant="outline" onClick={onClose}>
                ביטול
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
