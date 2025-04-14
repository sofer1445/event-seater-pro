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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { getEmployees, createEmployee, updateEmployee, deleteEmployee } from '@/lib/api/employees';
import { Employee } from '@/types/employee';

interface EmployeeFormData {
  first_name: string;
  last_name: string;
  email: string;
  is_religious?: boolean;
  has_health_constraints?: boolean;
}

interface EmployeeFormProps {
  initialData?: Employee;
  onSubmit: (data: EmployeeFormData) => void;
  onCancel?: () => void;
}

const EmployeeForm: React.FC<EmployeeFormProps> = ({ initialData, onSubmit, onCancel }) => {
  const [firstName, setFirstName] = React.useState(initialData?.first_name || '');
  const [lastName, setLastName] = React.useState(initialData?.last_name || '');
  const [email, setEmail] = React.useState(initialData?.email || '');
  const [isReligious, setIsReligious] = React.useState(initialData?.is_religious || false);
  const [hasHealthConstraints, setHasHealthConstraints] = React.useState(initialData?.has_health_constraints || false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      first_name: firstName,
      last_name: lastName,
      email,
      is_religious: isReligious,
      has_health_constraints: hasHealthConstraints,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="firstName">שם פרטי</Label>
        <Input
          id="firstName"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="lastName">שם משפחה</Label>
        <Input
          id="lastName"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="email">אימייל</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox
          id="isReligious"
          checked={isReligious}
          onCheckedChange={(checked) => setIsReligious(checked as boolean)}
        />
        <Label htmlFor="isReligious">דתי/ה</Label>
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox
          id="hasHealthConstraints"
          checked={hasHealthConstraints}
          onCheckedChange={(checked) => setHasHealthConstraints(checked as boolean)}
        />
        <Label htmlFor="hasHealthConstraints">מגבלות בריאותיות</Label>
      </div>
      
      <div className="flex justify-end space-x-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            ביטול
          </Button>
        )}
        <Button type="submit">
          {initialData ? 'עדכון' : 'הוספה'}
        </Button>
      </div>
    </form>
  );
};

const Employees: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [selectedEmployee, setSelectedEmployee] = React.useState<Employee | undefined>();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: getEmployees,
  });

  const createMutation = useMutation({
    mutationFn: createEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast({ title: 'עובד נוסף בהצלחה' });
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      if (error.status === 409) {
        toast({ 
          title: 'עובד עם אימייל זה כבר קיים במערכת', 
          description: 'נא להשתמש באימייל אחר או לערוך את העובד הקיים',
          variant: 'destructive' 
        });
      } else {
        toast({ title: 'שגיאה בהוספת עובד', variant: 'destructive' });
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: string } & EmployeeFormData) =>
      updateEmployee(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast({ title: 'עובד עודכן בהצלחה' });
      setIsDialogOpen(false);
      setSelectedEmployee(undefined);
    },
    onError: () => {
      toast({ title: 'שגיאה בעדכון עובד', variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast({ title: 'עובד נמחק בהצלחה' });
    },
    onError: () => {
      toast({ title: 'שגיאה במחיקת עובד', variant: 'destructive' });
    },
  });

  const handleSubmit = (data: EmployeeFormData) => {
    if (selectedEmployee) {
      updateMutation.mutate({ id: selectedEmployee.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק עובד זה?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>עובדים</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setSelectedEmployee(undefined)}>
                הוספת עובד
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {selectedEmployee ? 'עריכת עובד' : 'הוספת עובד'}
                </DialogTitle>
              </DialogHeader>
              <EmployeeForm
                initialData={selectedEmployee}
                onSubmit={handleSubmit}
                onCancel={() => setIsDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>שם פרטי</TableHead>
                <TableHead>שם משפחה</TableHead>
                <TableHead>אימייל</TableHead>
                <TableHead>דתי/ה</TableHead>
                <TableHead>מגבלות בריאותיות</TableHead>
                <TableHead>פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell>{employee.first_name}</TableCell>
                  <TableCell>{employee.last_name}</TableCell>
                  <TableCell>{employee.email}</TableCell>
                  <TableCell>{employee.is_religious ? 'כן' : 'לא'}</TableCell>
                  <TableCell>{employee.has_health_constraints ? 'כן' : 'לא'}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(employee)}
                      >
                        עריכה
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(employee.id)}
                      >
                        מחיקה
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Employees;
