import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Switch } from './ui/switch'
import { Textarea } from './ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { toast } from 'sonner'
import { supabase } from '@/integrations/supabase/client'

interface EventSettingsProps {
    eventId: string
    title: string
    date: string
    capacity: number
    category?: string
    description?: string
    onUpdate: () => void
}

export const EventSettings = ({
    eventId,
    title: initialTitle,
    date: initialDate,
    capacity: initialCapacity,
    category: initialCategory,
    description: initialDescription,
    onUpdate,
}: EventSettingsProps) => {
    const [title, setTitle] = useState(initialTitle)
    const [date, setDate] = useState(initialDate)
    const [capacity, setCapacity] = useState(initialCapacity)
    const [category, setCategory] = useState(initialCategory || '')
    const [description, setDescription] = useState(initialDescription || '')
    const [notifyParticipants, setNotifyParticipants] = useState(false)

    const handleSave = async () => {
        try {
            const { error } = await supabase
                .from('events')
                .update({
                    title,
                    date,
                    capacity: parseInt(capacity.toString()),
                    category: category || null,
                    description: description || null,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', eventId)

            if (error) throw error

            if (notifyParticipants) {
                // Fetch participants and send notifications
                const { data: participants } = await supabase
                    .from('participants')
                    .select('email')
                    .eq('event_id', eventId)

                // Here you would integrate with your email service to send notifications
                console.log('Would send notifications to:', participants?.map(p => p.email))
            }

            toast.success('Event settings updated successfully')
            onUpdate()
        } catch (error) {
            console.error('Error updating event:', error)
            toast.error('Failed to update event settings')
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Event Settings</CardTitle>
                <CardDescription>Manage your event details and preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="title">Event Title</Label>
                    <Input
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="date">Event Date</Label>
                    <Input
                        id="date"
                        type="datetime-local"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="capacity">Capacity</Label>
                    <Input
                        id="capacity"
                        type="number"
                        min={1}
                        value={capacity}
                        onChange={(e) => setCapacity(parseInt(e.target.value))}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="wedding">Wedding</SelectItem>
                            <SelectItem value="conference">Conference</SelectItem>
                            <SelectItem value="party">Party</SelectItem>
                            <SelectItem value="meeting">Meeting</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={4}
                    />
                </div>

                <div className="flex items-center space-x-2">
                    <Switch
                        id="notify"
                        checked={notifyParticipants}
                        onCheckedChange={setNotifyParticipants}
                    />
                    <Label htmlFor="notify">Notify participants of changes</Label>
                </div>

                <Button onClick={handleSave} className="w-full">
                    Save Changes
                </Button>
            </CardContent>
        </Card>
    )
}
