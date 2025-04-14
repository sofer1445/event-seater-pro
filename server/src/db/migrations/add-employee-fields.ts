import { pool } from '../../database';

async function addEmployeeFields() {
  try {
    console.log('Running migration: Adding new fields to employees table...');
    
    // Add new fields to employees table
    await pool.query(`
      ALTER TABLE employees 
      ADD COLUMN IF NOT EXISTS gender VARCHAR(10),
      ADD COLUMN IF NOT EXISTS religious_level VARCHAR(20),
      ADD COLUMN IF NOT EXISTS preferred_location VARCHAR(10),
      ADD COLUMN IF NOT EXISTS noise_preference VARCHAR(10);
    `);
    
    console.log('✅ Migration completed successfully: New fields added to employees table');
  } catch (err) {
    console.error('❌ Error running migration:', err);
    throw err;
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  addEmployeeFields()
    .then(() => {
      console.log('Migration completed. Exiting...');
      process.exit(0);
    })
    .catch(err => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}

export default addEmployeeFields;
