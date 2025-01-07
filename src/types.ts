export interface Seat {
    id: string;
    event_id: string;
    table_number: number;
    seat_number: number;
    x_position: number;
    y_position: number;
    status: 'available' | 'occupied';
    created_at?: string;
    updated_at?: string;
}

export interface Participant {
    id: string;
    event_id: string;
    user_id?: string;
    name: string;
    email: string;
    seat_id?: string;
    status: 'pending' | 'confirmed' | 'declined';
    created_at?: string;
    updated_at?: string;
}
