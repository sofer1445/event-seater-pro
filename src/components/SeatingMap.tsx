import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface DatabaseSeat {
  id: string;
  event_id: string;
  row_number: number;
  seat_number: number;
  status: string;
  occupant_id?: string;
  created_at: string;
  updated_at: string;
}

interface Seat {
  id: string;
  row: number;
  number: number;
  status: "available" | "occupied" | "selected";
  occupant?: string;
}

interface SeatingMapProps {
  rows: number;
  seatsPerRow: number;
  seats?: DatabaseSeat[];
  onSeatClick?: (seat: DatabaseSeat) => void;
}

export function SeatingMap({ rows, seatsPerRow, seats: dbSeats, onSeatClick }: SeatingMapProps) {
  const [seats, setSeats] = useState<Seat[]>([]);

  useEffect(() => {
    if (dbSeats) {
      // Convert database seats to UI seats
      const uiSeats = dbSeats.map((dbSeat) => ({
        id: dbSeat.id,
        row: dbSeat.row_number,
        number: dbSeat.seat_number,
        status: dbSeat.status as "available" | "occupied" | "selected",
        occupant: dbSeat.occupant_id,
      }));
      setSeats(uiSeats);
    } else {
      // Initialize empty seats if no database seats provided
      const initialSeats: Seat[] = [];
      for (let row = 0; row < rows; row++) {
        for (let number = 0; number < seatsPerRow; number++) {
          initialSeats.push({
            id: `${row}-${number}`,
            row,
            number,
            status: "available"
          });
        }
      }
      setSeats(initialSeats);
    }
  }, [dbSeats, rows, seatsPerRow]);

  const handleSeatClick = (seat: Seat) => {
    const dbSeat = dbSeats?.find(s => s.id === seat.id);
    if (!dbSeat) {
      toast.error("Seat not found in database");
      return;
    }

    if (seat.status === "occupied") {
      toast.error("This seat is already occupied");
      return;
    }

    onSeatClick?.(dbSeat);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm">
      <div className="mb-8 text-center">
        <div className="p-8 bg-gray-100 rounded-lg">STAGE</div>
      </div>
      
      <div className="space-y-4">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex justify-center gap-4">
            {seats
              .filter((seat) => seat.row === rowIndex)
              .map((seat) => (
                <Button
                  key={seat.id}
                  variant={seat.status === "occupied" ? "default" : "outline"}
                  className={`w-10 h-10 p-0 ${
                    seat.status === "occupied"
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-primary/10"
                  }`}
                  onClick={() => handleSeatClick(seat)}
                >
                  {seat.number + 1}
                </Button>
              ))}
          </div>
        ))}
      </div>

      <div className="mt-8 flex justify-center gap-8">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-primary" />
          <span className="text-sm">Occupied</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border border-input" />
          <span className="text-sm">Available</span>
        </div>
      </div>
    </div>
  );
}
