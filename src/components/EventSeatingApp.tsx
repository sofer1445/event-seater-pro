import { useEffect, useState } from 'react'
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react'
import { Event, Participant, Seat } from '../types'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { useToast } from './ui/use-toast'

export default function EventSeatingApp() {
    const supabase = useSupabaseClient()
    const user = useUser()
    const { toast } = useToast()
    const [events, setEvents] = useState<Event[]>([])
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
    const [participants, setParticipants] = useState<Participant[]>([])
    const [seats, setSeats] = useState<Seat[]>([])

    useEffect(() => {
        if (user) {
            loadEvents()
        }
    }, [user])

    const loadEvents = async () => {
        try {
            const { data, error } = await supabase
                .from('events')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error
            setEvents(data || [])
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to load events',
                variant: 'destructive',
            })
        }
    }

    const createEvent = async (formData: FormData) => {
        try {
            const eventData = {
                name: formData.get('name'),
                date: formData.get('date'),
                location: formData.get('location'),
                description: formData.get('description'),
                created_by: user?.id,
            }

            const { data, error } = await supabase
                .from('events')
                .insert(eventData)
                .select()
                .single()

            if (error) throw error

            setEvents([data, ...events])
            toast({
                title: 'Success',
                description: 'Event created successfully',
            })
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to create event',
                variant: 'destructive',
            })
        }
    }

    const loadEventDetails = async (event: Event) => {
        try {
            setSelectedEvent(event)

            // Load participants
            const { data: participantsData, error: participantsError } = await supabase
                .from('participants')
                .select('*')
                .eq('event_id', event.id)

            if (participantsError) throw participantsError
            setParticipants(participantsData || [])

            // Load seats
            const { data: seatsData, error: seatsError } = await supabase
                .from('seats')
                .select('*')
                .eq('event_id', event.id)

            if (seatsError) throw seatsError
            setSeats(seatsData || [])
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to load event details',
                variant: 'destructive',
            })
        }
    }

    return (
        <div className="container mx-auto py-8">
            <Tabs defaultValue="events">
                <TabsList>
                    <TabsTrigger value="events">Events</TabsTrigger>
                    {selectedEvent && (
                        <TabsTrigger value="seating">Seating Plan</TabsTrigger>
                    )}
                </TabsList>

                <TabsContent value="events">
                    <div className="grid gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Create New Event</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault()
                                        const formData = new FormData(e.currentTarget)
                                        createEvent(formData)
                                    }}
                                    className="space-y-4"
                                >
                                    <div>
                                        <Label htmlFor="name">Event Name</Label>
                                        <Input
                                            id="name"
                                            name="name"
                                            required
                                            placeholder="Enter event name"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="date">Date</Label>
                                        <Input
                                            id="date"
                                            name="date"
                                            type="datetime-local"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="location">Location</Label>
                                        <Input
                                            id="location"
                                            name="location"
                                            placeholder="Enter location"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="description">Description</Label>
                                        <Input
                                            id="description"
                                            name="description"
                                            placeholder="Enter description"
                                        />
                                    </div>
                                    <Button type="submit">Create Event</Button>
                                </form>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Your Events</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {events.map((event) => (
                                        <Card key={event.id} className="p-4">
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <h3 className="font-semibold">
                                                        {event.name}
                                                    </h3>
                                                    <p className="text-sm text-gray-500">
                                                        {new Date(
                                                            event.date
                                                        ).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <Button
                                                    onClick={() => loadEventDetails(event)}
                                                >
                                                    Manage
                                                </Button>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {selectedEvent && (
                    <TabsContent value="seating">
                        <Card>
                            <CardHeader>
                                <CardTitle>
                                    Seating Plan - {selectedEvent.name}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {/* TODO: Add SeatingPlanEditor component here */}
                                <p>Seating plan editor will be implemented here</p>
                            </CardContent>
                        </Card>
                    </TabsContent>
                )}
            </Tabs>
        </div>
    )
}
