import { Circle, Group, Text } from 'react-konva';
import { Participant, Seat } from '@/types';

interface SeatComponentProps {
    seat: Seat;
    participant?: Participant;
    isHighlighted: boolean;
    size: number;
    onDragMove: (e: any) => void;
    onDragEnd: (e: any) => void;
    onParticipantDrop: (e: any) => void;
    isDraggingParticipant: boolean;
}

export const SeatComponent = ({
    seat,
    participant,
    isHighlighted,
    size,
    onDragMove,
    onDragEnd,
    onParticipantDrop,
    isDraggingParticipant
}: SeatComponentProps) => {
    return (
        <Group
            x={seat.x_position}
            y={seat.y_position}
            draggable
            onDragMove={onDragMove}
            onDragEnd={onDragEnd}
            onDrop={onParticipantDrop}
        >
            <Circle
                radius={size / 2}
                fill={participant ? "#f3f4f6" : "white"}
                stroke={isDraggingParticipant && !participant ? "#2563eb" : isHighlighted ? "#2563eb" : "#d1d5db"}
                strokeWidth={2}
            />
            <Text
                text={`${seat.table_number}-${seat.seat_number}`}
                fontSize={12}
                fill="#374151"
                x={-15}
                y={-8}
                width={30}
                align="center"
            />
            {participant && (
                <Text
                    text={participant.name}
                    fontSize={10}
                    fill="#6b7280"
                    x={-20}
                    y={8}
                    width={40}
                    align="center"
                />
            )}
        </Group>
    );
};