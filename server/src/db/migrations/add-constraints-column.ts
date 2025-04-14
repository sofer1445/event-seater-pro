import { pool } from '../../database';

async function addConstraintsColumn() {
  try {
    console.log('Running migration: Adding constraints column to employees table...');
    
    // Add constraints column to employees table
    await pool.query(`
      ALTER TABLE employees 
      ADD COLUMN IF NOT EXISTS constraints JSONB DEFAULT '{}'::jsonb;
    `);
    
    console.log('✅ Migration completed successfully: constraints column added to employees table');
  } catch (err) {
    console.error('❌ Error running migration:', err);
    throw err;
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  addConstraintsColumn()
    .then(() => {
      console.log('Migration completed. Exiting...');
      process.exit(0);
    })
    .catch(err => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}

export default addConstraintsColumn;
