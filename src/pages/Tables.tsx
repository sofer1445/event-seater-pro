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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { getTables, createTable, updateTable, deleteTable } from '@/lib/api/tables';
import { Table as TableType } from '@/types/tables';

interface TableFormData {
  name: string;
  capacity: number;
  description?: string;
  gender_restriction?: 'male' | 'female' | 'none';
  religious_only?: boolean;
}

interface TableFormProps {
  initialData?: TableType;
  onSubmit: (data: TableFormData) => void;
  onCancel?: () => void;
}

const TableForm: React.FC<TableFormProps> = ({ initialData, onSubmit, onCancel }) => {
  console.log('TableForm rendered with initialData:', initialData);
  
  const [name, setName] = React.useState(initialData?.name || '');
  const [capacity, setCapacity] = React.useState(initialData?.capacity || 1);
  const [description, setDescription] = React.useState(initialData?.description || '');
  const [genderRestriction, setGenderRestriction] = React.useState<'male' | 'female' | 'none'>(
    initialData?.gender_restriction || 'none'
  );
  const [religiousOnly, setReligiousOnly] = React.useState(initialData?.religious_only || false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted');
    
    const data = {
      name,
      capacity,
      description: description || undefined,
      gender_restriction: genderRestriction === 'none' ? null : genderRestriction,
      religious_only: religiousOnly
    };
    
    console.log('Submitting data:', data);
    onSubmit(data);
    console.log('onSubmit called');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">שם השולחן</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => {
            console.log('Name changed:', e.target.value);
            setName(e.target.value);
          }}
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="capacity">קיבולת</Label>
        <Input
          id="capacity"
          type="number"
          min={1}
          value={capacity}
          onChange={(e) => {
            console.log('Capacity changed:', e.target.value);
            setCapacity(parseInt(e.target.value));
          }}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">תיאור (אופציונלי)</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="gender_restriction">הגבלת מגדר</Label>
        <select
          id="gender_restriction"
          value={genderRestriction}
          onChange={(e) => {
            console.log('Gender restriction changed:', e.target.value);
            setGenderRestriction(e.target.value as 'male' | 'female' | 'none');
          }}
          className="w-full p-2 border rounded"
        >
          <option value="none">ללא הגבלה</option>
          <option value="male">גברים בלבד</option>
          <option value="female">נשים בלבד</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="religious_only">דתיים בלבד</Label>
        <input
          type="checkbox"
          id="religious_only"
          checked={religiousOnly}
          onChange={(e) => {
            console.log('Religious only changed:', e.target.checked);
            setReligiousOnly(e.target.checked);
          }}
          className="ml-2"
        />
      </div>

      <div className="flex justify-end gap-2 mt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={() => {
            console.log('Cancel clicked');
            onCancel();
          }}>
            ביטול
          </Button>
        )}
        <Button type="submit" onClick={() => console.log('Submit button clicked')}>
          {initialData ? 'עדכן שולחן' : 'צור שולחן'}
        </Button>
      </div>
    </form>
  );
};

const Tables = () => {
  console.log('Tables component rendered');
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [editDialogOpen, setEditDialogOpen] = React.useState<{ [key: string]: boolean }>({});
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);

  // שליפת רשימת השולחנות
  const { data: tables, isLoading } = useQuery({
    queryKey: ['tables'],
    queryFn: getTables,
  });

  // יצירת שולחן חדש
  const createMutation = useMutation({
    mutationFn: (data: TableFormData) => {
      console.log('createMutation called with data:', data);
      const submissionData = {
        ...data,
        description: data.description || undefined,
        gender_restriction: data.gender_restriction === 'none' ? null : data.gender_restriction,
        religious_only: Boolean(data.religious_only)
      };
      return createTable(submissionData);
    },
    onSuccess: () => {
      console.log('Table created successfully');
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      setIsAddDialogOpen(false);
      toast({
        title: 'השולחן נוצר בהצלחה',
        variant: 'default',
      });
    },
    onError: (error) => {
      console.error('Error creating table:', error);
      toast({
        title: 'שגיאה ביצירת השולחן',
        description: error instanceof Error ? error.message : 'אנא נסה שוב',
        variant: 'destructive',
      });
    },
  });

  // עדכון שולחן
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: TableFormData }) => {
      console.log('updateMutation called with id and data:', id, data);
      const submissionData = {
        ...data,
        description: data.description || undefined,
        gender_restriction: data.gender_restriction === 'none' ? null : data.gender_restriction,
        religious_only: Boolean(data.religious_only)
      };
      return updateTable(id, submissionData);
    },
    onSuccess: (_, variables) => {
      console.log('Table updated successfully');
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      setEditDialogOpen(prev => ({ ...prev, [variables.id]: false }));
      toast({
        title: 'השולחן עודכן בהצלחה',
        variant: 'default',
      });
    },
    onError: (error) => {
      console.error('Error updating table:', error);
      toast({
        title: 'שגיאה בעדכון השולחן',
        description: error instanceof Error ? error.message : 'אנא נסה שוב',
        variant: 'destructive',
      });
    },
  });

  // מחיקת שולחן
  const deleteMutation = useMutation({
    mutationFn: deleteTable,
    onSuccess: () => {
      console.log('Table deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      toast({
        title: 'השולחן נמחק בהצלחה',
        variant: 'default',
      });
    },
    onError: (error) => {
      console.error('Error deleting table:', error);
      toast({
        title: 'שגיאה במחיקת השולחן',
        description: error instanceof Error ? error.message : 'אנא נסה שוב',
        variant: 'destructive',
      });
    },
  });

  return (
    <div className="p-4">
      <div className="mb-4">
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
          console.log('Dialog open state changed:', open);
          setIsAddDialogOpen(open);
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => console.log('Add table button clicked')}>
              הוסף שולחן
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>הוספת שולחן חדש</DialogTitle>
            </DialogHeader>
            <TableForm
              onSubmit={(data) => {
                console.log('TableForm onSubmit called with data:', data);
                createMutation.mutate(data);
              }}
              onCancel={() => {
                console.log('TableForm onCancel called');
                setIsAddDialogOpen(false);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div>טוען...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tables?.map((table) => (
            <Card key={table.id}>
              <CardHeader>
                <CardTitle>{table.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">
                    קיבולת: {table.capacity} מקומות
                  </p>
                  {table.description && (
                    <p className="text-sm">{table.description}</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {table.gender_restriction !== 'none' && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {table.gender_restriction === 'male' ? 'גברים בלבד' : 'נשים בלבד'}
                      </span>
                    )}
                    {table.religious_only && (
                      <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                        דתיים בלבד
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
              <div className="flex space-x-2 p-4">
                <Dialog
                  open={editDialogOpen[table.id]}
                  onOpenChange={(open) => {
                    console.log('Edit dialog open state changed:', open);
                    setEditDialogOpen(prev => ({ ...prev, [table.id]: open }));
                  }}
                >
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" onClick={() => console.log('Edit button clicked')}>
                      ערוך
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>עריכת שולחן</DialogTitle>
                    </DialogHeader>
                    <TableForm
                      initialData={table}
                      onSubmit={(data) => {
                        console.log('TableForm onSubmit called with data:', data);
                        updateMutation.mutate({ id: table.id, data });
                      }}
                      onCancel={() => {
                        console.log('TableForm onCancel called');
                        setEditDialogOpen(prev => ({ ...prev, [table.id]: false }));
                      }}
                    />
                  </DialogContent>
                </Dialog>
                
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    if (window.confirm('האם אתה בטוח שברצונך למחוק שולחן זה?')) {
                      console.log('Delete button clicked');
                      deleteMutation.mutate(table.id);
                    }
                  }}
                >
                  מחק
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Tables;
