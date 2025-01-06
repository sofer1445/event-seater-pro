import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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
  onSeatClick?: (seat: Seat) => void;
}

export function SeatingMap({ rows, seatsPerRow, onSeatClick }: SeatingMapProps) {
  const [seats, setSeats] = useState<Seat[]>(() => {
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
    return initialSeats;
  });

  const handleSeatClick = (seat: Seat) => {
    if (seat.status === "occupied") {
      toast.error("This seat is already occupied");
      return;
    }

    const newSeats = seats.map((s) => {
      if (s.id === seat.id) {
        return {
          ...s,
          status: s.status === "selected" ? "available" : "selected"
        };
      }
      return s;
    });

    setSeats(newSeats);
    onSeatClick?.(seat);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <div className="mb-6 flex justify-center">
        <div className="w-48 h-2 bg-primary rounded-full mb-8" />
      </div>
      <div className="grid gap-4">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex justify-center">
            {seats
              .filter((seat) => seat.row === rowIndex)
              .map((seat) => (
                <div
                  key={seat.id}
                  className={`seat ${
                    seat.status === "available"
                      ? "seat-available"
                      : seat.status === "occupied"
                      ? "seat-occupied"
                      : "seat-selected"
                  }`}
                  onClick={() => handleSeatClick(seat)}
                >
                  {rowIndex + 1}-{seat.number + 1}
                </div>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}