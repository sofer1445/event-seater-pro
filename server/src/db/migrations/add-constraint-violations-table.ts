import { pool } from '../../database';

async function addConstraintViolationsTable() {
  try {
    console.log('Running migration: Adding constraint_violations table...');
    
    // Create the constraint_violations table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS constraint_violations (
        id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
        employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        seat_id uuid NOT NULL REFERENCES seats(id) ON DELETE CASCADE,
        constraint_details JSONB NOT NULL DEFAULT '[]'::jsonb,
        resolved BOOLEAN DEFAULT FALSE,
        resolution_notes TEXT
      );
      
      CREATE INDEX IF NOT EXISTS idx_constraint_violations_employee_id ON constraint_violations(employee_id);
      CREATE INDEX IF NOT EXISTS idx_constraint_violations_seat_id ON constraint_violations(seat_id);
      
      -- Update trigger for the new table
      DROP TRIGGER IF EXISTS update_constraint_violations_updated_at ON constraint_violations;
      
      CREATE TRIGGER update_constraint_violations_updated_at BEFORE UPDATE
      ON constraint_violations FOR EACH ROW EXECUTE FUNCTION 
      update_updated_at_column();
    `);
    
    console.log('u2705 Migration completed successfully: constraint_violations table created');
  } catch (err) {
    console.error('u274c Error running migration:', err);
    throw err;
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  addConstraintViolationsTable()
    .then(() => {
      console.log('Migration completed. Exiting...');
      process.exit(0);
    })
    .catch(err => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}

export default addConstraintViolationsTable;
