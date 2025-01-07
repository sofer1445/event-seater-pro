import { Participant } from '@/types'
import { Badge } from '../ui/badge'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Switch } from '../ui/switch'
import { cn } from '@/lib/utils'

interface ParticipantListProps {
    searchQuery: string
    setSearchQuery: (query: string) => void
    showUnassignedOnly: boolean
    setShowUnassignedOnly: (show: boolean) => void
    filteredParticipants: Participant[]
    setDraggedParticipant: (participant: Participant | null) => void
    draggedParticipant: Participant | null
}

export const ParticipantList = ({
    searchQuery,
    setSearchQuery,
    showUnassignedOnly,
    setShowUnassignedOnly,
    filteredParticipants,
    setDraggedParticipant,
    draggedParticipant
}: ParticipantListProps) => {
    return (
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
    )
}