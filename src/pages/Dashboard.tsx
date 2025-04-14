import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getEmployees } from '@/lib/api/employees';
import { getTables } from '@/lib/api/tables';
import { getTableSeats } from '@/lib/api/seats';
import { Table, TableHead, TableHeader, TableRow, TableBody, TableCell } from '@/components/ui/table';
import { Loader2, User, Coffee, Check, AlertCircle } from 'lucide-react';

const Dashboard = () => {
  const { data: employees = [], isLoading: employeesLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: getEmployees,
    refetchInterval: 10000 // Refetch every 10 seconds
  });

  const { data: tables = [], isLoading: tablesLoading } = useQuery({
    queryKey: ['tables'],
    queryFn: getTables,
    refetchInterval: 10000 // Refetch every 10 seconds
  });

  const { data: allSeats = [], isLoading: seatsLoading } = useQuery({
    queryKey: ['dashboard-seats'],
    queryFn: async () => {
      if (!tables.length) return [];
      let allSeats = [];
      for (const table of tables) {
        const tableSeats = await getTableSeats(table.id);
        allSeats.push(...tableSeats);
      }
      return allSeats;
    },
    enabled: tables.length > 0,
    refetchInterval: 10000 // Refetch every 10 seconds
  });

  // חישוב סטטיסטיקות
  const totalEmployees = employees.length;
  const religiousEmployees = employees.filter(e => e.is_religious).length;
  const healthConstraintsEmployees = employees.filter(e => e.has_health_constraints).length;
  
  const totalSeats = tables.reduce((acc, table) => acc + table.capacity, 0);
  const occupiedSeats = allSeats.filter(seat => seat.status === 'occupied').length;
  const availableSeats = totalSeats - occupiedSeats;

  // חישוב נתוני תפוסה לכל שולחן
  const tableOccupancy = tables.map(table => {
    const tableSeats = allSeats.filter(seat => seat.table_id === table.id);
    const occupiedTableSeats = tableSeats.filter(seat => seat.status === 'occupied');
    const occupiedByEmployees = occupiedTableSeats.map(seat => {
      const employee = employees.find(emp => emp.id === seat.occupied_by);
      return employee ? `${employee.first_name} ${employee.last_name}` : 'לא ידוע';
    });
    
    return {
      ...table,
      totalSeats: tableSeats.length,
      occupiedSeats: occupiedTableSeats.length,
      occupancyPercentage: tableSeats.length > 0 ? 
        Math.round((occupiedTableSeats.length / tableSeats.length) * 100) : 0,
      occupiedBy: occupiedByEmployees
    };
  });

  const isLoading = employeesLoading || tablesLoading || seatsLoading;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">דשבורד ניהול מקומות ישיבה</h1>
      
      {isLoading ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <p>טוען נתונים...</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>סה"כ עובדים</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{totalEmployees}</p>
                <p className="text-sm text-gray-500">רשומים במערכת</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>מקומות פנויים</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{availableSeats}</p>
                <p className="text-sm text-gray-500">מתוך {totalSeats} מקומות</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>תפוסה</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {totalSeats ? Math.round((occupiedSeats / totalSeats) * 100) : 0}%
                </p>
                <p className="text-sm text-gray-500">{occupiedSeats} מקומות תפוסים</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>עובדים עם אילוצים דתיים</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{religiousEmployees}</p>
                <p className="text-sm text-gray-500">דורשים הפרדה מגדרית</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>עובדים עם אילוצי בריאות</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{healthConstraintsEmployees}</p>
                <p className="text-sm text-gray-500">דורשים התאמות מיוחדות</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>שולחנות</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{tables.length}</p>
                <p className="text-sm text-gray-500">במערכת</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>תפוסת שולחנות</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>שם שולחן</TableHead>
                    <TableHead>קיבולת</TableHead>
                    <TableHead>תפוסה</TableHead>
                    <TableHead>אחוז תפוסה</TableHead>
                    <TableHead>עובדים</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tableOccupancy.map(table => (
                    <TableRow key={table.id}>
                      <TableCell className="font-medium">{table.name}</TableCell>
                      <TableCell>{table.capacity}</TableCell>
                      <TableCell>{table.occupiedSeats}/{table.totalSeats}</TableCell>
                      <TableCell>{table.occupancyPercentage}%</TableCell>
                      <TableCell>
                        <div className="max-h-24 overflow-y-auto">
                          {table.occupiedBy.length > 0 ? (
                            <ul className="list-disc list-inside">
                              {table.occupiedBy.map((name, idx) => (
                                <li key={idx}>{name}</li>
                              ))}
                            </ul>
                          ) : (
                            <span className="text-gray-500">אין עובדים</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default Dashboard;
