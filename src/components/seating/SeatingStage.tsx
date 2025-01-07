import { Stage, Layer } from 'react-konva'
import { Seat, Participant } from '@/types'
import { TableComponent } from './TableComponent'
import { SeatComponent } from './SeatComponent'
import { GridComponent } from './GridComponent'

interface SeatingStageProps {
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
    handleParticipantDrop: (seat: Seat) => void
    handleTableDragMove: (tableNumber: number, e: any) => void
    handleTableDragEnd: (tableNumber: number, e: any) => void
    handleWheel: (e: any) => void
    handleStageDragEnd: (e: any) => void
    stageRef: any
}

export const SeatingStage = ({
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
    stageRef
}: SeatingStageProps) => {
    const calculateTablePosition = (tableNumber: number) => {
        const numTables = [...new Set(seats.map(s => s.row_number))].length;
        const tablesPerRow = Math.ceil(Math.sqrt(numTables));
        const spacing = 120 * 2; // TABLE_SIZE * 2
        
        const row = Math.floor((tableNumber - 1) / tablesPerRow);
        const col = (tableNumber - 1) % tablesPerRow;
        
        return {
            x: (col * spacing) + spacing,
            y: (row * spacing) + spacing
        };
    };

    return (
        <Stage
            ref={stageRef}
            width={containerSize.width}
            height={containerSize.height}
            scale={{ x: stageScale, y: stageScale }}
            position={stagePosition}
            draggable
            onDragEnd={handleStageDragEnd}
            onWheel={handleWheel}
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
                
                {Array.from(new Set(seats.map(seat => seat.row_number))).map(tableNumber => {
                    const { x: tableX, y: tableY } = calculateTablePosition(tableNumber);
                    return (
                        <TableComponent
                            key={`table-${tableNumber}`}
                            tableNumber={tableNumber}
                            tableX={tableX}
                            tableY={tableY}
                            isSelected={selectedTable === tableNumber}
                            tableSize={120}
                            onTableClick={setSelectedTable}
                            onDragMove={(e) => handleTableDragMove(tableNumber, e)}
                            onDragEnd={(e) => handleTableDragEnd(tableNumber, e)}
                        />
                    );
                })}

                {seats.map((seat) => {
                    const isAssigned = participants.some(p => p.seat_id === seat.id)
                    const assignedParticipant = participants.find(p => p.seat_id === seat.id)

                    return (
                        <SeatComponent
                            key={seat.id}
                            seat={seat}
                            isAssigned={isAssigned}
                            assignedParticipant={assignedParticipant}
                            seatSize={SEAT_SIZE}
                            onDragMove={handleSeatDragMove}
                            onDragEnd={handleSeatDragEnd}
                            onDrop={handleParticipantDrop}
                            draggedParticipant={draggedParticipant}
                        />
                    )
                })}
            </Layer>
        </Stage>
    )
}