import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { EventCard } from "@/components/EventCard";
import { PlusCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Event {
  id: string;
  title: string;
  date: string;
  capacity: number;
  occupied: number;
  status: "upcoming" | "in-progress" | "completed";
}

const Index = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
    subscribeToEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const { data: eventsData, error } = await supabase
        .from("events")
        .select(`
          id,
          title,
          date,
          capacity,
          seats (
            status
          )
        `)
        .order("date", { ascending: true });

      if (error) throw error;

      const processedEvents = eventsData.map((event) => ({
        id: event.id,
        title: event.title,
        date: new Date(event.date).toLocaleDateString(),
        capacity: event.capacity,
        occupied: event.seats?.filter((seat) => seat.status === "occupied").length || 0,
        status: determineEventStatus(new Date(event.date))
      }));

      setEvents(processedEvents);
    } catch (error) {
      console.error("Error fetching events:", error);
      toast.error("Failed to load events");
    } finally {
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
    const channel = supabase
      .channel("events-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "events"
        },
        () => {
          fetchEvents();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Event Seating Manager</h1>
        <Button onClick={() => navigate("/event/new")}>
          <PlusCircle className="w-4 h-4 mr-2" />
          New Event
        </Button>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-600 mb-4">
            No events found
          </h3>
          <Button onClick={() => navigate("/event/new")} variant="outline">
            Create your first event
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <EventCard
              key={event.id}
              title={event.title}
              date={event.date}
              capacity={event.capacity}
              occupied={event.occupied}
              status={event.status}
              onClick={() => navigate(`/event/${event.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Index;