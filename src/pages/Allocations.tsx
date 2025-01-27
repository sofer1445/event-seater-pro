import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { getAllocations, cancelAllocation } from '@/lib/api/allocations';
import { getEmployees } from '@/lib/api/employees';
import { getWorkspaces } from '@/lib/api/workspaces';
import { Allocation } from '@/types/allocation';
import { Employee } from '@/types/employee';
import { Workspace } from '@/types/workspace';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { CreateAllocationForm } from '@/components/allocation/CreateAllocationForm';
import { EditAllocationForm } from '@/components/allocation/EditAllocationForm';
import { useToast } from '@/components/ui/use-toast';
import { useQueryClient } from '@tanstack/react-query';

const statusColors = {
  active: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
} as const;

const statusLabels = {
  active: 'פעיל',
  pending: 'ממתין',
  completed: 'הושלם',
  cancelled: 'בוטל',
} as const;

const Allocations = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingAllocation, setEditingAllocation] = useState<Allocation | null>(null);
  const [cancellingAllocation, setCancellingAllocation] = useState<Allocation | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: allocations, isLoading: isLoadingAllocations } = useQuery({
    queryKey: ['allocations'],
    queryFn: getAllocations
  });

  const { data: employees, isLoading: isLoadingEmployees } = useQuery({
    queryKey: ['employees'],
    queryFn: getEmployees
  });

  const { data: workspaces, isLoading: isLoadingWorkspaces } = useQuery({
    queryKey: ['workspaces'],
    queryFn: getWorkspaces
  });

  const isLoading = isLoadingAllocations || isLoadingEmployees || isLoadingWorkspaces;

  const getEmployeeName = (employeeId: string) => {
    const employee = employees?.find((e: Employee) => e.id === employeeId);
    return employee ? `${employee.first_name} ${employee.last_name}` : 'לא נמצא';
  };

  const getWorkspaceName = (workspaceId: string) => {
    const workspace = workspaces?.find((w: Workspace) => w.id === workspaceId);
    return workspace ? `${workspace.name} - ${workspace.room} (קומה ${workspace.floor})` : 'לא נמצא';
  };

  const handleCancelAllocation = async (allocation: Allocation) => {
    try {
      await cancelAllocation(allocation.id);
      queryClient.invalidateQueries({ queryKey: ['allocations'] });
      toast({
        title: 'הקצאה בוטלה בהצלחה',
        description: 'ההקצאה בוטלה במערכת',
      });
      setCancellingAllocation(null);
    } catch (error) {
      console.error('Failed to cancel allocation:', error);
      toast({
        title: 'שגיאה',
        description: 'אירעה שגיאה בביטול ההקצאה',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">טוען...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">הקצאות מקומות</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>הקצאה חדשה</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>יצירת הקצאת מקום חדשה</DialogTitle>
            </DialogHeader>
            <CreateAllocationForm onSuccess={() => setIsCreateDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>
      
      {allocations && allocations.length > 0 ? (
        <Card>
          <CardContent className="p-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>עובד</TableHead>
                  <TableHead>מקום ישיבה</TableHead>
                  <TableHead>תאריך התחלה</TableHead>
                  <TableHead>תאריך סיום</TableHead>
                  <TableHead>סטטוס</TableHead>
                  <TableHead>פעולות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allocations.map((allocation: Allocation) => (
                  <TableRow key={allocation.id}>
                    <TableCell>{getEmployeeName(allocation.employee_id)}</TableCell>
                    <TableCell>{getWorkspaceName(allocation.workspace_id)}</TableCell>
                    <TableCell>
                      {format(new Date(allocation.start_date), 'dd/MM/yyyy', { locale: he })}
                    </TableCell>
                    <TableCell>
                      {allocation.end_date && 
                        format(new Date(allocation.end_date), 'dd/MM/yyyy', { locale: he })}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[allocation.status]}>
                        {statusLabels[allocation.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setEditingAllocation(allocation)}
                      >
                        ערוך
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-600"
                        onClick={() => setCancellingAllocation(allocation)}
                        disabled={allocation.status === 'cancelled'}
                      >
                        בטל
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-gray-500">
              אין הקצאות פעילות
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog 
        open={!!cancellingAllocation} 
        onOpenChange={(open) => !open && setCancellingAllocation(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ביטול הקצאת מקום</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>האם אתה בטוח שברצונך לבטל את ההקצאה הזו?</p>
            {cancellingAllocation && (
              <p className="mt-2 text-sm text-gray-500">
                הקצאה של {getEmployeeName(cancellingAllocation.employee_id)} למקום {getWorkspaceName(cancellingAllocation.workspace_id)}
              </p>
            )}
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setCancellingAllocation(null)}
            >
              ביטול
            </Button>
            <Button
              variant="destructive"
              onClick={() => cancellingAllocation && handleCancelAllocation(cancellingAllocation)}
            >
              בטל הקצאה
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingAllocation} onOpenChange={(open) => !open && setEditingAllocation(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>עריכת הקצאת מקום</DialogTitle>
          </DialogHeader>
          {editingAllocation && (
            <EditAllocationForm 
              allocation={editingAllocation} 
              onSuccess={() => setEditingAllocation(null)} 
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Allocations;
