import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { allocateSeats, validateAllocation, AllocationResult, applyAllocations } from '@/utils/allocationAlgorithm';
import { getEmployees } from '@/lib/api/employees';
import { getTables } from '@/lib/api/tables';
import { getTableSeats, updateSeat } from '@/lib/api/seats';
import { toast } from '@/components/ui/use-toast';
import { Table, Seat } from '@/types/tables';
import { Employee } from '@/types/employee';
import { Loader2, User, Coffee, Check, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import AllocationStatus from '@/components/allocation/AllocationStatus';

const Allocations = () => {
  const queryClient = useQueryClient();
  const [allocations, setAllocations] = React.useState<AllocationResult[]>([]);
  const [isCalculating, setIsCalculating] = React.useState(false);
  const [constraints, setConstraints] = React.useState({
    respectGender: true,
    respectHealth: true,
    prioritizeTeamProximity: true,
    maxCapacityPercentage: 90
  });
  const [allSeats, setAllSeats] = React.useState<Seat[]>([]);
  const [isApplyingAllocations, setIsApplyingAllocations] = React.useState(false);
  const [appliedAllocations, setAppliedAllocations] = React.useState(0);

  // Enhanced data fetching with stale time and refetch settings
  const { data: employees, isLoading: employeesLoading, error: employeesError } = useQuery<Employee[]>({
    queryKey: ['employees'],
    queryFn: getEmployees,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true,
    retry: 3
  });

  const { data: tables, isLoading: tablesLoading, error: tablesError } = useQuery<Table[]>({
    queryKey: ['tables'],
    queryFn: getTables,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true,
    retry: 3
  });

  const { data: seats, isLoading: seatsLoading, error: seatsError } = useQuery<Seat[]>({
    queryKey: ['seats'],
    queryFn: async () => {
      if (!tables) return [];
      const allSeats: Seat[] = [];
      for (const table of tables) {
        console.log(`Fetching seats for table ${table.id}`);
        const tableSeats = await getTableSeats(table.id);
        console.log(`Received ${tableSeats.length} seats for table ${table.id}`);
        allSeats.push(...tableSeats);
      }
      console.log(`Total seats fetched: ${allSeats.length}`);
      return allSeats;
    },
    enabled: !!tables,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true,
    retry: 3
  });

  const applyAllocationsMutation = useMutation({
    mutationFn: async (allocations: AllocationResult[]) => {
      setIsApplyingAllocations(true);
      try {
        console.log(`Applying ${allocations.length} allocations...`);
        const results = await applyAllocations(allocations);
        console.log(`Successfully applied ${results.length} allocations`);
        return results;
      } catch (error) {
        console.error('Error applying allocations:', error);
        throw error;
      } finally {
        setIsApplyingAllocations(false);
      }
    },
    onSuccess: () => {
      toast({
        title: 'הצלחה',
        description: 'הקצאות הוחלו בהצלחה',
        variant: 'default',
      });
      refreshDashboard();
    },
    onError: (error) => {
      console.error('Error in applyAllocationsMutation:', error);
      toast({
        title: 'שגיאה',
        description: 'שגיאה בהחלת הקצאות',
        variant: 'destructive',
      });
    }
  });

  // Error handling and data validation effect
  React.useEffect(() => {
    // Handle errors
    if (employeesError) {
      console.error('Error loading employees:', employeesError);
      toast({
        title: 'שגיאה בטעינת עובדים',
        description: 'אירעה שגיאה בטעינת נתוני העובדים',
        variant: 'destructive'
      });
    }
    
    if (tablesError) {
      console.error('Error loading tables:', tablesError);
      toast({
        title: 'שגיאה בטעינת שולחנות',
        description: 'אירעה שגיאה בטעינת נתוני השולחנות',
        variant: 'destructive'
      });
    }
    
    if (seatsError) {
      console.error('Error loading seats:', seatsError);
      toast({
        title: 'שגיאה בטעינת מקומות ישיבה',
        description: 'אירעה שגיאה בטעינת נתוני המקומות',
        variant: 'destructive'
      });
    }
    
    // Validate loaded data
    if (employees && tables && seats) {
      console.log(`Data loaded: ${employees.length} employees, ${tables.length} tables, ${seats.length} seats`);
      
      // Check for data integrity
      const employeeIds = employees.map(e => e.id);
      const tableIds = tables.map(t => t.id);
      const seatIds = seats.map(s => s.id);
      
      console.log('Employee IDs sample:', employeeIds.slice(0, 5));
      console.log('Table IDs sample:', tableIds.slice(0, 5));
      console.log('Seat IDs sample:', seatIds.slice(0, 5));
      
      // Update local state
      setAllSeats(seats);
    }
  }, [employees, tables, seats, employeesError, tablesError, seatsError, toast]);

  const handleCalculateAllocation = async () => {
    if (!employees || employees.length === 0 || !tables || tables.length === 0 || !seats || seats.length === 0) {
      toast({
        title: 'אזהרה',
        description: 'אין מספיק נתונים להקצאה אוטומטית',
        variant: 'default'
      });
      return;
    }

    setIsCalculating(true);
    try {
      const newAllocations = await new Promise<AllocationResult[]>((resolve) => {
        setTimeout(() => {
          const result = allocateSeats(employees, tables, seats, constraints);
          resolve(result);
        }, 0);
      });

      if (newAllocations.length === 0) {
        toast({
          title: "שגיאה בהקצאה",
          description: "לא ניתן למצוא פתרון שמתאים לכל האילוצים",
          variant: "destructive"
        });
        return;
      }

      let allValid = true;
      const invalidAllocations: string[] = [];

      for (const allocation of newAllocations) {
        const validationResult = validateAllocation(
          allocation,
          employees,
          tables,
          seats,
          constraints
        );

        if (!validationResult.valid) {
          allValid = false;
          const employee = employees.find(e => e.id === allocation.employeeId);
          invalidAllocations.push(`${getEmployeeFullName(allocation.employeeId)}: ${validationResult.issues.join(', ')}`);
        }
      }

      if (!allValid) {
        toast({
          title: "אזהרה בהקצאה",
          description: `חלק מההקצאות אינן אופטימליות: ${invalidAllocations.join(' | ')}`,
          variant: "destructive"
        });
      }

      setAllocations(newAllocations);
      toast({
        title: "ההקצאה בוצעה בהצלחה",
        description: `הוקצו ${newAllocations.length} מקומות ישיבה`
      });
    } catch (error) {
      console.error('Failed to calculate allocation:', error);
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בחישוב ההקצאות",
        variant: "destructive"
      });
    } finally {
      setIsCalculating(false);
    }
  };

  const handleApplyAllocations = async () => {
    if (!allocations.length) {
      toast({
        title: 'אזהרה',
        description: 'אין הקצאות להחלה',
        variant: 'default'
      });
      return;
    }

    try {
      console.log(`Applying ${allocations.length} allocations to database...`);
      console.log('Allocation data:', JSON.stringify(allocations));
      
      toast({
        title: 'מחיל הקצאות',
        description: 'מחיל הקצאות מקומות ישיבה למסד הנתונים...',
        variant: 'default'
      });
      
      // Reset applied counter and set the applying state
      setAppliedAllocations(0);
      setIsApplyingAllocations(true);
      
      // Directly call applyAllocations instead of using the mutation
      // This bypasses any potential issues with the mutation
      const results = await applyAllocations(allocations);
      
      // Update applied counter with final results
      setAppliedAllocations(results.length);
      console.log(`Successfully applied ${results.length} of ${allocations.length} allocations`);
      
      toast({
        title: 'הצלחה',
        description: `${results.length} הקצאות הוחלו בהצלחה`,
        variant: 'default'
      });
      
      // Explicitly refresh the dashboard after applying allocations
      console.log('Refreshing dashboard after applying allocations...');
      await refreshDashboard();
      
    } catch (error) {
      console.error('Error applying allocations:', error);
      toast({
        title: 'שגיאה',
        description: 'אירעה שגיאה בהחלת ההקצאות',
        variant: 'destructive'
      });
    } finally {
      setIsApplyingAllocations(false);
    }
  };

  const isLoading = employeesLoading || tablesLoading || seatsLoading;

  const allocationsByTable = React.useMemo(() => {
    if (!allocations.length || !tables) return {};
    
    return allocations.reduce((acc, allocation) => {
      const tableId = allocation.tableId;
      if (!acc[tableId]) {
        acc[tableId] = [];
      }
      acc[tableId].push(allocation);
      return acc;
    }, {} as Record<string, AllocationResult[]>);
  }, [allocations, tables]);

  const getSeatDetails = (seatId: string) => {
    const seat = seats?.find(s => s.id === seatId);
    return seat ? `מושב ${seat.position}` : 'מושב לא ידוע';
  };

  const getEmployeeFullName = (employeeId: string | null | undefined) => {
    if (!employeeId || !employees) return 'עובד לא ידוע';
    
    const employee = employees.find(e => e.id === employeeId);
    if (!employee) return 'עובד לא ידוע';
    
    // Create full name from first_name and last_name
    return `${employee.first_name} ${employee.last_name}`;
  };

  const refreshDashboard = async () => {
    console.log('Refreshing dashboard data after allocation changes...');
    
    try {
      // Force refetch all relevant data
      await queryClient.invalidateQueries({ queryKey: ['seats'] });
      await queryClient.invalidateQueries({ queryKey: ['tables'] });
      
      // Then force refetch to ensure we get fresh data
      await queryClient.refetchQueries({ queryKey: ['seats'], exact: false });
      await queryClient.refetchQueries({ queryKey: ['tables'], exact: false });
      
      // Manually refetch the seats to ensure we have the latest data
      if (tables) {
        console.log(`Refreshing data for ${tables.length} tables and their seats...`);
        const freshSeats: Seat[] = [];
        
        for (const table of tables) {
          try {
            const tableSeats = await getTableSeats(table.id);
            freshSeats.push(...tableSeats);
          } catch (error) {
            console.error(`Error fetching seats for table ${table.id}:`, error);
          }
        }
        
        // Update the local state with the newly fetched seats
        if (freshSeats.length > 0) {
          setAllSeats(freshSeats);
          
          // Log allocation status summary
          const occupiedSeats = freshSeats.filter(s => s.status === 'occupied' && s.occupied_by).length;
          const availableSeats = freshSeats.length - occupiedSeats;
          console.log(`Dashboard refreshed with ${freshSeats.length} total seats:`);
          console.log(`- Occupied: ${occupiedSeats} seats (${((occupiedSeats/freshSeats.length)*100).toFixed(1)}%)`);
          console.log(`- Available: ${availableSeats} seats (${((availableSeats/freshSeats.length)*100).toFixed(1)}%)`);
        }
      }
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
      toast({
        title: 'שגיאה ברענון הנתונים',
        description: 'אירעה שגיאה בעת רענון נתוני הדף',
        variant: 'destructive'
      });
    }
  };

  // Automatically refresh dashboard when allocations change
  React.useEffect(() => {
    if (allocations.length > 0) {
      console.log('Allocations changed, refreshing dashboard...');
      // Brief timeout to allow UI to update first
      const timer = setTimeout(() => refreshDashboard(), 500);
      return () => clearTimeout(timer);
    }
  }, [allocations]);

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>הקצאת מקומות ישיבה</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isLoading && (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-8 w-8 animate-spin mr-2" />
                <p>טוען נתונים...</p>
              </div>
            )}

            {!isLoading && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center">
                      <User className="h-5 w-5 mr-2 text-blue-500" />
                      <div>
                        <p className="text-sm text-muted-foreground">עובדים</p>
                        <p className="text-2xl font-bold">{employees?.length || 0}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center">
                      <Coffee className="h-5 w-5 mr-2 text-amber-500" />
                      <div>
                        <p className="text-sm text-muted-foreground">שולחנות</p>
                        <p className="text-2xl font-bold">{tables?.length || 0}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center">
                      <div>
                        <p className="text-sm text-muted-foreground">מקומות ישיבה</p>
                        <p className="text-2xl font-bold">{seats?.length || 0}</p>
                        <p className="text-xs text-muted-foreground">
                          {seats?.filter(s => s.status === 'available').length || 0} פנויים
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            <div className="grid gap-4 mb-6">
              <h3 className="text-lg font-semibold">אילוצי הקצאה:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="gender"
                    checked={constraints.respectGender}
                    onCheckedChange={(checked) =>
                      setConstraints(prev => ({ ...prev, respectGender: !!checked }))
                    }
                  />
                  <Label htmlFor="gender">התחשבות במגבלות מגדר</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="health"
                    checked={constraints.respectHealth}
                    onCheckedChange={(checked) =>
                      setConstraints(prev => ({ ...prev, respectHealth: !!checked }))
                    }
                  />
                  <Label htmlFor="health">התחשבות במגבלות בריאות</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="team"
                    checked={constraints.prioritizeTeamProximity}
                    onCheckedChange={(checked) =>
                      setConstraints(prev => ({ ...prev, prioritizeTeamProximity: !!checked }))
                    }
                  />
                  <Label htmlFor="team">תעדוף קרבה לחברי צוות</Label>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <AllocationStatus
                seats={allSeats}
                appliedAllocations={appliedAllocations}
                totalAllocations={allocations.length}
                isApplying={isApplyingAllocations}
              />
            </div>

            <div className="flex gap-4 mb-6">
              <Button
                onClick={handleCalculateAllocation}
                disabled={isLoading || isCalculating}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isCalculating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                חשב הקצאות
              </Button>
              
              <Button
                onClick={handleApplyAllocations}
                disabled={!allocations.length || isApplyingAllocations}
                variant="outline"
                className="border-green-600 text-green-600 hover:bg-green-50"
              >
                {isApplyingAllocations && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                החל הקצאות
              </Button>
            </div>

            {allocations.length > 0 && (
              <div className="mt-4">
                <h3 className="text-xl font-semibold mb-4">תוצאות ההקצאה:</h3>
                
                <Accordion type="single">
                  <AccordionItem value="by-table">
                    <AccordionTrigger>לפי שולחן</AccordionTrigger>
                    <AccordionContent>
                      <div className="grid gap-4">
                        {Object.entries(allocationsByTable).map(([tableId, tableAllocations]) => {
                          const table = tables?.find(t => t.id === tableId);
                          return (
                            <Card key={tableId}>
                              <CardHeader className="pb-2">
                                <CardTitle className="text-lg">
                                  שולחן {table?.name || 'לא ידוע'}
                                  <Badge className="ml-2" variant="outline">
                                    {tableAllocations.length} מקומות
                                  </Badge>
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                  {tableAllocations.map((allocation) => {
                                    const employee = employees?.find(e => e.id === allocation.employeeId);
                                    const seat = seats?.find(s => s.id === allocation.seatId);
                                    return (
                                      <div key={allocation.seatId} className="p-2 border rounded flex items-center">
                                        <div className="flex-1">
                                          <p className="font-medium">{getEmployeeFullName(allocation.employeeId)}</p>
                                          <p className="text-sm text-muted-foreground">
                                            מושב {seat?.position || '?'} | ניקוד: {allocation.score}
                                          </p>
                                        </div>
                                        <Check className="h-5 w-5 text-green-500" />
                                      </div>
                                    );
                                  })}
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="by-employee">
                    <AccordionTrigger>לפי עובד</AccordionTrigger>
                    <AccordionContent>
                      <div className="grid gap-2">
                        {allocations.map((allocation) => {
                          const employee = employees?.find(e => e.id === allocation.employeeId);
                          const table = tables?.find(t => t.id === allocation.tableId);
                          const seat = seats?.find(s => s.id === allocation.seatId);
                          
                          return (
                            <Card key={allocation.employeeId} className="overflow-hidden">
                              <div className="p-4 border-l-4 border-blue-500 flex justify-between items-center">
                                <div>
                                  <h4 className="font-semibold">{getEmployeeFullName(allocation.employeeId)}</h4>
                                  <p className="text-sm">
                                    שולחן {table?.name || '?'} | {getSeatDetails(allocation.seatId)}
                                  </p>
                                  {employee?.team && (
                                    <Badge variant="outline" className="mt-1">
                                      צוות: {employee.team}
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-right">
                                  <Badge variant={allocation.score > 80 ? "secondary" : "destructive"}>
                                    ניקוד: {allocation.score}
                                  </Badge>
                                </div>
                              </div>
                            </Card>
                          );
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            )}
            
            {!isLoading && !allocations.length && (
              <div className="p-8 text-center border rounded-lg">
                <AlertCircle className="h-10 w-10 text-amber-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold">אין הקצאות פעילות</h3>
                <p className="text-muted-foreground">לחץ על 'חשב הקצאות' כדי להתחיל</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Allocations;
