import React from 'react';
import { Stage, Layer, Rect, Text } from 'react-konva';
import { Workspace } from '../../types/workspace';
import { Employee } from '../../types/employee';

interface WorkspaceMapProps {
  workspaces: Workspace[];
  employees: Employee[];
  onWorkspaceClick: (workspace: Workspace) => void;
  onEmployeeMove: (employee: Employee, workspace: Workspace) => void;
  onStageClick?: (e: any) => void;
}

export const WorkspaceMap = ({
  workspaces,
  employees,
  onWorkspaceClick,
  onEmployeeMove,
  onStageClick,
}: WorkspaceMapProps) => {
  const [stageScale, setStageScale] = React.useState(1);
  const [stagePosition, setStagePosition] = React.useState({ x: 0, y: 0 });

  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    const scaleBy = 1.1;
    const stage = e.target.getStage();
    const oldScale = stage.scaleX();
    const mousePointTo = {
      x: stage.getPointerPosition().x / oldScale - stage.x() / oldScale,
      y: stage.getPointerPosition().y / oldScale - stage.y() / oldScale,
    };

    const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;

    setStageScale(newScale);
    setStagePosition({
      x: -(mousePointTo.x - stage.getPointerPosition().x / newScale) * newScale,
      y: -(mousePointTo.y - stage.getPointerPosition().y / newScale) * newScale,
    });
  };

  return (
    <div className="h-full w-full overflow-hidden">
      <Stage
        width={window.innerWidth}
        height={window.innerHeight}
        onWheel={handleWheel}
        scaleX={stageScale}
        scaleY={stageScale}
        x={stagePosition.x}
        y={stagePosition.y}
        draggable
        onClick={onStageClick}
      >
        <Layer>
          {workspaces.map((workspace) => (
            <React.Fragment key={workspace.id}>
              <Rect
                x={workspace.coordinates.x - 30}
                y={workspace.coordinates.y - 30}
                width={60}
                height={60}
                fill={workspace.status === 'available' ? '#f3f4f6' : '#e5e7eb'}
                stroke="#d1d5db"
                strokeWidth={1}
                cornerRadius={5}
                onClick={() => onWorkspaceClick(workspace)}
              />
              
              <Text
                x={workspace.coordinates.x - 15}
                y={workspace.coordinates.y - 20}
                text={`${workspace.room}-${workspace.name}`}
                fontSize={12}
                fill="#374151"
              />
              
              {/* שם העובד אם יש */}
              {workspace.current_employee_id && (
                <Text
                  x={workspace.coordinates.x - 25}
                  y={workspace.coordinates.y + 10}
                  text={employees.find(e => e.id === workspace.current_employee_id)?.name || ''}
                  fontSize={10}
                  fill="#374151"
                />
              )}
            </React.Fragment>
          ))}
        </Layer>
      </Stage>
    </div>
  );
};
