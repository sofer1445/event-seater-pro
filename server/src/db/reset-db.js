const { Pool } = require('pg');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Create a new pool
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'event_seater',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

async function resetDatabase() {
  try {
    console.log('Starting database reset...');
    
    // Connect to the database
    const client = await pool.connect();
    
    try {
      // Start a transaction
      await client.query('BEGIN');
      
      // Drop all tables if they exist
      await client.query('DROP TABLE IF EXISTS seats CASCADE');
      await client.query('DROP TABLE IF EXISTS employees CASCADE');
      await client.query('DROP TABLE IF EXISTS tables CASCADE');
      
      console.log('All tables dropped successfully');
      
      // Create tables table with all required columns
      await client.query(`
        CREATE TABLE tables (
          id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
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
      await client.query(`
        CREATE TABLE employees (
          id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
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
      await client.query(`
        CREATE TABLE seats (
          id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
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
      await client.query(`
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = CURRENT_TIMESTAMP;
            RETURN NEW;
        END;
        $$ language 'plpgsql';
      `);
      
      // Create triggers for updated_at
      await client.query(`
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
      
      // Commit the transaction
      await client.query('COMMIT');
      console.log('Database reset completed successfully');
    } catch (error) {
      // Rollback the transaction if there's an error
      await client.query('ROLLBACK');
      console.error('Error resetting database:', error);
    } finally {
      // Release the client back to the pool
      client.release();
    }
  } catch (error) {
    console.error('Error connecting to database:', error);
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Run the reset function
resetDatabase();
