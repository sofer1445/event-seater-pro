import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Seat } from '@/types/tables';

interface AllocationStatusProps {
  seats: Seat[] | undefined;
  appliedAllocations: number;
  totalAllocations: number;
  isApplying: boolean;
}

const AllocationStatus: React.FC<AllocationStatusProps> = ({
  seats,
  appliedAllocations,
  totalAllocations,
  isApplying
}) => {
  // Calculate statistics
  const totalSeats = seats?.length || 0;
  const occupiedSeats = seats?.filter(s => s.status === 'occupied' && s.occupied_by).length || 0;
  const availableSeats = totalSeats - occupiedSeats;
  
  const occupiedPercentage = totalSeats > 0 ? Math.round((occupiedSeats / totalSeats) * 100) : 0;
  const availablePercentage = 100 - occupiedPercentage;
  
  const allocationProgress = totalAllocations > 0 
    ? Math.round((appliedAllocations / totalAllocations) * 100) 
    : 0;
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-right">מצב הקצאות</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-muted rounded-md p-3">
            <h3 className="text-right font-semibold mb-2">מקומות תפוסים</h3>
            <div className="flex justify-between items-center">
              <Progress value={occupiedPercentage} className="w-1/2" />
              <span className="text-lg font-bold">
                {occupiedSeats} / {totalSeats} ({occupiedPercentage}%)
              </span>
            </div>
          </div>
          <div className="bg-muted rounded-md p-3">
            <h3 className="text-right font-semibold mb-2">מקומות פנויים</h3>
            <div className="flex justify-between items-center">
              <Progress value={availablePercentage} className="w-1/2" />
              <span className="text-lg font-bold">
                {availableSeats} / {totalSeats} ({availablePercentage}%)
              </span>
            </div>
          </div>
        </div>
        
        {totalAllocations > 0 && (
          <div className="mt-4">
            <h3 className="text-right font-semibold mb-2">התקדמות ההקצאה</h3>
            <div className="flex justify-between items-center">
              <Progress value={allocationProgress} className="w-1/2" />
              <span className="text-lg font-bold">
                {appliedAllocations} / {totalAllocations} ({allocationProgress}%)
                {isApplying && ' - מחיל... '}
              </span>
            </div>
          </div>
        )}
        
        <div className="mt-4 text-right">
          <p className="text-sm text-muted-foreground">
            * מצב הקצאות מתעדכן בזמן אמת לאחר פעולות הקצאה
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default AllocationStatus;
