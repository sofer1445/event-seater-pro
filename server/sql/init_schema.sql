-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tables table (renamed from rooms)
CREATE TABLE IF NOT EXISTS tables (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  name TEXT NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 1,
  description TEXT,
  gender_restriction TEXT CHECK (gender_restriction IN ('male', 'female', 'none')) DEFAULT 'none',
  religious_only BOOLEAN DEFAULT false
);

-- Create seats table (simplified from workspaces)
CREATE TABLE IF NOT EXISTS seats (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  table_id uuid NOT NULL REFERENCES tables(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  occupied_by uuid,
  status TEXT CHECK (status IN ('available', 'occupied', 'reserved')) DEFAULT 'available'
);

-- Create employees table (simplified)
CREATE TABLE IF NOT EXISTS employees (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  is_religious BOOLEAN DEFAULT false,
  has_health_constraints BOOLEAN DEFAULT false
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_tables_updated_at') THEN
        CREATE TRIGGER update_tables_updated_at
            BEFORE UPDATE ON tables
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_seats_updated_at') THEN
        CREATE TRIGGER update_seats_updated_at
            BEFORE UPDATE ON seats
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_employees_updated_at') THEN
        CREATE TRIGGER update_employees_updated_at
            BEFORE UPDATE ON employees
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;
