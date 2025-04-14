import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Table, Seat } from '@/types/tables';
import { Employee } from '@/types/employee';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Users, Coffee, MapPin, Edit, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import EditTableForm from './EditTableForm';

interface TableCardProps {
  table: Table;
  seats: Seat[];
  employees: Employee[];
  onSeatClick?: (seat: Seat) => void;
  onTableUpdate?: (updatedTable: Table) => void;
}

export const TableCard: React.FC<TableCardProps> = ({
  table,
  seats,
  employees,
  onSeatClick,
  onTableUpdate
}) => {
  const [showEditDialog, setShowEditDialog] = useState(false);

  const getEmployeeForSeat = (seat: Seat) => {
    if (!seat.occupied_by) return null;
    return employees.find(emp => emp.id === seat.occupied_by);
  };

  const occupiedSeats = seats.filter(s => s.status === 'occupied').length;
  const occupancyPercentage = Math.round((occupiedSeats / table.capacity) * 100);
  
  // Get list of employees sitting at this table
  const tableEmployees = seats
    .filter(seat => seat.status === 'occupied' && seat.occupied_by)
    .map(seat => {
      const employee = getEmployeeForSeat(seat);
      return {
        seat,
        employee,
        seatPosition: seat.position
      };
    })
    .filter(item => item.employee !== null);

  // דיאלוג עריכת שולחן
  const handleSaveTable = (updatedTable: Table) => {
    setShowEditDialog(false);
    if (onTableUpdate) {
      onTableUpdate(updatedTable);
    }
  };

  return (
    <>
      <Dialog>
        <DialogTrigger>
          <Card className="w-[300px] hover:bg-gray-50 cursor-pointer transition-all duration-200 hover:shadow-md">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{table.name}</CardTitle>
                  <CardDescription>
                    {occupiedSeats} / {table.capacity} מקומות תפוסים
                  </CardDescription>
                </div>
                <Badge 
                  variant={occupancyPercentage > 80 ? "destructive" : 
                          occupancyPercentage > 50 ? "secondary" : "outline"}
                >
                  {occupancyPercentage}%
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-2">
                <Progress value={occupancyPercentage} className="h-2" />
              </div>
              <div className="flex gap-1 flex-wrap">
                {seats.map(seat => (
                  <Badge
                    key={seat.id}
                    variant={seat.status === 'available' ? 'outline' : 'default'}
                    className={`w-6 h-6 flex items-center justify-center ${seat.status === 'occupied' ? 'bg-green-600' : ''}`}
                  >
                    {seat.position}
                  </Badge>
                ))}
              </div>
            </CardContent>
            <CardFooter className="text-xs text-gray-500 flex items-center gap-2">
              <Users className="h-3 w-3" /> 
              {tableEmployees.length > 0 ? 
                `${tableEmployees.length} עובדים` : 
                'אין עובדים'}
            </CardFooter>
          </Card>
        </DialogTrigger>
        
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Coffee className="h-5 w-5" />
              {table.name} - פרטי ישיבה
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline">{table.capacity} מקומות</Badge>
              {table.location && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {table.location === 'center' ? 'מרכז' : 
                   table.location === 'window' ? 'חלון' : 'פינה'}
                </Badge>
              )}
              {table.noise_level && (
                <Badge variant="secondary">
                  {table.noise_level === 'quiet' ? 'שקט' : 
                   table.noise_level === 'moderate' ? 'רעש בינוני' : 'רועש'}
                </Badge>
              )}
            </div>
            <div className="flex gap-2 items-center">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowEditDialog(true);
                }}
                className="flex items-center gap-1"
              >
                <Pencil className="h-3 w-3" />
                ערוך שולחן
              </Button>
              <Badge 
                variant={occupancyPercentage > 80 ? "destructive" : 
                        occupancyPercentage > 50 ? "secondary" : "outline"}
                className="text-sm"
              >
                {occupancyPercentage}% תפוסה
              </Badge>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4">
            {seats.map(seat => {
              const employee = getEmployeeForSeat(seat);
              return (
                <Card
                  key={seat.id}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-all ${seat.status === 'occupied' ? 'border-green-500 border-2' : 
                                                                                   seat.status === 'available' ? 'border-dashed' : ''}`}
                  onClick={() => onSeatClick?.(seat)}
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">מושב {seat.position}</Badge>
                      <Badge
                        variant={
                          seat.status === 'available'
                            ? 'outline'
                            : seat.status === 'occupied'
                            ? 'default'
                            : 'secondary'
                        }
                        className={seat.status === 'occupied' ? 'bg-green-600' : ''}
                      >
                        {seat.status === 'available' ? 'פנוי' : 
                         seat.status === 'occupied' ? 'תפוס' : 'שמור'}
                      </Badge>
                    </div>
                    
                    {seat.location && (
                      <Badge variant="secondary" className="w-fit text-xs">
                        {seat.location === 'center' ? 'מרכז' : 
                         seat.location === 'window' ? 'חלון' : 'פינה'}
                      </Badge>
                    )}
                    
                    {employee && (
                      <div className="text-sm mt-2 p-2 bg-gray-50 rounded-md">
                        <p className="font-medium">{`${employee.first_name} ${employee.last_name}`}</p>
                        <p className="text-gray-500 text-xs">{employee.email}</p>
                        {employee.is_religious && (
                          <Badge variant="outline" className="mt-1 text-xs">דתי</Badge>
                        )}
                        {employee.has_health_constraints && (
                          <Badge variant="outline" className="mt-1 text-xs mr-1">אילוצי בריאות</Badge>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
      
      {/* דיאלוג עריכת שולחן */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              עריכת שולחן - {table.name}
            </DialogTitle>
          </DialogHeader>
          <EditTableForm 
            table={table} 
            onSave={handleSaveTable} 
            onCancel={() => setShowEditDialog(false)} 
          />
        </DialogContent>
      </Dialog>
    </>
  );
};
