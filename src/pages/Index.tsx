import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { EventCard } from "@/components/EventCard";
import { PlusCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";

interface Event {
  id: string;
  name: string;
  date: string;
  location?: string;
  description?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

interface ProcessedEvent {
  id: string;
  title: string;
  date: string;
  capacity: number;
  location: string;
  description: string;
  occupied: number;
  status: "upcoming" | "in-progress" | "completed";
}

interface DatabaseEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  capacity: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  seats: { 
    id: string;
    event_id: string;
    row_number: number;
    seat_number: number;
    status: string;
    occupant_id?: string;
    created_at: string;
    updated_at: string;
  }[];
}

const Index = () => {
  console.log('🔄 Index: Component mounted');
  const navigate = useNavigate();
  const [events, setEvents] = useState<ProcessedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProcessedEvent["status"] | "all">("all");
  const [sortBy, setSortBy] = useState<"date" | "title">("date");

  useEffect(() => {
    fetchEvents();
    const cleanup = subscribeToEvents();
    return () => {
      console.log('🔄 Index: Component unmounting');
      cleanup();
    };
  }, []);

  const fetchEvents = async () => {
    console.log('📡 Fetching events...');
    try {
      const { data, error } = await supabase
        .from("events")
        .select(`
          *,
          seats (
            id,
            event_id,
            row_number,
            seat_number,
            status,
            occupant_id,
            created_at,
            updated_at
          )
        `)
        .order(sortBy === 'title' ? 'title' : 'date', { ascending: true });

      console.log('📥 Raw events data:', data);
      console.log('❌ Supabase error:', error);

      if (error) throw error;

      console.log('🔍 Raw event data details:', data?.map(event => ({
        id: event.id,
        title: event.title,
        date: event.date
      })));

      const processedEvents: ProcessedEvent[] = (data as unknown as DatabaseEvent[]).map((event) => {
        console.log('🔄 Processing event:', event);
        
        if (!event.title) {
          console.warn('⚠️ Event missing title:', event.id);
        }

        return {
          id: event.id,
          title: event.title,
          date: new Date(event.date).toLocaleDateString(),
          capacity: event.capacity,
          location: event.location,
          description: event.description,
          occupied: event.seats?.filter((seat) => seat.status === "occupied").length ?? 0,
          status: determineEventStatus(new Date(event.date)),
        };
      });

      console.log('✨ Processed events:', processedEvents);
      setEvents(processedEvents);
      setLoading(false);
    } catch (error) {
      console.error('❌ Error fetching events:', error);
      toast.error("Error fetching events");
      setLoading(false);
    }
  };

  const determineEventStatus = (eventDate: Date): "upcoming" | "in-progress" | "completed" => {
    const now = new Date();
    if (eventDate > now) return "upcoming";
    if (eventDate < now) return "completed";
    return "in-progress";
  };

  const subscribeToEvents = () => {
    console.log('🔔 Setting up real-time subscription');
    const channel = supabase
      .channel("events_channel")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "events",
        },
        (payload) => {
          console.log('🔄 Real-time update received:', payload);
          fetchEvents();
        }
      )
      .subscribe((status) => {
        console.log('📡 Subscription status:', status);
      });

    return () => {
      console.log('🔔 Cleaning up subscription');
      supabase.removeChannel(channel);
    };
  };

  const filteredEvents = events
    .filter(event => {
      const searchLower = searchQuery.toLowerCase();
      const titleMatch = event.title?.toLowerCase()?.includes(searchLower) ?? false;
      const descriptionMatch = event.description?.toLowerCase()?.includes(searchLower) ?? false;
      
      if (!titleMatch && !descriptionMatch) {
        console.log('🔍 Event filtered out by search:', {
          id: event.id,
          title: event.title,
          searchQuery: searchQuery
        });
      }
      
      return titleMatch || descriptionMatch;
    })
    .filter(event => {
      const statusMatch = statusFilter === "all" ? true : event.status === statusFilter;
      
      if (!statusMatch) {
        console.log('🔍 Event filtered out by status:', {
          id: event.id,
          status: event.status,
          filterStatus: statusFilter
        });
      }
      
      return statusMatch;
    });

  console.log('🔍 Filtered events:', {
    total: events.length,
    filtered: filteredEvents.length,
    searchQuery,
    statusFilter
  });

  const handleDeleteEvent = async (eventId: string) => {
    console.log('🗑️ Attempting to delete event:', eventId);
    try {
      const { error } = await supabase
        .from("events")
        .delete()
        .eq("id", eventId);

      if (error) {
        console.error('❌ Error deleting event:', error);
        throw error;
      }

      console.log('✅ Event deleted successfully:', eventId);
      toast.success("Event deleted successfully");
      fetchEvents();
    } catch (error) {
      console.error('❌ Error in handleDeleteEvent:', error);
      toast.error("Error deleting event");
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Events</h1>
        <Button onClick={() => navigate("/event/new")} className="flex items-center gap-2">
          <PlusCircle className="w-4 h-4" />
          New Event
        </Button>
      </div>

      <div className="mb-6 space-y-4">
        <div className="flex gap-4">
          <Input
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
          <Select value={statusFilter} onValueChange={(value: ProcessedEvent["status"] | "all") => setStatusFilter(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(value: "date" | "title") => setSortBy(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Sort by Date</SelectItem>
              <SelectItem value="title">Sort by Title</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex justify-center">
            <Spinner />
          </div>
        ) : filteredEvents.length > 0 ? (
          filteredEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onDelete={() => handleDeleteEvent(event.id)}
              onEdit={() => navigate(`/event/${event.id}/edit`)}
            />
          ))
        ) : (
          <div className="col-span-full text-center text-gray-500">
            No events found
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;