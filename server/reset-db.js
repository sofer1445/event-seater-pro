const { Client } = require('pg');
require('dotenv').config();

// Database connection configuration
const config = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'event_seater',
  password: process.env.DB_PASSWORD || '1234',
  port: parseInt(process.env.DB_PORT || '5432'),
};

console.log('Using database configuration:', {
  host: config.host,
  port: config.port,
  database: config.database,
  user: config.user,
});

async function resetDatabase() {
  const client = new Client(config);
  
  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected successfully!');
    
    // Drop existing tables
    console.log('Dropping existing tables...');
    await client.query('DROP TABLE IF EXISTS seats CASCADE');
    await client.query('DROP TABLE IF EXISTS employees CASCADE');
    await client.query('DROP TABLE IF EXISTS tables CASCADE');
    console.log('Tables dropped successfully!');
    
    // Create extension for UUID
    console.log('Creating UUID extension...');
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    
    // Create tables table
    console.log('Creating tables table...');
    await client.query(`
      CREATE TABLE tables (
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
    
    // Create employees table
    console.log('Creating employees table...');
    await client.query(`
      CREATE TABLE employees (
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
    
    // Create seats table
    console.log('Creating seats table...');
    await client.query(`
      CREATE TABLE seats (
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
    
    // Create updated_at trigger function
    console.log('Creating triggers...');
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ language 'plpgsql';
      
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
    
    // Insert sample data
    console.log('Inserting sample data...');
    
    // Insert sample tables
    const table1 = await client.query(`
      INSERT INTO tables (name, capacity, description, gender_restriction, religious_only)
      VALUES ('שולחן 1', 8, 'שולחן מרכזי', 'none', false)
      RETURNING id
    `);
    
    const table2 = await client.query(`
      INSERT INTO tables (name, capacity, description, gender_restriction, religious_only)
      VALUES ('שולחן 2', 6, 'שולחן צד', 'none', false)
      RETURNING id
    `);
    
    // Insert sample employees
    await client.query(`
      INSERT INTO employees (first_name, last_name, email, is_religious, has_health_constraints)
      VALUES 
      ('יוסי', 'כהן', 'yossi@example.com', true, false),
      ('רונית', 'לוי', 'ronit@example.com', false, true),
      ('משה', 'ישראלי', 'moshe@example.com', false, false)
    `);
    
    // Insert sample seats
    const table1Id = table1.rows[0].id;
    const table2Id = table2.rows[0].id;
    
    for (let i = 1; i <= 8; i++) {
      await client.query(`
        INSERT INTO seats (table_id, position, status)
        VALUES ($1, $2, 'available')
      `, [table1Id, i]);
    }
    
    for (let i = 1; i <= 6; i++) {
      await client.query(`
        INSERT INTO seats (table_id, position, status)
        VALUES ($1, $2, 'available')
      `, [table2Id, i]);
    }
    
    console.log('Database reset and initialized successfully!');
  } catch (err) {
    console.error('Error resetting database:', err);
  } finally {
    await client.end();
    console.log('Database connection closed.');
  }
}

resetDatabase();
