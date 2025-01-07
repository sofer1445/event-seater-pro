import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Edit2, Trash2, Users } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Event {
  id: string;
  title: string;
  date: string;
  capacity: number;
  occupied: number;
  status: "upcoming" | "in-progress" | "completed";
  category?: string;
  description?: string;
}

interface EventCardProps {
  event: Event;
  onDelete: () => void;
  onEdit: () => void;
}

export const EventCard = ({ event, onDelete, onEdit }: EventCardProps) => {
  const getStatusColor = (status: Event["status"]) => {
    switch (status) {
      case "upcoming":
        return "text-blue-600 bg-blue-100";
      case "in-progress":
        return "text-green-600 bg-green-100";
      case "completed":
        return "text-gray-600 bg-gray-100";
    }
  };

  return (
    <Card className="relative">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl">{event.title}</CardTitle>
            {event.category && (
              <CardDescription className="text-sm text-gray-500">
                {event.category}
              </CardDescription>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <Edit2 className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Edit2 className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the
                      event and all associated data.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        {event.description && (
          <p className="text-sm text-gray-500 mb-4">{event.description}</p>
        )}
        <div className="space-y-2">
          <div className="flex items-center text-sm text-gray-500">
            <Calendar className="mr-2 h-4 w-4" />
            {event.date}
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <Users className="mr-2 h-4 w-4" />
            {event.occupied} / {event.capacity} seats filled
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
            event.status
          )}`}
        >
          {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
        </span>
      </CardFooter>
    </Card>
  );
};