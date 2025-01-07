import { useEffect, useRef, useState, useCallback } from 'react'
import { Stage, Layer, Rect, Text, Circle, Group, Line } from 'react-konva'
import { Seat, Participant } from '../types'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Search } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from './ui/dialog'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from './ui/card'
import { toast, useToast } from './ui/use-toast'
import { cn } from '../lib/utils'
import { Switch } from './ui/switch'
import { Badge } from './ui/badge'
import { supabase } from '../lib/supabase'
import { debounce } from 'lodash'

interface Props {
    eventId: string
    seats: Seat[]
    participants: Participant[]
    onSeatsChange: (seats: Seat[]) => void
    onSeatAssign: (participantId: string, seatId: string) => void
}

interface GridProps {
    width: number
    height: number
    cellWidth: number
    cellHeight: number
    stroke: string
    strokeWidth: number
}

const Grid = ({ width, height, cellWidth, cellHeight, stroke, strokeWidth }: GridProps) => {
    const lines = []
    
    // Vertical lines
    for (let i = 0; i <= width; i += cellWidth) {
        lines.push(
            <Line
                key={`v${i}`}
                points={[i, 0, i, height]}
                stroke={stroke}
                strokeWidth={strokeWidth}
            />
        )
    }
    
    // Horizontal lines
    for (let i = 0; i <= height; i += cellHeight) {
        lines.push(
            <Line
                key={`h${i}`}
                points={[0, i, width, i]}
                stroke={stroke}
                strokeWidth={strokeWidth}
            />
        )
    }
    
    return <>{lines}</>
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
    const [isAddingTable, setIsAddingTable] = useState(false);
    const [newTableNumber, setNewTableNumber] = useState(1);
    const [newSeatsCount, setNewSeatsCount] = useState(8);

    const containerRef = useRef<HTMLDivElement>(null);
    const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });
    const SEAT_SIZE = 40;
    const TABLE_SIZE = 120;
    const GRID_SIZE = 40;
    const GRID_COLOR = '#000000';
    const GRID_OPACITY = 0.2;

    const assignedSeats = seats.filter(seat => 
        participants.some(p => p.seat_id === seat.id)
    )

    const availableSeats = seats.filter(seat => 
        !participants.some(p => p.seat_id === seat.id)
    )

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
        // Update position in real-time during drag
        const newX = snapToGrid(node.x());
        const newY = snapToGrid(node.y());
        
        // Update the visual position
        node.position({
            x: newX,
            y: newY
        });
    };

    const handleDragMovePreventDefault = (seat: Seat, e: any) => {
        e.preventDefault();
    };

    const handleDragEnd = async (seat: Seat, e: any) => {
        try {
            const pos = e.target.position();
            const updatedSeat = {
                ...seat,
                x_position: snapToGrid(pos.x),
                y_position: snapToGrid(pos.y),
            };

            // Update the seat in Supabase
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
                console.error('Error updating seat:', error);
                return;
            }

            // Update local state
            const newSeats = seats.map(s => 
                s.id === seat.id ? updatedSeat : s
            );
            onSeatsChange(newSeats);
        } catch (error) {
            console.error('Error in handleSeatDragEnd:', error);
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
            // Update the seat in Supabase
            const { error } = await supabase
                .from('seats')
                .update({ occupant_id: draggedParticipant.id })
                .eq('id', seat.id);

            if (error) throw error;

            // Update local state
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
            const spacing = TABLE_SIZE * 3; // Space between tables
            
            let updatedSeats = [...seats];
            tables.forEach((tableNumber, tableIndex) => {
                const tableSeats = seats.filter(s => s.row_number === tableNumber);
                const row = Math.floor(tableIndex / 3); // 3 tables per row
                const col = tableIndex % 3;
                
                const tableX = (col * spacing) + spacing;
                const tableY = (row * spacing) + spacing;
                
                // Update positions for all seats at this table
                tableSeats.forEach((seat, seatIndex) => {
                    const angleStep = (2 * Math.PI) / tableSeats.length;
                    const angle = seatIndex * angleStep - Math.PI / 2; // Start from top
                    const radius = TABLE_SIZE / 2 + 30; // Distance from table center to seat
                    
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
            
            // Update all seats at once
            const { error } = await supabase
                .from('seats')
                .upsert(
                    updatedSeats.map(seat => ({
                        id: seat.id,
                        x_position: seat.x_position,
                        y_position: seat.y_position
                    }))
                );

            if (error) throw error;
            
            // Update local state
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
            
            // Calculate position for the new table
            const tableX = 300;
            const tableY = 300;
            const radius = 100; // Radius around the table
            
            const newSeats = [];
            
            // Create seats around the table
            for (let i = 0; i < newSeatsCount; i++) {
                const angle = (i * 360) / newSeatsCount;
                const angleRad = (angle * Math.PI) / 180;
                
                // Calculate seat position
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
                .insert([{
                    event_id: eventId,
                    row_number: newTableNumber,
                    seat_number: 1,
                    status: 'available',
                    x_position: 0,
                    y_position: 0,
                    occupant_id: null
                }])
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
            // Delete the seats from Supabase
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

            // Update local state
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

    const handleStageDragMove = (e: any) => {
        setStagePosition({
            x: e.target.x(),
            y: e.target.y()
        });
    };

    const handleStageDragEnd = (e: any) => {
        setStagePosition({
            x: e.target.x(),
            y: e.target.y()
        });
    };

    const calculateTablePosition = (tableNumber: number) => {
        const numTables = [...new Set(seats.map(s => s.row_number))].length;
        const tablesPerRow = Math.ceil(Math.sqrt(numTables));
        const spacing = TABLE_SIZE * 2;
        
        const row = Math.floor((tableNumber - 1) / tablesPerRow);
        const col = (tableNumber - 1) % tablesPerRow;
        
        return {
            x: (col * spacing) + spacing,
            y: (row * spacing) + spacing
        };
    };

    const renderTable = (tableNumber: number, tableSeats: Seat[]) => {
        const { x: tableX, y: tableY } = calculateTablePosition(tableNumber);
        const isSelected = selectedTable === tableNumber;
        
        return (
            <Group 
                key={`table-${tableNumber}`} 
                x={tableX} 
                y={tableY}
                draggable
                onDragMove={(e) => {
                    const pos = e.target.position();
                    const updatedSeats = tableSeats.map(seat => ({
                        ...seat,
                        x_position: seat.x_position + (pos.x - tableX),
                        y_position: seat.y_position + (pos.y - tableY)
                    }));
                    onSeatsChange(seats.map(s => 
                        updatedSeats.find(us => us.id === s.id) || s
                    ));
                }}
                onDragEnd={(e) => {
                    const pos = e.target.position();
                    const updatedSeats = tableSeats.map(seat => ({
                        ...seat,
                        x_position: snapToGrid(seat.x_position + (pos.x - tableX)),
                        y_position: snapToGrid(seat.y_position + (pos.y - tableY))
                    }));
                    onSeatsChange(seats.map(s => 
                        updatedSeats.find(us => us.id === s.id) || s
                    ));
                    // Reset the group position since we updated the actual coordinates
                    e.target.position({ x: tableX, y: tableY });
                }}
            >
                <Circle
                    radius={TABLE_SIZE / 2}
                    fill="#f3f4f6"
                    stroke={isSelected ? "#2563eb" : "#d1d5db"}
                    strokeWidth={2}
                    onClick={() => setSelectedTable(tableNumber)}
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

    // Add debounced update function
    const debouncedUpdate = useCallback(
        debounce(async (updatedSeats: Seat[]) => {
            const updates = updatedSeats.map(seat => ({
                id: seat.id,
                event_id: eventId,
                x_position: seat.x_position,
                y_position: seat.y_position,
                table_number: seat.row_number, // שמירה על מספר השולחן
                seat_number: seat.seat_number // שמירה על מספר המושב
            }));

            try {
                const { error } = await supabase
                    .from('seats')
                    .upsert(updates, { 
                        onConflict: 'id'
                    });

                if (error) {
                    console.error('Error updating seats:', error);
                    return;
                }

                // עדכון ה-UI רק אם העדכון בדאטהבייס הצליח
                onSeatsChange(updatedSeats);
            } catch (error) {
                console.error('Failed to update seats:', error);
            }
        }, 1000),
        []
    );

    // Update useEffect to handle batch updates
    useEffect(() => {
        if (seats.length > 0) {
            debouncedUpdate(seats);
        }
    }, [seats]);

    // Container size update effect
    useEffect(() => {
        const updateContainerSize = () => {
            if (containerRef.current) {
                const { clientWidth, clientHeight } = containerRef.current;
                setContainerSize({
                    width: clientWidth,
                    height: clientHeight
                });
                
                // Calculate appropriate scale based on number of tables
                const numTables = [...new Set(seats.map(s => s.row_number))].length;
                const minDimension = Math.min(clientWidth, clientHeight);
                const idealTableSize = minDimension / (Math.ceil(Math.sqrt(numTables)) + 1);
                const newScale = Math.min(1, idealTableSize / TABLE_SIZE);
                setStageScale(newScale);
            }
        };

        updateContainerSize();
        window.addEventListener('resize', updateContainerSize);
        return () => window.removeEventListener('resize', updateContainerSize);
    }, [seats]);

    const Grid = () => {
        const lines = [];
        const numLinesX = Math.ceil(containerSize.width / (GRID_SIZE * stageScale));
        const numLinesY = Math.ceil(containerSize.height / (GRID_SIZE * stageScale));

        // Vertical lines
        for (let i = 0; i <= numLinesX; i++) {
            lines.push(
                <Line
                    key={`v${i}`}
                    points={[i * GRID_SIZE, 0, i * GRID_SIZE, containerSize.height]}
                    stroke={GRID_COLOR}
                    strokeWidth={1}
                    opacity={GRID_OPACITY}
                />
            );
        }

        // Horizontal lines
        for (let i = 0; i <= numLinesY; i++) {
            lines.push(
                <Line
                    key={`h${i}`}
                    points={[0, i * GRID_SIZE, containerSize.width, i * GRID_SIZE]}
                    stroke={GRID_COLOR}
                    strokeWidth={1}
                    opacity={GRID_OPACITY}
                />
            );
        }

        return <>{lines}</>;
    };

    return (
        <div ref={containerRef} style={{ width: '100%', height: '100%', minHeight: '600px' }}>
            <div className="flex h-full">
                <div className="w-1/4 p-4 border-r">
                    <div className="space-y-4">
                        <Input
                            placeholder="Search participants..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <div className="flex items-center space-x-2">
                            <Switch
                                checked={showUnassignedOnly}
                                onCheckedChange={setShowUnassignedOnly}
                            />
                            <Label>Show unassigned only</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch
                                checked={showGrid}
                                onCheckedChange={setShowGrid}
                            />
                            <Label>Show grid</Label>
                        </div>
                        <Button
                            onClick={() => setAutoArrange(true)}
                            className="w-full"
                        >
                            Auto-arrange seats
                        </Button>
                        <Button 
                            variant="outline" 
                            onClick={() => setIsAddingTable(true)}
                        >
                            Add Table
                        </Button>
                    </div>

                    {isAddingTable && (
                        <Card className="p-4 space-y-4">
                            <CardHeader>
                                <CardTitle>Add New Table</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Table Number</Label>
                                        <Input
                                            type="number"
                                            value={newTableNumber}
                                            onChange={(e) => setNewTableNumber(parseInt(e.target.value))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Number of Seats</Label>
                                        <Input
                                            type="number"
                                            value={newSeatsCount}
                                            onChange={(e) => setNewSeatsCount(parseInt(e.target.value))}
                                        />
                                    </div>
                                    <Button onClick={addNewTable}>Create Table</Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <div className="mt-6">
                        <h3 className="font-medium mb-2">Participants</h3>
                        <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
                            {filteredParticipants.map((participant) => (
                                <div
                                    key={participant.id}
                                    className={cn(
                                        "flex items-center justify-between rounded-md border p-2",
                                        participant.seat_id ? "bg-green-50" : "bg-white",
                                        draggedParticipant?.id === participant.id && "opacity-50"
                                    )}
                                    draggable
                                    onDragStart={() => setDraggedParticipant(participant)}
                                    onDragEnd={() => setDraggedParticipant(null)}
                                >
                                    <div>
                                        <div>{participant.name}</div>
                                        <div className="text-sm text-gray-500">{participant.email}</div>
                                    </div>
                                    {participant.seat_id ? (
                                        <Badge variant="default">Assigned</Badge>
                                    ) : (
                                        <Badge variant="secondary">Unassigned</Badge>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex-1 relative">
                    <Stage
                        ref={stageRef}
                        width={containerSize.width}
                        height={containerSize.height}
                        scale={{ x: stageScale, y: stageScale }}
                        position={stagePosition}
                        draggable
                        onDragEnd={(e) => {
                            setStagePosition(e.target.position());
                        }}
                        onWheel={handleWheel}
                    >
                        <Layer>
                            {showGrid && <Grid />}
                            {/* Tables */}
                            {Array.from(new Set(seats.map(seat => seat.row_number))).map(tableNumber => {
                                const tableSeats = seats.filter(seat => seat.row_number === tableNumber);
                                return renderTable(tableNumber, tableSeats);
                            })}

                            {/* Seats */}
                            {seats.map((seat) => {
                                const isAssigned = participants.some(p => p.seat_id === seat.id)
                                const assignedParticipant = participants.find(p => p.seat_id === seat.id)

                                return (
                                    <Group
                                        key={seat.id}
                                        x={seat.x_position}
                                        y={seat.y_position}
                                        draggable
                                        onDragMove={(e) => handleDragMove(seat, e)}
                                        onDragEnd={(e) => handleDragEnd(seat, e)}
                                        onDragOver={(e) => handleDragMovePreventDefault(seat, e)}
                                        onDrop={() => handleParticipantDrop(seat)}
                                    >
                                        <Circle
                                            radius={SEAT_SIZE / 2}
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
                                )
                            })}
                        </Layer>
                    </Stage>
                </div>
            </div>
        </div>
    )
}

export default SeatingPlanEditor
