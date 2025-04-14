import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface FloorSelectorProps {
  floors: number[];
  selectedFloor: number;
  onFloorChange: (floor: number) => void;
}

export const FloorSelector: React.FC<FloorSelectorProps> = ({
  floors = [1],
  selectedFloor = 1,
  onFloorChange,
}) => {
  // Ensure we have a valid floor selected and floors is not empty
  const availableFloors = floors.length > 0 ? floors : [1];
  const currentFloor = availableFloors.includes(selectedFloor) ? selectedFloor : availableFloors[0];
  
  return (
    <Card className="w-[300px] mb-4">
      <CardHeader>
        <CardTitle>בחירת קומה</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {availableFloors.map((floor) => (
            <Button
              key={floor}
              variant={floor === currentFloor ? "default" : "outline"}
              onClick={() => onFloorChange(floor)}
            >
              קומה {floor}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
