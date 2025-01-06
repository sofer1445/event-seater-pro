import { Button } from "@/components/ui/button";
import { EventCard } from "@/components/EventCard";
import { PlusCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  const mockEvents = [
    {
      id: 1,
      title: "Annual Conference 2024",
      date: "March 15, 2024",
      capacity: 100,
      occupied: 67,
      status: "upcoming" as const
    },
    {
      id: 2,
      title: "Tech Summit",
      date: "April 2, 2024",
      capacity: 150,
      occupied: 89,
      status: "in-progress" as const
    }
  ];

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Event Seating Manager</h1>
        <Button onClick={() => navigate("/event/new")}>
          <PlusCircle className="w-4 h-4 mr-2" />
          New Event
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {mockEvents.map((event) => (
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
    </div>
  );
};

export default Index;