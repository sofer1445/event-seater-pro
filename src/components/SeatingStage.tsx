import { Stage, Layer, Rect } from 'react-konva'
import { TableComponent } from './seating/TableComponent'
import { SeatComponent } from './seating/SeatComponent'
import { Seat, Participant } from '@/types'
import { MutableRefObject } from 'react'

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
    handleStageDragMove: (e: any) => void
    stageRef: MutableRefObject<any>
}

export default function SeatingStage({
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
    stageRef
}: SeatingStageProps) {
    // Create grid lines
    const gridLines = []
    if (showGrid) {
        // Vertical lines
        for (let x = 0; x <= containerSize.width; x += GRID_SIZE) {
            gridLines.push(
                <Rect
                    key={`v${x}`}
                    x={x}
                    y={0}
                    width={1}
                    height={containerSize.height}
                    fill={GRID_COLOR}
                    opacity={GRID_OPACITY}
                />
            )
        }
        // Horizontal lines
        for (let y = 0; y <= containerSize.height; y += GRID_SIZE) {
            gridLines.push(
                <Rect
                    key={`h${y}`}
                    x={0}
                    y={y}
                    width={containerSize.width}
                    height={1}
                    fill={GRID_COLOR}
                    opacity={GRID_OPACITY}
                />
            )
        }
    }

    // Group seats by table
    const tables = new Map<number, Seat[]>()
    seats.forEach(seat => {
        const tableSeats = tables.get(seat.table_number) || []
        tableSeats.push(seat)
        tables.set(seat.table_number, tableSeats)
    })

    // Calculate table positions (center of all seats)
    const tablePositions = new Map<number, { x: number; y: number }>()
    tables.forEach((tableSeats, tableNumber) => {
        const avgX = tableSeats.reduce((sum, seat) => sum + seat.x_position, 0) / tableSeats.length
        const avgY = tableSeats.reduce((sum, seat) => sum + seat.y_position, 0) / tableSeats.length
        tablePositions.set(tableNumber, { x: avgX, y: avgY })
    })

    return (
        <Stage
            width={containerSize.width}
            height={containerSize.height}
            scale={{ x: stageScale, y: stageScale }}
            position={stagePosition}
            draggable
            onDragEnd={handleStageDragEnd}
            onDragMove={handleStageDragMove}
            onWheel={handleWheel}
            ref={stageRef}
        >
            <Layer>
                {/* Grid */}
                {gridLines}

                {/* Tables */}
                {Array.from(tablePositions.entries()).map(([tableNumber, position]) => (
                    <TableComponent
                        key={tableNumber}
                        tableNumber={tableNumber}
                        tableX={position.x}
                        tableY={position.y}
                        isSelected={selectedTable === tableNumber}
                        tableSize={SEAT_SIZE * 2}
                        onTableClick={() => setSelectedTable(tableNumber)}
                        onDragMove={(e) => handleTableDragMove(tableNumber, e)}
                        onDragEnd={(e) => handleTableDragEnd(tableNumber, e)}
                    />
                ))}

                {/* Seats */}
                {seats.map(seat => {
                    const participant = participants.find(p => p.seat_id === seat.id)
                    return (
                        <SeatComponent
                            key={seat.id}
                            seat={seat}
                            participant={participant}
                            isHighlighted={selectedTable === seat.table_number}
                            size={SEAT_SIZE}
                            onDragMove={(e) => handleSeatDragMove(seat, e)}
                            onDragEnd={(e) => handleSeatDragEnd(seat, e)}
                            onParticipantDrop={() => handleParticipantDrop(seat)}
                            isDraggingParticipant={!!draggedParticipant}
                        />
                    )
                })}
            </Layer>
        </Stage>
    )
}
