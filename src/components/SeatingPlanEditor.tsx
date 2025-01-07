import { useEffect, useRef, useState, useCallback } from 'react'
import { Seat, Participant } from '../types'
import { useToast } from './ui/use-toast'
import { debounce } from 'lodash'
import { supabase } from '../integrations/supabase/client'
import { ParticipantList } from './seating/ParticipantList'
import { SeatingControls } from './seating/SeatingControls'
import { SeatingStage } from './seating/SeatingStage'

interface Props {
    eventId: string
    seats: Seat[]
    participants: Participant[]
    onSeatsChange: (seats: Seat[]) => void
    onSeatAssign: (participantId: string, seatId: string) => void
}

const FIXED_SEATS_PER_TABLE = 6;
const TABLE_SPACING = 200; // Space between tables
const SEAT_RADIUS = 20;
const TABLE_RADIUS = 60;

export function SeatingPlanEditor({
    eventId,
    seats,
    participants,
    onSeatsChange,
    onSeatAssign,
}: Props) {
    const { toast } = useToast()
    const stageRef = useRef(null)
    const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [draggedParticipant, setDraggedParticipant] = useState<Participant | null>(null)
    const [stageScale, setStageScale] = useState(1)
    const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 })
    const [showUnassignedOnly, setShowUnassignedOnly] = useState(false)
    const [selectedTable, setSelectedTable] = useState<number | null>(null)
    const [showGrid, setShowGrid] = useState(true)
    const [autoArrange, setAutoArrange] = useState(false)
    const [isAddingTable, setIsAddingTable] = useState(false)

    const containerRef = useRef<HTMLDivElement>(null)
    const [containerSize, setContainerSize] = useState({ width: 800, height: 600 })

    const filteredParticipants = participants.filter(participant => {
        const matchesSearch = participant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            participant.email.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesFilter = showUnassignedOnly ? !participant.seat_id : true
        return matchesSearch && matchesFilter
    })

    const addNewTable = async () => {
        try {
            const newTableNumber = Math.max(...seats.map(s => s.row_number), 0) + 1;
            const centerX = 300;
            const centerY = 300;
            
            const newSeats = [];
            
            // Create exactly 6 seats around the table
            for (let i = 0; i < FIXED_SEATS_PER_TABLE; i++) {
                const angle = (i * 360) / FIXED_SEATS_PER_TABLE;
                const angleRad = (angle * Math.PI) / 180;
                
                const seatX = centerX + TABLE_RADIUS * Math.cos(angleRad);
                const seatY = centerY + TABLE_RADIUS * Math.sin(angleRad);
                
                const newSeat = {
                    event_id: eventId,
                    row_number: newTableNumber,
                    seat_number: i + 1,
                    status: 'available',
                    x_position: Math.round(seatX),
                    y_position: Math.round(seatY),
                    occupant_id: null
                };
                
                newSeats.push(newSeat);
            }
            
            const { data, error } = await supabase
                .from('seats')
                .insert(newSeats)
                .select('*');

            if (error) {
                throw error;
            }
            
            if (data) {
                onSeatsChange([...seats, ...data]);
                toast({
                    title: "Success",
                    description: `Added new table with ${FIXED_SEATS_PER_TABLE} seats`
                });
            }
        } catch (error: any) {
            console.error('Error adding table:', error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to add new table"
            });
        }
    };

    const autoArrangeSeats = async () => {
        try {
            const tables = Array.from(new Set(seats.map(s => s.row_number)));
            const tablesPerRow = Math.ceil(Math.sqrt(tables.length));
            
            let updatedSeats = [...seats];
            tables.forEach((tableNumber, tableIndex) => {
                const row = Math.floor(tableIndex / tablesPerRow);
                const col = tableIndex % tablesPerRow;
                
                // Calculate table center position in a grid layout
                const tableX = containerSize.width/2 + (col - tablesPerRow/2) * TABLE_SPACING;
                const tableY = containerSize.height/2 + (row - Math.floor(tables.length/tablesPerRow)/2) * TABLE_SPACING;
                
                // Get seats for this table
                const tableSeats = seats.filter(s => s.row_number === tableNumber);
                
                // Arrange seats in a circle around the table
                tableSeats.forEach((seat, seatIndex) => {
                    const angle = (seatIndex * 360) / FIXED_SEATS_PER_TABLE;
                    const angleRad = (angle * Math.PI) / 180;
                    
                    const seatX = tableX + TABLE_RADIUS * Math.cos(angleRad);
                    const seatY = tableY + TABLE_RADIUS * Math.sin(angleRad);
                    
                    const updatedSeatIndex = updatedSeats.findIndex(s => s.id === seat.id);
                    if (updatedSeatIndex !== -1) {
                        updatedSeats[updatedSeatIndex] = {
                            ...seat,
                            x_position: Math.round(seatX),
                            y_position: Math.round(seatY)
                        };
                    }
                });
            });
            
            const { error } = await supabase
                .from('seats')
                .upsert(
                    updatedSeats.map(seat => ({
                        id: seat.id,
                        event_id: seat.event_id,
                        row_number: seat.row_number,
                        seat_number: seat.seat_number,
                        x_position: seat.x_position,
                        y_position: seat.y_position,
                    }))
                );

            if (error) throw error;
            
            onSeatsChange(updatedSeats);
            
            toast({
                title: "Success",
                description: "Tables arranged in restaurant layout"
            });
        } catch (error: any) {
            console.error('Error in autoArrangeSeats:', error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to arrange tables"
            });
        }
    };

    return (
        <div ref={containerRef} style={{ width: '100%', height: '100%', minHeight: '600px' }}>
            <div className="flex h-full">
                <div className="w-1/4 p-4 border-r">
                    <ParticipantList
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        showUnassignedOnly={showUnassignedOnly}
                        setShowUnassignedOnly={setShowUnassignedOnly}
                        filteredParticipants={filteredParticipants}
                        setDraggedParticipant={setDraggedParticipant}
                        draggedParticipant={draggedParticipant}
                    />
                    <SeatingControls
                        showGrid={showGrid}
                        setShowGrid={setShowGrid}
                        setAutoArrange={setAutoArrange}
                        isAddingTable={isAddingTable}
                        setIsAddingTable={setIsAddingTable}
                        addNewTable={addNewTable}
                    />
                </div>

                <div className="flex-1 relative">
                    <SeatingStage
                        containerSize={containerSize}
                        stageScale={stageScale}
                        stagePosition={stagePosition}
                        showGrid={showGrid}
                        seats={seats}
                        participants={participants}
                        draggedParticipant={draggedParticipant}
                        SEAT_RADIUS={SEAT_RADIUS}
                        TABLE_RADIUS={TABLE_RADIUS}
                        selectedTable={selectedTable}
                        setSelectedTable={setSelectedTable}
                        handleWheel={handleWheel}
                        handleStageDragEnd={handleStageDragEnd}
                        stageRef={stageRef}
                    />
                </div>
            </div>
        </div>
    )
}
