import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EmployeeForm } from '@/components/employees/EmployeeForm';
import { getEmployees, createEmployee, updateEmployee, deleteEmployee } from '@/lib/api/employees';
import { useToast } from '@/components/ui/use-toast';
import { Employee } from '@/types/employee';

const Employees = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [editingEmployee, setEditingEmployee] = React.useState<Employee | null>(null);

  // שליפת רשימת העובדים
  const { data: employees, isLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: getEmployees,
  });

  // הוספת עובד חדש
  const createMutation = useMutation({
    mutationFn: createEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setIsAddDialogOpen(false);
      toast({
        title: 'העובד נוסף בהצלחה',
        variant: 'default',
      });
    },
    onError: (error) => {
      toast({
        title: 'שגיאה בהוספת העובד',
        description: error instanceof Error ? error.message : 'אנא נסה שוב',
        variant: 'destructive',
      });
    },
  });

  // עדכון עובד קיים
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Employee> }) =>
      updateEmployee(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setEditingEmployee(null);
      toast({
        title: 'העובד עודכן בהצלחה',
        variant: 'default',
      });
    },
    onError: (error) => {
      toast({
        title: 'שגיאה בעדכון העובד',
        description: error instanceof Error ? error.message : 'אנא נסה שוב',
        variant: 'destructive',
      });
    },
  });

  // מחיקת עובד
  const deleteMutation = useMutation({
    mutationFn: deleteEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast({
        title: 'העובד נמחק בהצלחה',
        variant: 'default',
      });
    },
    onError: (error) => {
      toast({
        title: 'שגיאה במחיקת העובד',
        description: error instanceof Error ? error.message : 'אנא נסה שוב',
        variant: 'destructive',
      });
    },
  });

  if (isLoading) {
    return <div>טוען...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">ניהול עובדים</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>הוסף עובד</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>הוספת עובד חדש</DialogTitle>
            </DialogHeader>
            <EmployeeForm
              onSubmit={(data) => createMutation.mutate(data)}
              onCancel={() => setIsAddDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {employees?.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-gray-500">אין עובדים במערכת</p>
          <p className="text-sm text-gray-400">לחץ על 'הוסף עובד' כדי להתחיל</p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>שם</TableHead>
                <TableHead>אימייל</TableHead>
                <TableHead>מגדר</TableHead>
                <TableHead>רמת דתיות</TableHead>
                <TableHead>פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees?.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell>
                    {employee.first_name} {employee.last_name}
                  </TableCell>
                  <TableCell>{employee.email}</TableCell>
                  <TableCell>
                    {employee.gender === 'male' ? 'זכר' :
                     employee.gender === 'female' ? 'נקבה' : 'אחר'}
                  </TableCell>
                  <TableCell>
                    {employee.religious_level === 'secular' ? 'חילוני' :
                     employee.religious_level === 'traditional' ? 'מסורתי' :
                     employee.religious_level === 'religious' ? 'דתי' : 'חרדי'}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingEmployee(employee)}
                          >
                            ערוך
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>עריכת עובד</DialogTitle>
                          </DialogHeader>
                          <EmployeeForm
                            initialData={employee}
                            onSubmit={(data) =>
                              updateMutation.mutate({ id: employee.id, data })
                            }
                            onCancel={() => setEditingEmployee(null)}
                          />
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          if (window.confirm('האם אתה בטוח שברצונך למחוק עובד זה?')) {
                            deleteMutation.mutate(employee.id);
                          }
                        }}
                      >
                        מחק
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default Employees;
