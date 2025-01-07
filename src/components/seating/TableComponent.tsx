import { Circle, Group, Text } from 'react-konva';

interface TableComponentProps {
    tableNumber: number;
    tableX: number;
    tableY: number;
    isSelected: boolean;
    tableSize: number;
    onTableClick: (tableNumber: number) => void;
    draggable?: boolean;
    onDragMove?: (e: any) => void;
    onDragEnd?: (e: any) => void;
}

export const TableComponent = ({ 
    tableNumber, 
    tableX, 
    tableY, 
    isSelected, 
    tableSize,
    onTableClick,
    draggable = true,
    onDragMove,
    onDragEnd
}: TableComponentProps) => {
    return (
        <Group 
            x={tableX} 
            y={tableY}
            draggable={draggable}
            onDragMove={onDragMove}
            onDragEnd={onDragEnd}
            onClick={() => onTableClick(tableNumber)}
        >
            <Circle
                radius={tableSize / 2}
                fill="#f3f4f6"
                stroke={isSelected ? "#2563eb" : "#d1d5db"}
                strokeWidth={2}
            />
            <Text
                text={`Table ${tableNumber}`}
                fontSize={14}
                fontStyle="bold"
                fill="#374151"
                x={-30}
                y={-10}
                width={60}
                align="center"
            />
        </Group>
    );
};