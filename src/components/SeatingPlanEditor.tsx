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

const SeatingPlanEditor = ({
    eventId,
    seats,
    participants,
    onSeatsChange,
    onSeatAssign,
}: Props) => {
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
    const [newTableNumber, setNewTableNumber] = useState(1)
    const [newSeatsCount, setNewSeatsCount] = useState(8)

    const containerRef = useRef<HTMLDivElement>(null)
    const [containerSize, setContainerSize] = useState({ width: 800, height: 600 })

    const SEAT_SIZE = 40
    const TABLE_SIZE = 120
    const GRID_SIZE = 40
    const GRID_COLOR = '#000000'
    const GRID_OPACITY = 0.2

    const filteredParticipants = participants.filter(participant => {
        const matchesSearch = participant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            participant.email.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesFilter = showUnassignedOnly ? !participant.seat_id : true
        return matchesSearch && matchesFilter
    })

    const handleWheel = (e: any) => {
        e.evt.preventDefault();

        const stage = stageRef.current;
        if (!stage) return;  

        const scaleBy = 1.1;
        const oldScale = stage.scaleX();

        const pointer = stage.getPointerPosition();
        if (!pointer) return;  

        const mousePointTo = {
            x: pointer.x / oldScale - stage.x() / oldScale,
            y: pointer.y / oldScale - stage.y() / oldScale,
        };

        const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;

        setStageScale(newScale);
        setStagePosition({
            x: -(mousePointTo.x - pointer.x / newScale) * newScale,
            y: -(mousePointTo.y - pointer.y / newScale) * newScale,
        });
    };

    const handleDragMove = (seat: Seat, e: any) => {
        const node = e.target;
        const newX = snapToGrid(node.x());
        const newY = snapToGrid(node.y());
        
        node.position({
            x: newX,
            y: newY
        });
    };

    const handleDragEnd = async (seat: Seat, e: any) => {
        try {
            const pos = e.target.position();
            const updatedSeat = {
                id: seat.id,
                event_id: seat.event_id,
                row_number: seat.row_number,
                seat_number: seat.seat_number,
                x_position: snapToGrid(pos.x),
                y_position: snapToGrid(pos.y),
            };

            const { error } = await supabase
                .from('seats')
                .update({
                    x_position: updatedSeat.x_position,
                    y_position: updatedSeat.y_position,
                })
                .eq('id', seat.id);

            if (error) {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Failed to update seat position"
                });
                return;
            }

            const newSeats = seats.map(s => 
                s.id === seat.id ? { ...s, ...updatedSeat } : s
            );
            onSeatsChange(newSeats);
        } catch (error) {
            console.error('Error in handleDragEnd:', error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to update seat position"
            });
        }
    };

    const snapToGrid = (value: number) => {
        return Math.round(value / GRID_SIZE) * GRID_SIZE
    }

    const handleParticipantDrop = async (seat: Seat) => {
        if (!draggedParticipant) return;
        
        try {
            const { error } = await supabase
                .from('participants')
                .update({ seat_id: seat.id })
                .eq('id', draggedParticipant.id);

            if (error) throw error;

            const updatedSeats = seats.map(s => 
                s.id === seat.id 
                    ? { ...s, occupant_id: draggedParticipant.id }
                    : s
            );
            
            onSeatsChange(updatedSeats);
            onSeatAssign(draggedParticipant.id, seat.id);
            
            toast({
                variant: "default",
                title: "Success",
                description: `Assigned ${draggedParticipant.name} to seat ${seat.row_number}-${seat.seat_number}`
            });
        } catch (error: any) {
            console.error('Error assigning seat:', error);
            toast({
                variant: "destructive",
                title: "Error Assigning Seat",
                description: error.message
            });
        } finally {
            setDraggedParticipant(null);
        }
    };

    const autoArrangeSeats = async () => {
        try {
            const tables = Array.from(new Set(seats.map(s => s.row_number)));
            const spacing = TABLE_SIZE * 3; 
            const centerX = containerSize.width / 2;
            const centerY = containerSize.height / 2;
            
            let updatedSeats = [...seats];
            tables.forEach((tableNumber, tableIndex) => {
                const tableSeats = seats.filter(s => s.row_number === tableNumber);
                const row = Math.floor(tableIndex / 3); 
                const col = tableIndex % 3;
                
                const tableX = centerX + (col - 1) * spacing;
                const tableY = centerY + (row - 1) * spacing;
                
                tableSeats.forEach((seat, seatIndex) => {
                    const angleStep = (2 * Math.PI) / tableSeats.length;
                    const angle = seatIndex * angleStep - Math.PI / 2; 
                    const radius = TABLE_SIZE / 2 + 30; 
                    
                    const seatX = tableX + radius * Math.cos(angle);
                    const seatY = tableY + radius * Math.sin(angle);
                    
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
                        x_position: seat.x_position,
                        y_position: seat.y_position,
                        event_id: seat.event_id,
                        row_number: seat.row_number,
                        seat_number: seat.seat_number
                    }))
                );

            if (error) throw error;
            
            onSeatsChange(updatedSeats);
            
            toast({
                title: "Success",
                description: "Tables and seats have been auto-arranged"
            });
        } catch (error: any) {
            console.error('Error in autoArrangeSeats:', error);
            toast({
                variant: "destructive",
                title: "Error Auto-Arranging Tables",
                description: error.message
            });
        }
    };

    const addNewTable = async () => {
        try {
            const newTableNumber = Math.max(...seats.map(s => s.row_number), 0) + 1;
            const newSeatsCount = 6;
            
            const tableX = 300;
            const tableY = 300;
            const radius = 100; 
            
            const newSeats = [];
            
            for (let i = 0; i < newSeatsCount; i++) {
                const angle = (i * 360) / newSeatsCount;
                const angleRad = (angle * Math.PI) / 180;
                
                const seatX = tableX + radius * Math.cos(angleRad);
                const seatY = tableY + radius * Math.sin(angleRad);
                
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
                    description: `Added new table with ${newSeatsCount} seats`
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

    const deleteTable = async (tableNumber: number) => {
        try {
            const { error } = await supabase
                .from('seats')
                .delete()
                .eq('row_number', tableNumber)
                .eq('event_id', eventId);

            if (error) {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Failed to delete table"
                });
                console.error('Error deleting table:', error);
                return;
            }

            const updatedSeats = seats.filter(seat => seat.row_number !== tableNumber);
            onSeatsChange(updatedSeats);
            toast({
                variant: "default",
                title: "Success",
                description: "Table deleted successfully"
            });
        } catch (error) {
            console.error('Error in deleteTable:', error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to delete table"
            });
        }
    };

    const handleSeatClick = (seat: Seat) => {
        setSelectedSeat(seat);
    };

    const handleStageDragEnd = (e: any) => {
        setStagePosition({
            x: e.target.x(),
            y: e.target.y()
        });
    };

    const handleTableDragMove = (tableNumber: number, e: any) => {
        const node = e.target;
        const newX = snapToGrid(node.x());
        const newY = snapToGrid(node.y());
        
        node.position({
            x: newX,
            y: newY
        });

        const tableSeats = seats.filter(s => s.row_number === tableNumber);
        const oldTablePos = calculateTablePosition(tableNumber);
        const deltaX = newX - oldTablePos.x;
        const deltaY = newY - oldTablePos.y;

        const updatedSeats = seats.map(seat => {
            if (seat.row_number === tableNumber) {
                return {
                    ...seat,
                    x_position: seat.x_position + deltaX,
                    y_position: seat.y_position + deltaY
                };
            }
            return seat;
        });

        onSeatsChange(updatedSeats);
    };

    const handleTableDragEnd = async (tableNumber: number, e: any) => {
        try {
            const node = e.target;
            const newX = snapToGrid(node.x());
            const newY = snapToGrid(node.y());
            
            const tableSeats = seats.filter(s => s.row_number === tableNumber);
            const oldTablePos = calculateTablePosition(tableNumber);
            const deltaX = newX - oldTablePos.x;
            const deltaY = newY - oldTablePos.y;

            const updatedSeats = seats.map(seat => {
                if (seat.row_number === tableNumber) {
                    return {
                        ...seat,
                        x_position: seat.x_position + deltaX,
                        y_position: seat.y_position + deltaY
                    };
                }
                return seat;
            });

            const { error } = await supabase
                .from('seats')
                .upsert(
                    updatedSeats
                        .filter(seat => seat.row_number === tableNumber)
                        .map(seat => ({
                            id: seat.id,
                            event_id: seat.event_id,
                            row_number: seat.row_number,
                            seat_number: seat.seat_number,
                            x_position: seat.x_position,
                            y_position: seat.y_position,
                        }))
                );

            if (error) {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Failed to update table position"
                });
                return;
            }

            onSeatsChange(updatedSeats);
            
            toast({
                title: "Success",
                description: `Updated table ${tableNumber} position`
            });
        } catch (error) {
            console.error('Error in handleTableDragEnd:', error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to update table position"
            });
        }
    };

    const debouncedUpdate = useCallback(
        debounce(async (updatedSeats: Seat[]) => {
            const updates = updatedSeats.map(seat => ({
                id: seat.id,
                event_id: eventId,
                row_number: seat.row_number,
                seat_number: seat.seat_number,
                x_position: seat.x_position,
                y_position: seat.y_position
            }));

            try {
                const { error } = await supabase
                    .from('seats')
                    .upsert(updates);

                if (error) {
                    console.error('Error updating seats:', error);
                    return;
                }

                onSeatsChange(updatedSeats);
            } catch (error) {
                console.error('Failed to update seats:', error);
            }
        }, 1000),
        []
    );

    useEffect(() => {
        if (seats.length > 0) {
            debouncedUpdate(seats);
        }
    }, [seats]);

    useEffect(() => {
        const updateContainerSize = () => {
            if (containerRef.current) {
                const { clientWidth, clientHeight } = containerRef.current
                setContainerSize({
                    width: clientWidth,
                    height: clientHeight
                })
                
                const numTables = [...new Set(seats.map(s => s.row_number))].length
                const minDimension = Math.min(clientWidth, clientHeight)
                const idealTableSize = minDimension / (Math.ceil(Math.sqrt(numTables)) + 1)
                const newScale = Math.min(1, idealTableSize / TABLE_SIZE)
                setStageScale(newScale)
            }
        }

        updateContainerSize()
        window.addEventListener('resize', updateContainerSize)
        return () => window.removeEventListener('resize', updateContainerSize)
    }, [seats])

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
                        newTableNumber={newTableNumber}
                        setNewTableNumber={setNewTableNumber}
                        newSeatsCount={newSeatsCount}
                        setNewSeatsCount={setNewSeatsCount}
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
                        GRID_SIZE={GRID_SIZE}
                        GRID_COLOR={GRID_COLOR}
                        GRID_OPACITY={GRID_OPACITY}
                        SEAT_SIZE={SEAT_SIZE}
                        selectedTable={selectedTable}
                        setSelectedTable={setSelectedTable}
                        handleSeatDragMove={handleDragMove}
                        handleSeatDragEnd={handleDragEnd}
                        handleParticipantDrop={handleParticipantDrop}
                        handleTableDragMove={handleTableDragMove}
                        handleTableDragEnd={handleTableDragEnd}
                        handleWheel={handleWheel}
                        handleStageDragEnd={handleStageDragEnd}
                        stageRef={stageRef}
                    />
                </div>
            </div>
        </div>
    )
}

export default SeatingPlanEditor
