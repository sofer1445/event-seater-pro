export interface Event {
    id: string;
    name: string;
    date: string;
    location: string | null;
    description: string | null;
    created_by: string;
    created_at: string;
    updated_at: string;
}

export interface Seat {
    id: string;
    event_id: string;
    row_number: number;
    seat_number: number;
    status: string;
    x_position: number;
    y_position: number;
    occupant_id?: string;
    created_at: string;
    updated_at: string;
}

export interface Participant {
    id: string;
    event_id: string;
    user_id: string | null;
    name: string;
    email: string;
    seat_id: string | null;
    status: 'pending' | 'confirmed' | 'declined';
    created_at: string;
    updated_at: string;
}

export interface Notification {
    id: string;
    event_id: string;
    participant_id: string;
    message: string;
    type: 'seat_assignment' | 'seat_change' | 'event_update' | 'reminder';
    read: boolean;
    created_at: string;
}

export interface SeatAssignment {
    participant: Participant;
    seat: Seat;
}
