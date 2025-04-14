import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Employee } from '@/types/employee';
import { Workspace } from '@/types/workspace';

interface ConstraintsManagerProps {
  employee: Employee;
  workspace: Workspace;
  constraints: {
    gender: boolean;
    religious: boolean;
    health: boolean;
    schedule: boolean;
  };
}

export const ConstraintsManager: React.FC<ConstraintsManagerProps> = ({
  employee,
  workspace,
  constraints,
}) => {
  const getConstraintColor = (isValid: boolean) =>
    isValid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">בדיקת אילוצים</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">מגדר</p>
            <Badge variant="outline" className={getConstraintColor(constraints.gender)}>
              {constraints.gender ? 'תואם' : 'לא תואם'}
            </Badge>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">דתיות</p>
            <Badge variant="outline" className={getConstraintColor(constraints.religious)}>
              {constraints.religious ? 'תואם' : 'לא תואם'}
            </Badge>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">בריאות</p>
            <Badge variant="outline" className={getConstraintColor(constraints.health)}>
              {constraints.health ? 'תואם' : 'לא תואם'}
            </Badge>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">לוח זמנים</p>
            <Badge variant="outline" className={getConstraintColor(constraints.schedule)}>
              {constraints.schedule ? 'תואם' : 'לא תואם'}
            </Badge>
          </div>
        </div>

        <div className="mt-4">
          <h4 className="text-sm font-semibold mb-2">פרטי העובד</h4>
          <div className="text-sm space-y-1">
            <p>שם: {employee.first_name} {employee.last_name}</p>
            <p>מגדר: {employee.gender === 'male' ? 'זכר' : employee.gender === 'female' ? 'נקבה' : 'אחר'}</p>
            <p>רמת דתיות: {
              employee.religious_level === 'secular' ? 'חילוני' :
              employee.religious_level === 'traditional' ? 'מסורתי' :
              employee.religious_level === 'religious' ? 'דתי' : 'חרדי'
            }</p>
          </div>
        </div>

        <div className="mt-4">
          <h4 className="text-sm font-semibold mb-2">פרטי מקום הישיבה</h4>
          <div className="text-sm space-y-1">
            <p>מספר: {workspace.id}</p>
            <p>חדר: {workspace.roomId}</p>
            <p>קומה: {workspace.floor}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
