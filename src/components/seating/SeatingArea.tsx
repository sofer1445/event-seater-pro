import { useCallback, useRef, useState } from 'react'
import { Seat, Participant } from '@/types'
import { useToast } from '../ui/use-toast'
import { supabase } from '../../integrations/supabase/client'
import { SeatingStage } from './SeatingStage'

interface SeatingAreaProps {
    containerSize: { width: number; height: number }
    seats: Seat[]
    participants: Participant[]
    onSeatsChange: (seats: Seat[]) => void
    onSeatAssign: (participantId: string, seatId: string) => Promise<void>
    draggedParticipant: Participant | null
    showGrid: boolean
}

export const SeatingArea = ({
    containerSize,
    seats,
    participants,
    onSeatsChange,
    onSeatAssign,
    draggedParticipant,
    showGrid,
}: SeatingAreaProps) => {
    const { toast } = useToast()
    const stageRef = useRef<any>(null)
    const [stageScale, setStageScale] = useState(1)
    const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 })
    const [selectedTable, setSelectedTable] = useState<number | null>(null)

    // Constants for grid and seat sizes
    const GRID_SIZE = 20
    const GRID_COLOR = '#CCCCCC'
    const GRID_OPACITY = 0.2
    const SEAT_SIZE = 40

    const handleWheel = useCallback((e: any) => {
        e.evt.preventDefault()
        const scaleBy = 1.1
        const stage = stageRef.current
        const oldScale = stage.scaleX()
        const pointer = stage.getPointerPosition()
        const mousePointTo = {
            x: (pointer.x - stage.x()) / oldScale,
            y: (pointer.y - stage.y()) / oldScale,
        }
        const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy
        setStageScale(Math.max(0.3, Math.min(newScale, 3)))
        setStagePosition({
            x: pointer.x - mousePointTo.x * newScale,
            y: pointer.y - mousePointTo.y * newScale,
        })
    }, [])

    const handleSeatDragMove = (seat: Seat, e: any) => {
        const stage = stageRef.current
        const pos = stage.getPointerPosition()
        const x = (pos.x - stage.x()) / stage.scaleX()
        const y = (pos.y - stage.y()) / stage.scaleY()
        
        onSeatsChange(seats.map(s => 
            s.id === seat.id 
                ? { ...s, x_position: x, y_position: y }
                : s
        ))
    }

    const handleSeatDragEnd = async (seat: Seat, e: any) => {
        const stage = stageRef.current
        const pos = stage.getPointerPosition()
        const x = (pos.x - stage.x()) / stage.scaleX()
        const y = (pos.y - stage.y()) / stage.scaleY()

        try {
            const { error } = await supabase
                .from('seats')
                .update({ x_position: x, y_position: y })
                .eq('id', seat.id)

            if (error) throw error

            onSeatsChange(seats.map(s => 
                s.id === seat.id 
                    ? { ...s, x_position: x, y_position: y }
                    : s
            ))
        } catch (error: any) {
            console.error('❌ Error updating seat position:', error)
            toast({
                title: "שגיאה",
                description: "אירעה שגיאה בעדכון מיקום המושב",
                variant: "destructive",
            })
        }
    }

    const handleTableDragMove = useCallback(
        (e: any) => {
            const tableId = e.target.attrs.id;
            const newX = Math.round(e.target.x() / GRID_SIZE) * GRID_SIZE;
            const newY = Math.round(e.target.y() / GRID_SIZE) * GRID_SIZE;

            const updatedSeats = seats.map((seat) => {
                if (seat.table_number === parseInt(tableId)) {
                    return {
                        ...seat,
                        x_position: newX,
                        y_position: newY,
                    };
                }
                return seat;
            });

            onSeatsChange(updatedSeats);
        },
        [seats, GRID_SIZE, onSeatsChange]
    );

    const handleTableClick = useCallback(
        (tableNumber: number) => {
            setSelectedTable(selectedTable === tableNumber ? null : tableNumber);
        },
        [selectedTable]
    );

    const handleTableDragEnd = async (e: any) => {
        const stage = stageRef.current
        const pos = stage.getPointerPosition()
        const x = (pos.x - stage.x()) / stage.scaleX()
        const y = (pos.y - stage.y()) / stage.scaleY()
        const tableNumber = e.target.attrs.tableNumber

        try {
            const tableSeats = seats.filter(s => s.table_number === tableNumber)
            const updates = tableSeats.map(seat => ({
                id: seat.id,
                x_position: x + (seat.x_position % GRID_SIZE),
                y_position: y + (seat.y_position % GRID_SIZE)
            }))

            const { error } = await supabase
                .from('seats')
                .upsert(updates)

            if (error) throw error

            onSeatsChange(seats.map(s => 
                s.table_number === tableNumber
                    ? { ...s, x_position: x + (s.x_position % GRID_SIZE), y_position: y + (s.y_position % GRID_SIZE) }
                    : s
            ))
        } catch (error: any) {
            console.error('❌ Error updating table position:', error)
            toast({
                title: "שגיאה",
                description: "אירעה שגיאה בעדכון מיקום השולחן",
                variant: "destructive",
            })
        }
    }

    const handleStageDragEnd = (e: any) => {
        setStagePosition({
            x: e.target.x(),
            y: e.target.y()
        })
    }

    const handleStageDragMove = (e: any) => {
        setStagePosition({
            x: e.target.x(),
            y: e.target.y()
        })
    }

    const handleParticipantDrop = async (seat: Seat) => {
        if (!draggedParticipant) return

        try {
            await onSeatAssign(draggedParticipant.id, seat.id)
        } catch (error: any) {
            console.error('❌ Error assigning seat:', error)
            toast({
                title: "שגיאה",
                description: "אירעה שגיאה בהקצאת המושב",
                variant: "destructive",
            })
        }
    }

    // Group seats by table
    const tableSeats = seats.reduce((acc, seat) => {
        if (!acc[seat.table_number]) {
            acc[seat.table_number] = [];
        }
        acc[seat.table_number].push(seat);
        return acc;
    }, {} as { [key: number]: Seat[] });

    return (
        <div
            style={{
                width: containerSize.width,
                height: containerSize.height,
                position: 'relative',
                overflow: 'hidden',
                backgroundColor: '#fafafa',
            }}
        >
            <SeatingStage
                ref={stageRef}
                containerSize={containerSize}
                stageScale={stageScale}
                stagePosition={stagePosition}
                showGrid={showGrid}
                seats={seats}
                participants={participants}
                draggedParticipant={draggedParticipant}
                GRID_SIZE={GRID_SIZE}
                GRID_COLOR={GRID_COLOR}
                GRID_OPACITY={GRID_OPACITY}
                SEAT_SIZE={SEAT_SIZE}
                selectedTable={selectedTable}
                setSelectedTable={setSelectedTable}
                handleSeatDragMove={handleSeatDragMove}
                handleSeatDragEnd={handleSeatDragEnd}
                handleParticipantDrop={handleParticipantDrop}
                handleTableDragMove={handleTableDragMove}
                handleTableDragEnd={handleTableDragEnd}
                handleWheel={handleWheel}
                handleStageDragEnd={handleStageDragEnd}
                handleStageDragMove={handleStageDragMove}
                stageRef={stageRef}
                onSeatsChange={onSeatsChange}
                onSeatAssign={onSeatAssign}
            />
        </div>
    )
}
