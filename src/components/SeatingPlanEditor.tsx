import { useEffect, useState, useCallback, useRef } from 'react'
import { Seat, Participant } from '@/types'
import { useToast } from './ui/use-toast'
import { supabase } from '../integrations/supabase/client'
import { Card, CardContent } from './ui/card'
import { useMediaQuery } from '@/hooks/use-media-query'
import { ParticipantList } from './seating/ParticipantList'
import { SeatingControls } from './seating/SeatingControls'
import { TableActions } from './seating/TableActions'
import { SeatingArea } from './seating/SeatingArea'
import { GuestAssignment } from './seating/GuestAssignment'
import { Droppable, Draggable, DragDropContext } from 'react-beautiful-dnd'
import { UserCircle } from 'lucide-react'

interface SeatingPlanEditorProps {
    eventId: string
    seats: Seat[]
    participants: Participant[]
    onSeatsChange: (seats: Seat[]) => void
    onParticipantsChange: (participants: Participant[]) => void
    onSeatAssign: (participantId: string, seatId: string) => Promise<void>
}

export const SeatingPlanEditor = ({
    eventId,
    seats,
    participants,
    onSeatsChange,
    onParticipantsChange,
    onSeatAssign,
}: SeatingPlanEditorProps) => {
    const [showGrid, setShowGrid] = useState(true)
    const [draggedParticipant, setDraggedParticipant] = useState<Participant | null>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const { toast } = useToast()
    const isMobile = useMediaQuery('(max-width: 768px)')
    const [containerSize, setContainerSize] = useState({ width: 800, height: 600 })
    const [searchQuery, setSearchQuery] = useState('')
    const [showUnassignedOnly, setShowUnassignedOnly] = useState(false)
    const [isAddingTable, setIsAddingTable] = useState(false)

    useEffect(() => {
        const updateSize = () => {
            if (containerRef.current) {
                const { width, height } = containerRef.current.getBoundingClientRect()
                setContainerSize({ width, height: height - 60 }) // Subtract toolbar height
            }
        }
        
        updateSize()
        window.addEventListener('resize', updateSize)
        return () => window.removeEventListener('resize', updateSize)
    }, [])

    const addTestParticipants = useCallback(async () => {
        try {
            const { data: existingTestParticipants, error: countError } = await supabase
                .from('participants')
                .select('id')
                .eq('event_id', eventId)
                .like('email', '%@test.com')

            if (countError) throw countError

            const startIndex = (existingTestParticipants?.length || 0) + 1
            const timestamp = Date.now()
            
            const testParticipants = Array.from({ length: 5 }).map((_, index) => ({
                event_id: eventId,
                name: `אורח ${startIndex + index}`,
                email: `guest${startIndex + index}_${timestamp}@test.com`,
                status: 'pending',
                user_id: null,
                seat_id: null
            }))

            const { data, error } = await supabase
                .from('participants')
                .insert(testParticipants)
                .select()

            if (error) throw error

            if (data) {
                onParticipantsChange([...participants, ...data])
                toast({
                    title: "הצלחה",
                    description: `נוספו ${testParticipants.length} אורחים לניסיון`,
                })
            }
        } catch (error: any) {
            console.error('❌ Error adding test participants:', error)
            toast({
                title: "שגיאה",
                description: "אירעה שגיאה בהוספת אורחים לניסיון: " + error.message,
                variant: "destructive",
            })
        }
    }, [eventId, participants, onParticipantsChange, toast])

    const filteredParticipants = participants.filter(participant => {
        const matchesSearch = participant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            participant.email.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesUnassigned = !showUnassignedOnly || !participant.seat_id
        return matchesSearch && matchesUnassigned
    })

    const tables = Array.from(new Set(seats.map(s => s.table_number))).map(tableNum => ({
        id: tableNum,
        seats: seats.filter(s => s.table_number === tableNum)
    }))

    return (
        <div className="flex h-screen overflow-hidden">
            {/* Left Sidebar */}
            <div className="w-80 border-r p-4 flex flex-col space-y-4 bg-background">
                <Card>
                    <CardContent className="p-4">
                        <ParticipantList
                            searchQuery={searchQuery}
                            setSearchQuery={setSearchQuery}
                            showUnassignedOnly={showUnassignedOnly}
                            setShowUnassignedOnly={setShowUnassignedOnly}
                            filteredParticipants={filteredParticipants}
                            setDraggedParticipant={setDraggedParticipant}
                            draggedParticipant={draggedParticipant}
                        />
                    </CardContent>
                </Card>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-4">
                <div className="flex gap-4 mb-4">
                    <SeatingControls
                        showGrid={showGrid}
                        setShowGrid={setShowGrid}
                        setAutoArrange={() => {}}
                        isAddingTable={isAddingTable}
                        setIsAddingTable={setIsAddingTable}
                        addNewTable={async () => {}}
                    />
                    <TableActions
                        eventId={eventId}
                        seats={seats}
                        onSeatsChange={onSeatsChange}
                    />
                </div>
                
                <Card>
                    <CardContent className="p-4">
                        <div ref={containerRef} className="w-full h-[calc(100vh-200px)]">
                            <div className="flex h-full">
                                <div className="flex-1">
                                    <SeatingArea
                                        containerSize={containerSize}
                                        seats={seats}
                                        participants={participants}
                                        onSeatsChange={onSeatsChange}
                                        onSeatAssign={onSeatAssign}
                                        draggedParticipant={draggedParticipant}
                                        showGrid={showGrid}
                                    />
                                </div>
                                <div className="w-[400px] border-l">
                                    <DragDropContext onDragEnd={async (result) => {
                                        if (!result.destination) return;
                                        
                                        const participantId = result.draggableId;
                                        const tableId = parseInt(result.destination.droppableId.replace('table-', ''));
                                        
                                        const availableSeat = seats.find(s => 
                                            s.table_number === tableId && 
                                            s.status === 'available' &&
                                            !participants.some(p => p.seat_id === s.id)
                                        );
                                        
                                        if (availableSeat) {
                                            await onSeatAssign(participantId, availableSeat.id);
                                        }
                                    }}>
                                        <div className="flex flex-col h-full">
                                            <div className="flex-1 p-4">
                                                <div className="mb-6">
                                                    <div className="flex items-center gap-2 mb-4">
                                                        <UserCircle className="w-5 h-5" />
                                                        <h2 className="text-lg font-semibold">אורחים לא משובצים</h2>
                                                    </div>
                                                    <Droppable droppableId="unassigned">
                                                        {(provided) => (
                                                            <div {...provided.droppableProps} ref={provided.innerRef} 
                                                                 className="space-y-2">
                                                                {participants
                                                                    .filter(p => !p.seat_id)
                                                                    .map((guest, index) => (
                                                                        <Draggable key={guest.id} draggableId={guest.id} index={index}>
                                                                            {(provided) => (
                                                                                <div
                                                                                    ref={provided.innerRef}
                                                                                    {...provided.draggableProps}
                                                                                    {...provided.dragHandleProps}
                                                                                    className="p-2 bg-gray-50 rounded-md hover:bg-gray-100"
                                                                                >
                                                                                    {guest.name}
                                                                                </div>
                                                                            )}
                                                                        </Draggable>
                                                                    ))}
                                                                {provided.placeholder}
                                                            </div>
                                                        )}
                                                    </Droppable>
                                                </div>

                                                {tables.map((tableNum) => (
                                                    <div key={tableNum.id} className="mb-6">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <h3 className="font-semibold">שולחן {tableNum.id}</h3>
                                                            <span className="text-sm text-gray-500">
                                                                {seats.filter(s => s.table_number === tableNum.id && s.status === 'occupied').length}/
                                                                {seats.filter(s => s.table_number === tableNum.id).length} מקומות
                                                            </span>
                                                        </div>
                                                        <Droppable droppableId={`table-${tableNum.id}`}>
                                                            {(provided) => (
                                                                <div {...provided.droppableProps} ref={provided.innerRef}
                                                                     className="grid grid-cols-2 gap-2">
                                                                    {tableNum.seats
                                                                        .sort((a, b) => a.seat_number - b.seat_number)
                                                                        .map((seat) => {
                                                                            const participant = participants.find(p => p.seat_id === seat.id);
                                                                            return (
                                                                                <div key={seat.id} 
                                                                                     className={`p-2 border rounded-md ${participant ? 'bg-gray-50' : 'border-dashed'}`}>
                                                                                    {participant ? (
                                                                                        <div className="flex justify-between items-center">
                                                                                            <span>{participant.name}</span>
                                                                                            <span className="text-sm text-gray-500">
                                                                                                {seat.seat_number}
                                                                                            </span>
                                                                                        </div>
                                                                                    ) : (
                                                                                        <div className="text-center text-gray-400">
                                                                                            מקום {seat.seat_number}
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    {provided.placeholder}
                                                                </div>
                                                            )}
                                                        </Droppable>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </DragDropContext>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
