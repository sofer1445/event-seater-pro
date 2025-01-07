import { Group, Rect, Text } from 'react-konva';
import { Seat } from '@/types';

interface TableComponentProps {
  x: number;
  y: number;
  seats: Seat[];
  tableNumber: number;
  selected: boolean;
  onDragMove: (e: any) => void;
  onDragEnd: (e: any) => void;
  onClick: () => void;
  width?: number;
  height?: number;
}

export const TableComponent = ({
  x,
  y,
  seats,
  tableNumber,
  selected,
  onDragMove,
  onDragEnd,
  onClick,
  width = 200,
  height = 100,
}: TableComponentProps) => {
  // Calculate seat positions in a rectangular layout
  const seatPositions = calculateSeatPositions(seats.length, width, height);

  return (
    <Group
      x={x}
      y={y}
      draggable
      onDragMove={onDragMove}
      onDragEnd={onDragEnd}
      onClick={onClick}
    >
      {/* Table background */}
      <Rect
        width={width}
        height={height}
        fill={selected ? '#e3f2fd' : '#f5f5f5'}
        stroke={selected ? '#2196f3' : '#ddd'}
        strokeWidth={2}
        cornerRadius={5}
        shadowColor="rgba(0,0,0,0.2)"
        shadowBlur={5}
        shadowOffset={{ x: 2, y: 2 }}
      />

      {/* Table number */}
      <Text
        text={`Table ${tableNumber}`}
        fontSize={16}
        fill="#333"
        width={width}
        align="center"
        y={height / 2 - 8}
      />

      {/* Render seats */}
      {seats.map((seat, index) => {
        const pos = seatPositions[index];
        return (
          <Group key={seat.id} x={pos.x} y={pos.y}>
            <Rect
              width={30}
              height={30}
              fill="#fff"
              stroke="#999"
              strokeWidth={1}
              cornerRadius={15}
            />
            <Text
              text={(index + 1).toString()}
              fontSize={12}
              fill="#666"
              width={30}
              align="center"
              y={8}
            />
          </Group>
        );
      })}
    </Group>
  );
};

// Helper function to calculate seat positions in a rectangular layout
function calculateSeatPositions(
  seatCount: number,
  tableWidth: number,
  tableHeight: number
) {
  const positions: { x: number; y: number }[] = [];
  const padding = 20;
  const seatSize = 30;

  // Calculate how many seats can fit on each side
  const seatsPerLongSide = Math.floor((tableWidth - padding * 2) / (seatSize + 10));
  const seatsPerShortSide = Math.floor((tableHeight - padding * 2) / (seatSize + 10));
  
  let remainingSeats = seatCount;
  let currentSeatIndex = 0;

  // Top row
  const topCount = Math.min(seatsPerLongSide, remainingSeats);
  for (let i = 0; i < topCount; i++) {
    positions.push({
      x: padding + i * ((tableWidth - padding * 2) / (topCount - 1 || 1)),
      y: 0,
    });
    currentSeatIndex++;
  }
  remainingSeats -= topCount;

  // Bottom row
  if (remainingSeats > 0) {
    const bottomCount = Math.min(seatsPerLongSide, remainingSeats);
    for (let i = 0; i < bottomCount; i++) {
      positions.push({
        x: padding + i * ((tableWidth - padding * 2) / (bottomCount - 1 || 1)),
        y: tableHeight - seatSize,
      });
      currentSeatIndex++;
    }
    remainingSeats -= bottomCount;
  }

  // Left side
  if (remainingSeats > 0) {
    const leftCount = Math.min(seatsPerShortSide, remainingSeats);
    for (let i = 0; i < leftCount; i++) {
      positions.push({
        x: 0,
        y: padding + i * ((tableHeight - padding * 2) / (leftCount - 1 || 1)),
      });
      currentSeatIndex++;
    }
    remainingSeats -= leftCount;
  }

  // Right side
  if (remainingSeats > 0) {
    const rightCount = Math.min(seatsPerShortSide, remainingSeats);
    for (let i = 0; i < rightCount; i++) {
      positions.push({
        x: tableWidth - seatSize,
        y: padding + i * ((tableHeight - padding * 2) / (rightCount - 1 || 1)),
      });
    }
  }

  return positions;
}