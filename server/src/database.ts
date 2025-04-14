import { Pool, PoolConfig } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

// Load environment variables from the project root
dotenv.config({ path: path.join(__dirname, '../.env') });

console.log('Loading environment variables from:', path.join(__dirname, '../.env'));

const dbConfig: PoolConfig = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'event_seater',
  password: process.env.DB_PASSWORD || '1234',
  port: parseInt(process.env.DB_PORT || '5432'),
  ssl: false
};

console.log('Database Configuration:', {
  host: dbConfig.host,
  port: dbConfig.port,
  database: dbConfig.database,
  user: dbConfig.user,
  ssl: dbConfig.ssl,
  passwordProvided: !!dbConfig.password
});

// Create a new pool
export const pool = new Pool(dbConfig);

// Test connection
pool.connect()
  .then(client => {
    console.log('u2705 Successfully connected to PostgreSQL');
    
    // Test querying the tables
    client.query('SELECT * FROM tables')
      .then(result => {
        console.log('Tables in database:', result.rows.length);
        console.log('Sample table data:', result.rows[0] || 'No tables found');
      })
      .catch(err => {
        console.error('u274c Error querying tables:', err);
      });
      
    // Test querying the employees
    client.query('SELECT * FROM employees')
      .then(result => {
        console.log('Employees in database:', result.rows.length);
        console.log('Sample employee data:', result.rows[0] || 'No employees found');
      })
      .catch(err => {
        console.error('u274c Error querying employees:', err);
      });
      
    // Test querying the seats
    client.query('SELECT * FROM seats')
      .then(result => {
        console.log('Seats in database:', result.rows.length);
        console.log('Sample seat data:', result.rows[0] || 'No seats found');
      })
      .catch(err => {
        console.error('u274c Error querying seats:', err);
      });
      
    client.release();
  })
  .catch(err => {
    console.error('u274c Failed to connect to PostgreSQL:', err);
  });

// Export query function
export const query = (text: string, params?: any[]) => pool.query(text, params);

// Define custom error interface for database errors
export interface DatabaseError extends Error {
  code?: string;
}

// Initialize database function
export async function initDatabase() {
  try {
    console.log('Initializing database...');
    
    // Create extension for UUID generation
    await pool.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);
    
    // Create tables if they don't exist
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
      );

      CREATE TABLE IF NOT EXISTS employees (
        id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        is_religious BOOLEAN DEFAULT FALSE,
        has_health_constraints BOOLEAN DEFAULT FALSE,
        constraints JSONB DEFAULT '{}'::jsonb
      );

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
      );
    `);
    
    // Create updated_at trigger function
    await pool.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ language 'plpgsql';
      
      DROP TRIGGER IF EXISTS update_tables_updated_at ON tables;
      DROP TRIGGER IF EXISTS update_seats_updated_at ON seats;
      DROP TRIGGER IF EXISTS update_employees_updated_at ON employees;
      
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
    
    console.log('u2705 Database initialized successfully');
    
    // Run migrations
    await runMigrations();
    
    return true;
  } catch (err) {
    console.error('u274c Error initializing database:', err);
    throw err;
  }
}

// Run migrations function
async function runMigrations() {
  try {
    console.log('Running migrations...');
    
    // Add any migrations here
    
    console.log('u2705 Migrations completed successfully');
  } catch (err) {
    console.error('u274c Error running migrations:', err);
    throw err;
  }
}

// Test connection and initialize database
pool.connect()
  .then(() => initDatabase())
  .then(() => {
    console.log('u2705 Database setup completed successfully');
  })
  .catch((err) => {
    console.error('u274c Database setup failed:', err);
    process.exit(1);
  });

// Function to test database queries
export async function testDatabaseQueries() {
  try {
    console.log('Testing database queries...');
    
    // Test querying the tables
    const tablesResult = await query('SELECT * FROM tables');
    console.log('Tables in database:', tablesResult.rows.length);
    console.log('Sample table data:', tablesResult.rows[0] || 'No tables found');
    
    // Test querying the employees
    const employeesResult = await query('SELECT * FROM employees');
    console.log('Employees in database:', employeesResult.rows.length);
    console.log('Sample employee data:', employeesResult.rows[0] || 'No employees found');
    
    // Test querying the seats
    const seatsResult = await query('SELECT * FROM seats');
    console.log('Seats in database:', seatsResult.rows.length);
    console.log('Sample seat data:', seatsResult.rows[0] || 'No seats found');
    
    console.log('u2705 Database queries tested successfully');
  } catch (err) {
    console.error('u274c Error testing database queries:', err);
  }
}
