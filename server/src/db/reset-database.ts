import { pool } from '../database';

async function resetDatabase() {
  try {
    console.log('Starting database reset...');
    
    // Drop all tables
    await pool.query('DROP TABLE IF EXISTS seats CASCADE');
    await pool.query('DROP TABLE IF EXISTS tables CASCADE');
    await pool.query('DROP TABLE IF EXISTS employees CASCADE');
    
    console.log('All tables dropped successfully');
    
    // Create tables table with all required columns
    await pool.query(`
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
      )
    `);
    
    console.log('Tables table created successfully');
    
    // Create employees table with all required columns
    await pool.query(`
      CREATE TABLE IF NOT EXISTS employees (
        id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        is_religious BOOLEAN DEFAULT FALSE,
        has_health_constraints BOOLEAN DEFAULT FALSE
      )
    `);
    
    console.log('Employees table created successfully');
    
    // Create seats table with all required columns
    await pool.query(`
      CREATE TABLE IF NOT EXISTS seats (
        id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
        table_id uuid NOT NULL REFERENCES tables(id) ON DELETE CASCADE,
        position INTEGER NOT NULL,
        occupied_by uuid,
        status TEXT DEFAULT 'available',
        description TEXT,
        is_accessible BOOLEAN DEFAULT FALSE,
        is_quiet_zone BOOLEAN DEFAULT FALSE,
        location TEXT DEFAULT 'center'
      )
    `);
    
    console.log('Seats table created successfully');
    
    // Create updated_at trigger function
    await pool.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);
    
    // Create triggers for updated_at
    await pool.query(`
      CREATE TRIGGER update_tables_updated_at BEFORE UPDATE
      ON tables FOR EACH ROW EXECUTE FUNCTION 
      update_updated_at_column();
      
      CREATE TRIGGER update_seats_updated_at BEFORE UPDATE
      ON seats FOR EACH ROW EXECUTE FUNCTION 
      update_updated_at_column();
      
      CREATE TRIGGER update_employees_updated_at BEFORE UPDATE
      ON employees FOR EACH ROW EXECUTE FUNCTION 
      update_updated_at_column();
    `);
    
    console.log('Triggers created successfully');
    console.log('Database reset completed successfully');
    
    return true;
  } catch (error) {
    console.error('Error resetting database:', error);
    return false;
  }
}

export { resetDatabase };
