import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, Users } from "lucide-react";

interface EventCardProps {
  title: string;
  date: string;
  capacity: number;
  occupied: number;
  status: "upcoming" | "in-progress" | "completed";
  onClick: () => void;
}

export function EventCard({ title, date, capacity, occupied, status, onClick }: EventCardProps) {
  const statusColors = {
    "upcoming": "bg-blue-500",
    "in-progress": "bg-green-500",
    "completed": "bg-gray-500"
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription className="flex items-center mt-2">
              <CalendarDays className="w-4 h-4 mr-2" />
              {date}
            </CardDescription>
          </div>
          <Badge className={statusColors[status]}>
            {status.replace("-", " ")}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Users className="w-4 h-4 mr-2" />
            <span className="text-sm text-muted-foreground">
              {occupied}/{capacity} seats
            </span>
          </div>
          <Button onClick={onClick} variant="outline">
            Manage Seats
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}