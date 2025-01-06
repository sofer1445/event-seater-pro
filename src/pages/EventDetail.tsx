import { SeatingMap } from "@/components/SeatingMap";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, Mail, Users } from "lucide-react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";

const EventDetail = () => {
  const { id } = useParams();

  const handleExport = () => {
    toast.success("Seating map exported successfully!");
  };

  const handleNotify = () => {
    toast.success("Notifications sent to all participants!");
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Annual Conference 2024</h1>
          <p className="text-muted-foreground">March 15, 2024</p>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" onClick={handleNotify}>
            <Mail className="w-4 h-4 mr-2" />
            Notify All
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-[1fr_300px] gap-6">
        <SeatingMap rows={5} seatsPerRow={8} />
        
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Event Statistics</h3>
                <Users className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Seats</span>
                  <span className="font-medium">40</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Assigned</span>
                  <span className="font-medium">28</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Available</span>
                  <span className="font-medium">12</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EventDetail;