import React, { useState, useEffect } from 'react';
import { WorkspaceMap } from '@/components/workspace/WorkspaceMap';
import { AllocationManager } from '@/components/allocation/AllocationManager';
import { Workspace, Room } from '@/types/workspace';
import { Employee } from '@/types/employee';
import { Table, Seat } from '@/types/tables';
import { AllocationResult } from '@/utils/allocationAlgorithm';
import { toast } from 'react-hot-toast';
import { getWorkspaces } from '@/lib/api/workspaces';
import { getRooms } from '@/lib/api/rooms';
import { getEmployees } from '@/lib/api/employees';
import { getTables } from '@/lib/api/tables';
import { getSeats } from '@/lib/api/seats';
import { createRoom } from '@/lib/api/rooms';
import { AddRoomModal } from '@/components/rooms/AddRoomModal';

const Workspaces: React.FC = () => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedFloor, setSelectedFloor] = useState(1);
  const [allocations, setAllocations] = useState<Map<string, string>>(new Map());
  const [isAddRoomModalOpen, setIsAddRoomModalOpen] = useState(false);

  useEffect(() => {
    // Fetch initial data
    fetchWorkspaces();
    fetchRooms();
    fetchEmployees();
    fetchTables();
    fetchSeats();
  }, []);

  const fetchWorkspaces = async () => {
    try {
      const data = await getWorkspaces();
      setWorkspaces(data);
    } catch (error) {
      console.error('Error fetching workspaces:', error);
      toast.error('שגיאה בטעינת עמדות העבודה');
    }
  };

  const fetchRooms = async () => {
    try {
      const data = await getRooms();
      setRooms(data);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      toast.error('שגיאה בטעינת החדרים');
    }
  };

  const fetchEmployees = async () => {
    try {
      const data = await getEmployees();
      setEmployees(data);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('שגיאה בטעינת העובדים');
    }
  };

  const fetchTables = async () => {
    try {
      const data = await getTables();
      setTables(data);
    } catch (error) {
      console.error('Error fetching tables:', error);
      toast.error('שגיאה בטעינת השולחנות');
    }
  };

  const fetchSeats = async () => {
    try {
      const data = await getSeats();
      setSeats(data);
    } catch (error) {
      console.error('Error fetching seats:', error);
      toast.error('שגיאה בטעינת המושבים');
    }
  };

  const handleAllocationComplete = async (result: AllocationResult[]) => {
    if (result && result.length > 0) {
      // Convert allocation results to Map<string, string> (employeeId -> tableId)
      const newAllocations = new Map(
        result.map(allocation => [allocation.employeeId, allocation.tableId])
      );
      setAllocations(newAllocations);
      toast.success('ההקצאה בוצעה בהצלחה!');
      
      // עדכון ההקצאות בשרת
      try {
        await fetch('/api/allocations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            allocations: Array.from(newAllocations.entries()).map(([employeeId, tableId]) => ({
              employeeId,
              tableId
            }))
          }),
        });
      } catch (error) {
        console.error('Error updating allocations:', error);
        toast.error('שגיאה בשמירת ההקצאות');
      }
    } else {
      toast.error('No allocation results');
    }
  };

  const handleWorkspaceClick = (workspace: Workspace) => {
    // מצא את העובד שמוקצה לעמדה זו
    const employeeId = Array.from(allocations.entries())
      .find(([_, wsId]) => wsId === workspace.id)?.[0];
    
    if (employeeId) {
      const employee = employees.find(e => e.id === employeeId);
      if (employee) {
        toast.success(`עמדה זו מוקצית ל-${employee.first_name} ${employee.last_name}`);
      }
    } else {
      toast('עמדה פנויה');
    }
  };

  const handleWorkspacePositionUpdate = async (workspaceId: string, x: number, y: number) => {
    try {
      await fetch(`/api/workspaces/${workspaceId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          coordinates: { x, y }
        }),
      });
      
      // עדכון מקומי של המיקום
      setWorkspaces(prev => prev.map(ws => 
        ws.id === workspaceId 
          ? { ...ws, coordinates: { x, y } }
          : ws
      ));
    } catch (error) {
      console.error('Error updating workspace position:', error);
      toast.error('שגיאה בעדכון מיקום העמדה');
    }
  };

  const handleAddRoom = async (roomData: Partial<Room>) => {
    try {
      const newRoom = await createRoom({
        ...roomData,
        id: crypto.randomUUID(),
        features: roomData.features || [],
        coordinates: { x: 100, y: 100 },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as Room);

      await fetchRooms();
      toast.success('החדר נוסף בהצלחה');
    } catch (error) {
      console.error('Error adding room:', error);
      toast.error('שגיאה בהוספת החדר');
    }
  };

  // Filter rooms by selected floor
  const filteredRooms = rooms.filter(room => room.floor === selectedFloor);

  return (
    <div className="p-4 h-screen bg-gray-50">
      <div className="mb-4 flex justify-between items-center">
        <div className="space-x-2">
          <button
            onClick={() => setIsAddRoomModalOpen(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            הוסף חדר
          </button>
        </div>
        <div className="flex items-center space-x-4">
          <label className="text-gray-700">קומה:</label>
          <select 
            value={selectedFloor}
            onChange={(e) => setSelectedFloor(Number(e.target.value))}
            className="border rounded px-2 py-1"
          >
            {[1, 2, 3, 4, 5].map((floor) => (
              <option key={floor} value={floor}>
                {floor}
              </option>
            ))}
          </select>
        </div>
      </div>

      <AddRoomModal
        isOpen={isAddRoomModalOpen}
        onClose={() => setIsAddRoomModalOpen(false)}
        onSubmit={handleAddRoom}
      />

      <div className="grid grid-cols-4 gap-4 h-full">
        <div className="col-span-3">
          <WorkspaceMap
            workspaces={workspaces}
            rooms={filteredRooms}
            employees={employees}
            selectedFloor={selectedFloor}
            onFloorChange={setSelectedFloor}
            onWorkspaceClick={handleWorkspaceClick}
            onWorkspacePositionUpdate={handleWorkspacePositionUpdate}
          />
        </div>
        <div className="col-span-1 space-y-4">
          <AllocationManager
            employees={employees}
            workspaces={workspaces}
            tables={tables}
            seats={seats}
            onAllocationComplete={handleAllocationComplete}
          />
        </div>
      </div>
    </div>
  );
};

export default Workspaces;
