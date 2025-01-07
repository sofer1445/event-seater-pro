import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { CalendarIcon, MapPinIcon, Users } from "lucide-react";

const EventNew = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    location: "",
    capacity: 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("No authenticated user found");
      }

      const { error } = await supabase.from("events").insert({
        ...formData,
        date: new Date(formData.date).toISOString(),
        created_by: user.id,
      });

      if (error) throw error;

      toast.success("Event created successfully!");
      navigate("/");
    } catch (error) {
      console.error("Error creating event:", error);
      toast.error("Failed to create event. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Create New Event</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-2">
              Event Title
            </label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              required
              placeholder="Enter event title"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-2">
              Description
            </label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Enter event description"
              className="min-h-[100px]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="date" className="block text-sm font-medium mb-2">
                Date and Time
              </label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="date"
                  type="datetime-local"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  required
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium mb-2">
                Location
              </label>
              <div className="relative">
                <MapPinIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  placeholder="Enter location"
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="capacity" className="block text-sm font-medium mb-2">
              Capacity
            </label>
            <div className="relative">
              <Users className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="capacity"
                type="number"
                min="1"
                value={formData.capacity}
                onChange={(e) =>
                  setFormData({ ...formData, capacity: Number(e.target.value) })
                }
                required
                placeholder="Enter total capacity"
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/")}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Event"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventNew;
