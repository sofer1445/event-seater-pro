import React from 'react';
import { Workspace } from '@/types/workspace';
import { Employee } from '@/types/employee';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface WorkspaceDetailsProps {
  workspace: Workspace;
  assignedEmployee?: Employee;
  onEdit?: (workspace: Workspace) => void;
}

export const WorkspaceDetails: React.FC<WorkspaceDetailsProps> = ({
  workspace,
  assignedEmployee,
  onEdit,
}) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">פרטים</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>פרטי עמדה {workspace.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-2">מיקום</h4>
            <p>קומה {workspace.floor}</p>
            <p>חדר {workspace.room_id}</p>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2">מאפיינים</h4>
            <div className="flex flex-wrap gap-2">
              {workspace.features.map((feature) => (
                <Badge key={feature} variant="secondary">
                  {feature}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2">הגבלות</h4>
            <div className="flex flex-wrap gap-2">
              {workspace.restrictions.map((restriction) => (
                <Badge key={restriction} variant="destructive">
                  {restriction}
                </Badge>
              ))}
            </div>
          </div>

          {assignedEmployee && (
            <div>
              <h4 className="text-sm font-medium mb-2">עובד מוקצה</h4>
              <Card className="p-4">
                <p>{assignedEmployee.first_name} {assignedEmployee.last_name}</p>
                <p className="text-sm text-gray-500">{assignedEmployee.email}</p>
              </Card>
            </div>
          )}

          {onEdit && (
            <Button onClick={() => onEdit(workspace)} className="w-full">
              ערוך עמדה
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
