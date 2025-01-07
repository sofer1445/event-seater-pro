-- Create events table
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    location TEXT,
    description TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create seats table
CREATE TABLE seats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    table_number INTEGER NOT NULL,
    seat_number INTEGER NOT NULL,
    x_position FLOAT NOT NULL,
    y_position FLOAT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id, table_number, seat_number)
);

-- Create participants table
CREATE TABLE participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    seat_id UUID REFERENCES seats(id),
    status TEXT CHECK (status IN ('pending', 'confirmed', 'declined')) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id, email)
);

-- Create notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    type TEXT CHECK (type IN ('seat_assignment', 'seat_change', 'event_update', 'reminder')) NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS policies
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Events policies
CREATE POLICY "Events are viewable by creator and participants" ON events
    FOR SELECT USING (
        auth.uid() = created_by OR 
        EXISTS (
            SELECT 1 FROM participants 
            WHERE participants.event_id = events.id 
            AND participants.user_id = auth.uid()
        )
    );

CREATE POLICY "Events are insertable by authenticated users" ON events
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Events are updatable by creator" ON events
    FOR UPDATE USING (auth.uid() = created_by);

-- Seats policies
CREATE POLICY "Seats are viewable by event creator and participants" ON seats
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM events 
            WHERE events.id = seats.event_id 
            AND (events.created_by = auth.uid() OR EXISTS (
                SELECT 1 FROM participants 
                WHERE participants.event_id = events.id 
                AND participants.user_id = auth.uid()
            ))
        )
    );

CREATE POLICY "Seats are manageable by event creator" ON seats
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM events 
            WHERE events.id = seats.event_id 
            AND events.created_by = auth.uid()
        )
    );

-- Participants policies
CREATE POLICY "Participants are viewable by event creator and the participant" ON participants
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM events 
            WHERE events.id = participants.event_id 
            AND events.created_by = auth.uid()
        ) OR user_id = auth.uid()
    );

CREATE POLICY "Participants are manageable by event creator" ON participants
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM events 
            WHERE events.id = participants.event_id 
            AND events.created_by = auth.uid()
        )
    );

-- Notifications policies
CREATE POLICY "Notifications are viewable by recipient" ON notifications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM participants 
            WHERE participants.id = notifications.participant_id 
            AND participants.user_id = auth.uid()
        )
    );

-- Create functions and triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_seats_updated_at
    BEFORE UPDATE ON seats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_participants_updated_at
    BEFORE UPDATE ON participants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
