import { SeatingMap } from "@/components/SeatingMap";
import SeatingPlanEditor from "@/components/SeatingPlanEditor";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, Mail, Users, Edit, Save, Grid2X2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, parseISO } from "date-fns";

interface EventDetailProps {
  isEditing?: boolean;
}

const EventDetail = ({ isEditing = false }: EventDetailProps) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<any>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    date: "",
    location: "",
  });
  const [activeTab, setActiveTab] = useState<"view" | "edit">("view");

  useEffect(() => {
    if (id) {
      loadEventDetails();
      loadParticipants();
    }
  }, [id]);

  const loadEventDetails = async () => {
    // First load the event details
    const { data: eventData, error: eventError } = await supabase
      .from("events")
      .select("*")
      .eq("id", id)
      .single();

    if (eventError) {
      toast.error("Failed to load event details");
      return;
    }

    // Then load the seats separately
    const { data: seatsData, error: seatsError } = await supabase
      .from("seats")
      .select("*")
      .eq("event_id", id);

    if (seatsError) {
      toast.error("Failed to load seats");
      return;
    }

    setEvent({ ...eventData, seats: seatsData || [] });
    setEditForm({
      title: eventData.title,
      description: eventData.description,
      date: format(parseISO(eventData.date), 'yyyy-MM-dd'),
      location: eventData.location,
    });
  };

  const loadParticipants = async () => {
    const { data, error } = await supabase
      .from("participants")
      .select("*")
      .eq("event_id", id);

    if (error) {
      toast.error("Failed to load participants");
      return;
    }

    setParticipants(data || []);
  };

  const handleExport = () => {
    toast.success("Seating map exported successfully!");
  };

  const handleNotify = () => {
    toast.success("Notifications sent to all participants!");
  };

  const handleSave = async () => {
    // Format the date as ISO string, but only the date part
    const formattedDate = new Date(editForm.date + 'T00:00:00').toISOString();
    
    const { error } = await supabase
      .from("events")
      .update({
        title: editForm.title,
        description: editForm.description,
        date: formattedDate,
        location: editForm.location,
      })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update event");
      return;
    }

    toast.success("Event updated successfully");
    loadEventDetails(); // Reload the event details after saving
    setActiveTab("view"); // Switch back to view mode
  };

  const handleSeatsChange = async (updatedSeats: any[]) => {
    const { error } = await supabase
      .from("seats")
      .upsert(
        updatedSeats.map(seat => ({
          ...seat,
          event_id: id
        }))
      );

    if (error) {
      toast.error("Failed to update seats");
      return;
    }

    loadEventDetails();
  };

  const handleSeatAssign = async (participantId: string, seatId: string) => {
    const { error } = await supabase
      .from("participants")
      .update({ seat_id: seatId })
      .eq("id", participantId);

    if (error) {
      toast.error("Failed to assign seat");
      return;
    }

    loadParticipants();
    loadEventDetails();
  };

  if (!event) return <div>Loading...</div>;

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          {isEditing ? (
            <div className="space-y-2">
              <Input
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                className="text-3xl font-bold"
              />
              <Input
                type="date"
                value={editForm.date}
                onChange={(e) => {
                  const newDate = e.target.value;
                  setEditForm({ ...editForm, date: newDate });
                }}
              />
              <Input
                value={editForm.location}
                onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                placeholder="Location"
              />
            </div>
          ) : (
            <>
              <h1 className="text-3xl font-bold">{event.title}</h1>
              <p className="text-muted-foreground">{format(parseISO(event.date), 'MMMM d, yyyy')}</p>
              <p className="text-muted-foreground">{event.location}</p>
            </>
          )}
        </div>
        <div className="flex gap-4">
          {isEditing ? (
            <Button onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => navigate(`/event/${id}/edit`)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button variant="outline" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" onClick={handleNotify}>
                <Mail className="w-4 h-4 mr-2" />
                Notify All
              </Button>
            </>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value: string) => setActiveTab(value as "view" | "edit")}>
        <TabsList>
          <TabsTrigger value="view">View Seating</TabsTrigger>
          <TabsTrigger value="edit">Edit Seating Plan</TabsTrigger>
        </TabsList>
        <TabsContent value="view">
          <div className="grid md:grid-cols-[1fr_300px] gap-6">
            <SeatingMap 
              rows={5} 
              seatsPerRow={8} 
              seats={event.seats}
              onSeatClick={(seat) => handleSeatAssign(null, seat.id)}
            />
            
            <div className="space-y-6">
              <Card>
                <CardContent className="pt-6">
                  {isEditing ? (
                    <Textarea
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      placeholder="Event description"
                      className="min-h-[100px]"
                    />
                  ) : (
                    <p>{event.description}</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>
                      {event.seats?.filter((s: any) => s.status === 'occupied').length} /{" "}
                      {event.seats?.length} seats occupied
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="edit">
          <div className="bg-white rounded-lg shadow-sm">
            <SeatingPlanEditor
              eventId={id}
              seats={event.seats || []}
              participants={participants}
              onSeatsChange={handleSeatsChange}
              onSeatAssign={handleSeatAssign}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EventDetail;