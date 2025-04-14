import { pool } from '../database';

async function migrateEmployees() {
  try {
    console.log('Starting employee migration...');
    
    // Get all employees
    const result = await pool.query('SELECT * FROM employees');
    const employees = result.rows;
    console.log(`Found ${employees.length} employees to migrate`);
    
    // Check if the new columns exist
    try {
      await pool.query('SELECT is_religious FROM employees LIMIT 1');
      console.log('is_religious column already exists');
    } catch (error) {
      console.log('Adding is_religious column...');
      await pool.query('ALTER TABLE employees ADD COLUMN is_religious BOOLEAN DEFAULT FALSE');
      console.log('is_religious column added');
    }
    
    try {
      await pool.query('SELECT has_health_constraints FROM employees LIMIT 1');
      console.log('has_health_constraints column already exists');
    } catch (error) {
      console.log('Adding has_health_constraints column...');
      await pool.query('ALTER TABLE employees ADD COLUMN has_health_constraints BOOLEAN DEFAULT FALSE');
      console.log('has_health_constraints column added');
    }
    
    // Update all employees to have at least one with religious constraints
    // This is just for demonstration purposes
    if (employees.length > 0) {
      const employeeToUpdate = employees[0];
      console.log(`Updating employee ${employeeToUpdate.first_name} ${employeeToUpdate.last_name} to have religious constraints`);
      await pool.query(
        'UPDATE employees SET is_religious = TRUE WHERE id = $1',
        [employeeToUpdate.id]
      );
      
      // If there's a second employee, set health constraints
      if (employees.length > 1) {
        const secondEmployee = employees[1];
        console.log(`Updating employee ${secondEmployee.first_name} ${secondEmployee.last_name} to have health constraints`);
        await pool.query(
          'UPDATE employees SET has_health_constraints = TRUE WHERE id = $1',
          [secondEmployee.id]
        );
      }
    }
    
    console.log('Employee migration completed successfully');
  } catch (error) {
    console.error('Error migrating employees:', error);
  }
}

export { migrateEmployees };
