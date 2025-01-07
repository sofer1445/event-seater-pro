import { Circle, Group, Text } from 'react-konva';
import { Participant, Seat } from '../../types';

interface SeatComponentProps {
    seat: Seat;
    isAssigned: boolean;
    assignedParticipant?: Participant;
    seatSize: number;
    onDragMove: (seat: Seat, e: any) => void;
    onDragEnd: (seat: Seat, e: any) => void;
    onDrop: (seat: Seat) => void;
    draggedParticipant: Participant | null;
}

export const SeatComponent = ({
    seat,
    isAssigned,
    assignedParticipant,
    seatSize,
    onDragMove,
    onDragEnd,
    onDrop,
    draggedParticipant
}: SeatComponentProps) => {
    return (
        <Group
            key={seat.id}
            x={seat.x_position}
            y={seat.y_position}
            draggable
            onDragMove={(e) => onDragMove(seat, e)}
            onDragEnd={(e) => onDragEnd(seat, e)}
            onDrop={() => onDrop(seat)}
        >
            <Circle
                radius={seatSize / 2}
                fill={isAssigned ? "#22c55e" : "white"}
                stroke={draggedParticipant && !isAssigned ? "#2563eb" : "#e5e7eb"}
                strokeWidth={2}
            />
            <Text
                text={`${seat.row_number}-${seat.seat_number}`}
                fontSize={12}
                fill="#666"
                x={-15}
                y={-8}
            />
            {assignedParticipant && (
                <Text
                    text={assignedParticipant.name}
                    fontSize={10}
                    fill="white"
                    x={-20}
                    y={8}
                    width={40}
                    align="center"
                />
            )}
        </Group>
    );
};