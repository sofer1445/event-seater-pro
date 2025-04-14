import React, { useState, useEffect, useMemo } from 'react';
import { Stage, Layer, Rect, Text, Group, Circle } from 'react-konva';
import { Workspace, Room } from '@/types/workspace';
import { Employee } from '@/types/employee';
import { KonvaEventObject } from 'konva/lib/Node';
import { FloorSelector } from './FloorSelector';
import { Html } from 'react-konva-utils';

interface WorkspaceMapProps {
  workspaces: Workspace[];
  rooms: Room[];
  employees: Employee[];
  onWorkspaceClick?: (workspace: Workspace) => void;
  onEmployeeMove?: (employeeId: string, workspaceId: string) => void;
  onRoomClick?: (room: Room) => void;
  onStageClick?: (e: KonvaEventObject<MouseEvent>) => void;
  selectedFloor: number;
  onFloorChange: (floor: number) => void;
  onWorkspacePositionUpdate?: (workspaceId: string, x: number, y: number) => void;
}

export const WorkspaceMap: React.FC<WorkspaceMapProps> = ({
  workspaces,
  rooms,
  employees,
  onWorkspaceClick,
  onEmployeeMove,
  onRoomClick,
  onStageClick,
  selectedFloor,
  onFloorChange,
  onWorkspacePositionUpdate,
}) => {
  const [stageScale, setStageScale] = useState(1);
  const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 });
  const [draggedWorkspace, setDraggedWorkspace] = useState<string | null>(null);
  const [stageSize, setStageSize] = useState({
    width: Math.max(800, window.innerWidth - 100),
    height: Math.max(600, window.innerHeight - 200)
  });

  useEffect(() => {
    const handleResize = () => {
      setStageSize({
        width: Math.max(800, window.innerWidth - 100),
        height: Math.max(600, window.innerHeight - 200)
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  console.log('Workspaces:', workspaces);
  console.log('Rooms:', rooms);
  console.log('Selected Floor:', selectedFloor);

  // Constants for layout
  const ROOM_PADDING = 20;
  const ROOM_MIN_WIDTH = 300;
  const ROOM_MIN_HEIGHT = 200;
  const WORKSPACE_SIZE = 60;
  const WORKSPACE_MARGIN = 10;

  const floorRooms = useMemo(() => {
    return rooms.filter(room => room.floor === selectedFloor);
  }, [rooms, selectedFloor]);

  if (!rooms.length || !workspaces.length) {
    return (
      <div className="flex items-center justify-center h-80 text-gray-500 text-xl">
        אין נתונים להצגה עבור קומה זו
      </div>
    );
  }

  const workspacesByRoom = useMemo(() => {
    const grouped = new Map<string, Workspace[]>();
    workspaces.forEach(workspace => {
      if (!workspace.roomId) return;
      if (!grouped.has(workspace.roomId)) {
        grouped.set(workspace.roomId, []);
      }
      grouped.get(workspace.roomId)?.push(workspace);
    });
    return grouped;
  }, [workspaces]);

  const employeesByWorkspace = useMemo(() => {
    const grouped = new Map<string, Employee>();
    employees.forEach(employee => {
      if (employee.workspace_id) {
        grouped.set(employee.workspace_id, employee);
      }
    });
    return grouped;
  }, [employees]);

  const floors = useMemo(() => {
    const uniqueFloors = new Set(rooms.map(r => r.floor));
    const floorArray = Array.from(uniqueFloors).sort((a, b) => a - b);
    return floorArray.length > 0 ? floorArray : [1];
  }, [rooms]);

  useEffect(() => {
    if (!floors.includes(selectedFloor)) {
      onFloorChange(floors[0]);
    }
  }, [floors, selectedFloor, onFloorChange]);

  const handleWheel = (e: KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const scaleBy = 1.1;
    const stage = e.target.getStage();
    if (!stage) return;

    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;

    setStageScale(Math.min(Math.max(newScale, 0.5), 3)); // Limit zoom between 0.5x and 3x
    setStagePosition({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    });
  };

  const renderWorkspace = (workspace: Workspace) => {
    const isBeingDragged = draggedWorkspace === workspace.id;
    const workspaceSize = 60;

    return (
      <Group
        key={workspace.id}
        x={workspace.coordinates.x}
        y={workspace.coordinates.y}
        width={workspaceSize}
        height={workspaceSize}
        draggable={!!onWorkspacePositionUpdate}
        onDragStart={(e) => {
          setDraggedWorkspace(workspace.id);
          e.target.moveToTop();
        }}
        onDragEnd={(e) => {
          setDraggedWorkspace(null);
          if (onWorkspacePositionUpdate) {
            onWorkspacePositionUpdate(workspace.id, e.target.x(), e.target.y());
          }
        }}
        onClick={() => onWorkspaceClick?.(workspace)}
      >
        <Rect
          width={workspaceSize}
          height={workspaceSize}
          fill={getWorkspaceColor(workspace)}
          stroke={isBeingDragged ? 'blue' : 'black'}
          strokeWidth={isBeingDragged ? 2 : 1}
          cornerRadius={5}
        />
        <Text
          text={workspace.name}
          width={workspaceSize}
          height={workspaceSize}
          align="center"
          verticalAlign="middle"
          fontSize={12}
        />
      </Group>
    );
  };

  const getWorkspaceColor = (workspace: Workspace) => {
    if (workspace.features.hasErgonomicChair) return '#90EE90'; // Light green for ergonomic
    if (workspace.features.isNearWindow) return '#ADD8E6'; // Light blue for near window
    return '#FFFFFF'; // Default white
  };

  const renderRoom = (room: Room, roomIndex: number) => {
    const roomWorkspaces = workspacesByRoom.get(room.id) || [];
    const roomWidth = Math.max(ROOM_MIN_WIDTH, roomWorkspaces.length * (WORKSPACE_SIZE + WORKSPACE_MARGIN) + ROOM_PADDING * 2);
    const roomHeight = Math.max(ROOM_MIN_HEIGHT, roomWorkspaces.length * (WORKSPACE_SIZE + WORKSPACE_MARGIN) + ROOM_PADDING * 2 + 50);
    
    // Calculate room position in a grid layout
    const ROOMS_PER_ROW = 3;
    const row = Math.floor(roomIndex / ROOMS_PER_ROW);
    const col = roomIndex % ROOMS_PER_ROW;
    const x = col * (roomWidth + 50);
    const y = row * (roomHeight + 50);
    
    return (
      <Group
        key={room.id}
        x={x}
        y={y}
        onClick={() => onRoomClick?.(room)}
      >
        <Rect
          width={roomWidth}
          height={roomHeight}
          stroke="#666"
          strokeWidth={2}
          fill="rgba(200, 200, 200, 0.1)"
          cornerRadius={5}
          shadowColor="black"
          shadowBlur={10}
          shadowOpacity={0.1}
        />
        <Text
          text={room.name}
          fontSize={18}
          fontStyle="bold"
          fill="#333"
          width={roomWidth}
          align="center"
          y={15}
        />
        <Text
          text={`קיבולת: ${room.capacity}`}
          fontSize={14}
          fill="#666"
          width={roomWidth}
          align="center"
          y={35}
        />
        {roomWorkspaces.map((workspace) => renderWorkspace(workspace))}
      </Group>
    );
  };

  return (
    <div className="space-y-4">
      <FloorSelector
        floors={floors}
        selectedFloor={selectedFloor}
        onFloorChange={onFloorChange}
      />
      <div 
        style={{ 
          border: '1px solid #ccc',
          borderRadius: '8px',
          overflow: 'hidden',
          height: '80vh',
          width: '100%',
          backgroundColor: '#f5f5f5'
        }}
      >
        <Stage
          width={stageSize.width}
          height={stageSize.height}
          onWheel={handleWheel}
          onClick={onStageClick}
          scaleX={stageScale}
          scaleY={stageScale}
          x={stagePosition.x}
          y={stagePosition.y}
          draggable
        >
          <Layer>
            {floorRooms.map((room, index) => renderRoom(room, index))}
          </Layer>
        </Stage>
      </div>
    </div>
  );
};
