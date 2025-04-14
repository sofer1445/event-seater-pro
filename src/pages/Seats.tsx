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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { getTables } from '@/lib/api/tables';
import { getTableSeats, createSeat, updateSeat, deleteSeat } from '@/lib/api/seats';
import { getEmployees } from '@/lib/api/employees';
import { TableType, Seat, Employee } from '@/types/tables';

interface SeatFormData {
  position: number;
  status: 'available' | 'occupied' | 'reserved';
  occupied_by?: string;
}

interface SeatFormProps {
  tableId: string;
  initialData?: Seat;
  employees: Employee[];
  onSubmit: (data: SeatFormData) => void;
  onCancel?: () => void;
}

const SeatForm: React.FC<SeatFormProps> = ({ tableId, initialData, employees, onSubmit, onCancel }) => {
  const [position, setPosition] = React.useState(initialData?.position || 1);
  const [status, setStatus] = React.useState<'available' | 'occupied' | 'reserved'>(
    initialData?.status || 'available'
  );
  const [occupiedBy, setOccupiedBy] = React.useState(initialData?.occupied_by || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      position,
      status,
      occupied_by: status === 'occupied' ? occupiedBy : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="position">מספר מקום</Label>
        <Input
          id="position"
          type="number"
          min={1}
          value={position}
          onChange={(e) => setPosition(parseInt(e.target.value))}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">סטטוס</Label>
        <Select
          value={status}
          onValueChange={(value: 'available' | 'occupied' | 'reserved') => {
            setStatus(value);
            if (value !== 'occupied') {
              setOccupiedBy('');
            }
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="available">פנוי</SelectItem>
            <SelectItem value="occupied">תפוס</SelectItem>
            <SelectItem value="reserved">שמור</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {status === 'occupied' && (
        <div className="space-y-2">
          <Label htmlFor="occupiedBy">תפוס על ידי</Label>
          <Select value={occupiedBy} onValueChange={setOccupiedBy}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {employees.map((employee) => (
                <SelectItem key={employee.id} value={employee.id}>
                  {employee.first_name} {employee.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

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

const Seats: React.FC = () => {
  const [selectedTable, setSelectedTable] = React.useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [selectedSeat, setSelectedSeat] = React.useState<Seat | undefined>();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tables = [] } = useQuery({
    queryKey: ['tables'],
    queryFn: getTables,
  });

  const { data: seats = [] } = useQuery({
    queryKey: ['seats', selectedTable],
    queryFn: () => getTableSeats(selectedTable),
    enabled: !!selectedTable,
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: getEmployees,
  });

  const createMutation = useMutation({
    mutationFn: ({ tableId, ...data }: { tableId: string } & SeatFormData) =>
      createSeat(tableId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seats', selectedTable] });
      toast({ title: 'מקום נוסף בהצלחה' });
      setIsDialogOpen(false);
    },
    onError: () => {
      toast({ title: 'שגיאה בהוספת מקום', variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: string } & SeatFormData) =>
      updateSeat(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seats', selectedTable] });
      toast({ title: 'מקום עודכן בהצלחה' });
      setIsDialogOpen(false);
      setSelectedSeat(undefined);
    },
    onError: () => {
      toast({ title: 'שגיאה בעדכון מקום', variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSeat,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seats', selectedTable] });
      toast({ title: 'מקום נמחק בהצלחה' });
    },
    onError: () => {
      toast({ title: 'שגיאה במחיקת מקום', variant: 'destructive' });
    },
  });

  const handleSubmit = (data: SeatFormData) => {
    if (selectedSeat) {
      updateMutation.mutate({ id: selectedSeat.id, ...data });
    } else if (selectedTable) {
      createMutation.mutate({ tableId: selectedTable, ...data });
    }
  };

  const handleEdit = (seat: Seat) => {
    setSelectedSeat(seat);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק מקום זה?')) {
      deleteMutation.mutate(id);
    }
  };

  const getEmployeeName = (id: string) => {
    const employee = employees.find(e => e.id === id);
    return employee ? `${employee.first_name} ${employee.last_name}` : 'לא ידוע';
  };

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>מקומות ישיבה</CardTitle>
          <div className="flex items-center space-x-4">
            <div className="w-[200px]">
              <Select value={selectedTable} onValueChange={setSelectedTable}>
                <SelectTrigger>
                  <SelectValue placeholder="בחר שולחן" />
                </SelectTrigger>
                <SelectContent>
                  {tables.map((table) => (
                    <SelectItem key={table.id} value={table.id}>
                      {table.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedTable && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => setSelectedSeat(undefined)}>
                    הוספת מקום
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {selectedSeat ? 'עריכת מקום' : 'הוספת מקום'}
                    </DialogTitle>
                  </DialogHeader>
                  <SeatForm
                    tableId={selectedTable}
                    initialData={selectedSeat}
                    employees={employees}
                    onSubmit={handleSubmit}
                    onCancel={() => setIsDialogOpen(false)}
                  />
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {selectedTable ? (
            seats.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>מספר מקום</TableHead>
                    <TableHead>סטטוס</TableHead>
                    <TableHead>תפוס על ידי</TableHead>
                    <TableHead>פעולות</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {seats.map((seat) => (
                    <TableRow key={seat.id}>
                      <TableCell>{seat.position}</TableCell>
                      <TableCell>
                        {seat.status === 'available' && 'פנוי'}
                        {seat.status === 'occupied' && 'תפוס'}
                        {seat.status === 'reserved' && 'שמור'}
                      </TableCell>
                      <TableCell>
                        {seat.occupied_by ? getEmployeeName(seat.occupied_by) : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(seat)}
                          >
                            עריכה
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(seat.id)}
                          >
                            מחיקה
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8">
                <p>אין מקומות ישיבה בשולחן זה</p>
                <p className="text-sm text-gray-500">לחץ על 'הוספת מקום' כדי להתחיל</p>
              </div>
            )
          ) : (
            <div className="text-center py-8">
              <p>בחר שולחן כדי לצפות במקומות הישיבה</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Seats;
