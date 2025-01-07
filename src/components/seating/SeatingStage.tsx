import { Stage, Layer, Group } from 'react-konva'
import Konva from 'konva'
import { Seat, Participant } from '@/types'
import { TableComponent } from './TableComponent'
import { SeatComponent } from './SeatComponent'
import { GridComponent } from './GridComponent'
import { forwardRef, MutableRefObject } from 'react'

export interface SeatingStageProps {
    containerSize: { width: number; height: number }
    stageScale: number
    stagePosition: { x: number; y: number }
    showGrid: boolean
    seats: Seat[]
    participants: Participant[]
    draggedParticipant: Participant | null
    GRID_SIZE: number
    GRID_COLOR: string
    GRID_OPACITY: number
    SEAT_SIZE: number
    selectedTable: number | null
    setSelectedTable: (tableNumber: number | null) => void
    handleSeatDragMove: (seat: Seat, e: any) => void
    handleSeatDragEnd: (seat: Seat, e: any) => void
    handleParticipantDrop: (e: any) => void
    handleTableDragMove: (e: any) => void
    handleTableDragEnd: (e: any) => void
    handleWheel: (e: any) => void
    handleStageDragEnd: (e: any) => void
    handleStageDragMove: (e: any) => void
    stageRef: MutableRefObject<any>
    onSeatsChange: (seats: Seat[]) => void
    onSeatAssign: (participantId: string, seatId: string) => Promise<void>
}

export const SeatingStage = forwardRef<Konva.Stage | null, SeatingStageProps>(({
    containerSize,
    stageScale,
    stagePosition,
    showGrid,
    seats,
    participants,
    draggedParticipant,
    GRID_SIZE,
    GRID_COLOR,
    GRID_OPACITY,
    SEAT_SIZE,
    selectedTable,
    setSelectedTable,
    handleSeatDragMove,
    handleSeatDragEnd,
    handleParticipantDrop,
    handleTableDragMove,
    handleTableDragEnd,
    handleWheel,
    handleStageDragEnd,
    handleStageDragMove,
    stageRef,
}, ref) => {
    // Group seats by table
    const tableSeats = seats.reduce((acc, seat) => {
        if (!acc[seat.table_number]) {
            acc[seat.table_number] = [];
        }
        acc[seat.table_number].push(seat);
        return acc;
    }, {} as { [key: string]: Seat[] });

    return (
        <Stage
            width={containerSize.width}
            height={containerSize.height}
            ref={(node) => {
                stageRef.current = node;
                if (typeof ref === 'function') {
                    ref(node);
                } else if (ref) {
                    ref.current = node;
                }
            }}
            scaleX={stageScale}
            scaleY={stageScale}
            x={stagePosition.x}
            y={stagePosition.y}
            draggable
            onDragEnd={handleStageDragEnd}
            onDragMove={handleStageDragMove}
            onWheel={handleWheel}
            style={{ touchAction: 'none' }}
        >
            <Layer>
                {showGrid && (
                    <GridComponent
                        width={containerSize.width}
                        height={containerSize.height}
                        cellSize={GRID_SIZE}
                        color={GRID_COLOR}
                        opacity={GRID_OPACITY}
                    />
                )}

                {/* Render Tables with Seats */}
                {Object.entries(tableSeats).map(([tableId, tableSeats]) => {
                    const firstSeat = tableSeats[0];
                    return (
                        <TableComponent
                            key={tableId}
                            x={firstSeat.x_position}
                            y={firstSeat.y_position}
                            seats={tableSeats}
                            tableNumber={parseInt(tableId)}
                            selected={selectedTable === parseInt(tableId)}
                            onDragMove={handleTableDragMove}
                            onDragEnd={handleTableDragEnd}
                            onClick={() => setSelectedTable(parseInt(tableId))}
                            width={240}
                            height={160}
                        />
                    );
                })}

                {/* Render Seat Assignment Areas */}
                {draggedParticipant && (
                    <Group>
                        {seats.map((seat) => (
                            <SeatComponent
                                key={seat.id}
                                seat={seat}
                                onDragMove={(e) => handleSeatDragMove(seat, e)}
                                onDragEnd={(e) => handleSeatDragEnd(seat, e)}
                                onParticipantDrop={handleParticipantDrop}
                                size={SEAT_SIZE}
                                isDraggingParticipant={true}
                                isHighlighted={false}
                            />
                        ))}
                    </Group>
                )}
            </Layer>
        </Stage>
    );
});