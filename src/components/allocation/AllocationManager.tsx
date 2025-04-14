import React, { useState, useEffect } from 'react';
import { Employee } from '@/types/employee';
import { Workspace } from '@/types/workspace';
import { Table, Seat } from '@/types/tables';
import { allocateSeats, AllocationResult, AllocationConstraints } from '@/utils/allocationAlgorithm';

interface AllocationManagerProps {
  employees: Employee[];
  workspaces: Workspace[];
  tables: Table[];
  seats: Seat[];
  onAllocationComplete: (result: AllocationResult[]) => void;
}

export const AllocationManager: React.FC<AllocationManagerProps> = ({
  employees,
  workspaces,
  tables,
  seats,
  onAllocationComplete,
}) => {
  const [constraints, setConstraints] = useState<AllocationConstraints>({
    respectGenderRestrictions: false,
    respectReligiousPreferences: true,
    prioritizeHealthConstraints: true,
  });

  const handleAllocation = () => {
    const result = allocateSeats(employees, tables, seats, constraints);
    onAllocationComplete(result);
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">הגדרות הקצאה</h2>
      
      <div className="space-y-4">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="genderSeparation"
            checked={constraints.respectGenderRestrictions}
            onChange={(e) => setConstraints(prev => ({
              ...prev,
              respectGenderRestrictions: e.target.checked
            }))}
            className="ml-2"
          />
          <label htmlFor="genderSeparation">הפרדה מגדרית</label>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="religiousConstraints"
            checked={constraints.respectReligiousPreferences}
            onChange={(e) => setConstraints(prev => ({
              ...prev,
              respectReligiousPreferences: e.target.checked
            }))}
            className="ml-2"
          />
          <label htmlFor="religiousConstraints">אילוצים דתיים</label>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="serviceWorkerPriority"
            checked={constraints.prioritizeHealthConstraints}
            onChange={(e) => setConstraints(prev => ({
              ...prev,
              prioritizeHealthConstraints: e.target.checked
            }))}
            className="ml-2"
          />
          <label htmlFor="serviceWorkerPriority">עדיפות לבני שירות</label>
        </div>

        <button
          onClick={handleAllocation}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          בצע הקצאה
        </button>
      </div>
    </div>
  );
};
