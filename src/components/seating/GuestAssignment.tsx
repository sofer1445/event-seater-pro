import React from 'react';
import { Participant, Seat } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { UserCircle } from 'lucide-react';

interface GuestAssignmentProps {
  unassignedGuests: Participant[];
  tables: { id: number; seats: Seat[] }[];
  onGuestAssign: (participantId: string, tableId: number) => void;
  participants: Participant[];
}

export const GuestAssignment: React.FC<GuestAssignmentProps> = ({
  unassignedGuests,
  tables,
  onGuestAssign,
  participants,
}) => {
  const onDragEnd = (result: any) => {
    if (!result.destination) return;
    
    const guestId = result.draggableId;
    const tableId = parseInt(result.destination.droppableId.replace('table-', ''));
    onGuestAssign(guestId, tableId);
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex flex-col gap-4 p-4">
        {/* Unassigned Guests Section */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <UserCircle className="w-5 h-5" />
            <h2 className="text-lg font-semibold">אורחים לא משובצים</h2>
          </div>
          <Droppable droppableId="unassigned">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef}>
                {unassignedGuests.map((guest, index) => (
                  <Draggable key={guest.id} draggableId={guest.id} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className="flex items-center justify-between p-3 mb-2 bg-gray-50 rounded-md"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-gray-700">{guest.name}</span>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>

        {/* Tables Section */}
        {tables.map((table) => (
          <div key={table.id} className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">שולחן {table.id}</h3>
              <span className="text-sm text-gray-500">
                {table.seats.filter(s => s.status === 'occupied').length}/{table.seats.length} מקומות
              </span>
            </div>
            <Droppable droppableId={`table-${table.id}`}>
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef}>
                  {table.seats
                    .filter(seat => seat.status === 'occupied')
                    .map((seat, index) => {
                      const participant = participants.find(p => p.seat_id === seat.id);
                      if (!participant) return null;
                      
                      return (
                        <div key={seat.id} className="flex items-center justify-between p-3 mb-2 bg-gray-50 rounded-md">
                          <span className="text-gray-700">{participant.name}</span>
                          <span className="text-sm text-gray-500">מקום {seat.seat_number}</span>
                        </div>
                      );
                    })}
                  {provided.placeholder}
                  {table.seats.filter(s => s.status === 'occupied').length < table.seats.length && (
                    <div className="text-center p-3 border border-dashed border-gray-300 rounded-md">
                      גרור אורחים לכאן
                    </div>
                  )}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
};
