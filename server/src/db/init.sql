-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist
DROP TABLE IF EXISTS allocation_history CASCADE;
DROP TABLE IF EXISTS allocations CASCADE;
DROP TABLE IF EXISTS workspaces CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;
DROP TABLE IF EXISTS employees CASCADE;

-- Create tables table
CREATE TABLE IF NOT EXISTS tables (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  name TEXT NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 1,
  description TEXT,
  gender_restriction TEXT DEFAULT 'none',
  religious_only BOOLEAN DEFAULT FALSE,
  location TEXT DEFAULT 'center',
  noise_level TEXT DEFAULT 'moderate'
);

-- Create seats table
CREATE TABLE IF NOT EXISTS seats (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  table_id uuid NOT NULL REFERENCES tables(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  occupied_by uuid,
  status TEXT CHECK (status IN ('available', 'occupied', 'reserved')) DEFAULT 'available',
  description TEXT,
  is_accessible BOOLEAN DEFAULT FALSE,
  is_quiet_zone BOOLEAN DEFAULT FALSE,
  location TEXT CHECK (location IN ('window', 'center')) DEFAULT 'center'
);

-- Create employees table
CREATE TABLE IF NOT EXISTS employees (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  is_religious BOOLEAN DEFAULT FALSE,
  has_health_constraints BOOLEAN DEFAULT FALSE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  religious_level TEXT CHECK (religious_level IN ('secular', 'traditional', 'religious', 'orthodox')),
  team TEXT,
  preferred_colleagues TEXT[],
  preferred_location TEXT CHECK (preferred_location IN ('window', 'center', 'any')) DEFAULT 'any',
  noise_preference TEXT CHECK (noise_preference IN ('quiet', 'moderate', 'loud', 'any')) DEFAULT 'any',
  constraints JSONB DEFAULT '{}'::jsonb
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
CREATE TRIGGER update_tables_updated_at
    BEFORE UPDATE ON tables
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_seats_updated_at
    BEFORE UPDATE ON seats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employees_updated_at
    BEFORE UPDATE ON employees
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
