-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- טבלת שולחנות
CREATE TABLE IF NOT EXISTS tables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  capacity INTEGER NOT NULL,
  description TEXT,
  gender_restriction VARCHAR(10) DEFAULT 'none',
  religious_only BOOLEAN DEFAULT false,
  location VARCHAR(10) NOT NULL DEFAULT 'center',
  noise_level VARCHAR(10) NOT NULL DEFAULT 'moderate',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- טבלת מקומות ישיבה
CREATE TABLE IF NOT EXISTS seats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_id UUID REFERENCES tables(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'available',
  location VARCHAR(10) NOT NULL DEFAULT 'center',
  position INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- טבלת עובדים
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  gender VARCHAR(10) NOT NULL,
  religious_level VARCHAR(20) NOT NULL DEFAULT 'secular',
  team VARCHAR(255),
  team_members UUID[] DEFAULT '{}',
  health_constraints BOOLEAN DEFAULT false,
  noise_preference VARCHAR(10) DEFAULT 'any',
  location_preference VARCHAR(10) DEFAULT 'any',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- אינדקסים
CREATE INDEX IF NOT EXISTS idx_seats_table_id ON seats(table_id);
CREATE INDEX IF NOT EXISTS idx_employees_team ON employees(team);
CREATE INDEX IF NOT EXISTS idx_tables_location ON tables(location);
CREATE INDEX IF NOT EXISTS idx_tables_noise_level ON tables(noise_level);

-- טריגר לעדכון תאריך העדכון
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

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
