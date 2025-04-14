import express from 'express';
import { pool } from '../database';

// Define a simple Employee interface that matches the database schema
interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  gender?: 'male' | 'female' | 'other';
  religious_level?: 'secular' | 'traditional' | 'religious' | 'orthodox';
  is_religious: boolean;
  has_health_constraints: boolean;
  preferred_location?: 'window' | 'center' | 'any';
  noise_preference?: 'quiet' | 'moderate' | 'loud' | 'any';
  created_at?: Date;
  updated_at?: Date;
}

const router = express.Router();

// Get all employees
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM employees ORDER BY first_name, last_name');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ message: 'שגיאה בטעינת רשימת העובדים' });
  }
});

// Get employee by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM employees WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'העובד לא נמצא' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching employee:', error);
    res.status(500).json({ message: 'שגיאה בטעינת פרטי העובד' });
  }
});

// Create new employee
router.post('/', async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      email,
      gender,
      religious_level,
      is_religious,
      has_health_constraints,
      preferred_location,
      noise_preference
    } = req.body;

    // Validate required fields
    if (!first_name || !last_name || !email) {
      return res.status(400).json({ message: 'שם פרטי, שם משפחה ואימייל הם שדות חובה' });
    }

    // Check if employee with this email already exists
    const existingEmployee = await pool.query(
      'SELECT * FROM employees WHERE email = $1',
      [email]
    );

    if (existingEmployee.rows.length > 0) {
      return res.status(409).json({ 
        message: 'עובד עם אימייל זה כבר קיים במערכת',
        employee: existingEmployee.rows[0]
      });
    }

    console.log('Creating employee with data:', { 
      first_name, 
      last_name, 
      email, 
      gender, 
      religious_level, 
      is_religious, 
      has_health_constraints,
      preferred_location,
      noise_preference
    });

    // Insert employee with all fields
    const result = await pool.query(
      `INSERT INTO employees (
        first_name, last_name, email, gender, religious_level, 
        is_religious, has_health_constraints, preferred_location, noise_preference
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        first_name,
        last_name,
        email,
        gender || null,
        religious_level || null,
        is_religious || false,
        has_health_constraints || false,
        preferred_location || null,
        noise_preference || null
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating employee:', error);
    res.status(500).json({ message: 'שגיאה ביצירת עובד חדש' });
  }
});

// Update employee
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Build the update query dynamically
    const setClause = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 1}`)
      .join(', ');
    
    const values = [...Object.values(updates), id];
    
    const result = await pool.query(
      `UPDATE employees SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $${values.length} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'העובד לא נמצא' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(500).json({ message: 'שגיאה בעדכון פרטי העובד' });
  }
});

// Get employee constraints
router.get('/:id/constraints', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT constraints FROM employees WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'העובד לא נמצא' });
    }
    
    res.json(result.rows[0].constraints || {});
  } catch (error) {
    console.error('Error fetching employee constraints:', error);
    res.status(500).json({ message: 'שגיאה בטעינת אילוצי העובד' });
  }
});

// Update employee constraints (patch only the constraints field)
router.patch('/:id/constraints', async (req, res) => {
  try {
    const { id } = req.params;
    const { constraints } = req.body;
    
    if (!constraints) {
      return res.status(400).json({ message: 'לא סופקו אילוצים לעדכון' });
    }
    
    // Convert to JSON string if it's not already
    const constraintsJson = typeof constraints === 'string' ? constraints : JSON.stringify(constraints);
    
    const result = await pool.query(
      'UPDATE employees SET constraints = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [constraintsJson, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'העובד לא נמצא' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating employee constraints:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ message: 'שגיאה בעדכון אילוצי העובד', error: errorMessage });
  }
});

// Delete employee
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM employees WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'העובד לא נמצא' });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({ message: 'שגיאה במחיקת העובד' });
  }
});

export default router;
