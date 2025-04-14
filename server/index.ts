import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Database connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'event_seater',
  password: process.env.DB_PASSWORD || 'postgres',
  port: parseInt(process.env.DB_PORT || '5432'),
});

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Routes
app.get('/api/tables', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tables ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching tables:', error);
    res.status(500).json({ message: 'שגיאה בשליפת השולחנות' });
  }
});

app.post('/api/tables', async (req, res) => {
  const { name, capacity, description, gender_restriction, religious_only } = req.body;
  
  try {
    const result = await pool.query(
      `INSERT INTO tables (id, name, capacity, description, gender_restriction, religious_only)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [uuidv4(), name, capacity, description, gender_restriction, religious_only]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating table:', error);
    res.status(500).json({ message: 'שגיאה ביצירת שולחן' });
  }
});

app.post('/api/tables/:id', async (req, res) => {
  const { id } = req.params;
  const { name, capacity, description, gender_restriction, religious_only } = req.body;
  
  try {
    const result = await pool.query(
      `UPDATE tables 
       SET name = $1, capacity = $2, description = $3, 
           gender_restriction = $4, religious_only = $5,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
      [name, capacity, description, gender_restriction, religious_only, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'שולחן לא נמצא' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating table:', error);
    res.status(500).json({ message: 'שגיאה בעדכון שולחן' });
  }
});

app.post('/api/tables/:id/delete', async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await pool.query('DELETE FROM tables WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'שולחן לא נמצא' });
    }
    
    res.json({ message: 'שולחן נמחק בהצלחה' });
  } catch (error) {
    console.error('Error deleting table:', error);
    res.status(500).json({ message: 'שגיאה במחיקת שולחן' });
  }
});

// Seats routes
app.get('/api/seats', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM seats ORDER BY table_id, position');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching seats:', error);
    res.status(500).json({ message: 'שגיאה בשליפת המקומות' });
  }
});

app.get('/api/tables/:tableId/seats', async (req, res) => {
  const { tableId } = req.params;
  try {
    const result = await pool.query('SELECT * FROM seats WHERE table_id = $1 ORDER BY position', [tableId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching table seats:', error);
    res.status(500).json({ message: 'שגיאה בשליפת המקומות בשולחן' });
  }
});

app.post('/api/tables/:tableId/seats', async (req, res) => {
  const { tableId } = req.params;
  const { position, status } = req.body;
  
  try {
    const result = await pool.query(
      `INSERT INTO seats (id, table_id, position, status)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [uuidv4(), tableId, position, status || 'available']
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating seat:', error);
    res.status(500).json({ message: 'שגיאה ביצירת מקום' });
  }
});

app.post('/api/seats/:id', async (req, res) => {
  const { id } = req.params;
  const { occupied_by, status } = req.body;
  
  try {
    const result = await pool.query(
      `UPDATE seats 
       SET occupied_by = $1, status = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [occupied_by, status, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'מקום לא נמצא' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating seat:', error);
    res.status(500).json({ message: 'שגיאה בעדכון מקום' });
  }
});

app.post('/api/seats/:id/delete', async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await pool.query('DELETE FROM seats WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'מקום לא נמצא' });
    }
    
    res.json({ message: 'מקום נמחק בהצלחה' });
  } catch (error) {
    console.error('Error deleting seat:', error);
    res.status(500).json({ message: 'שגיאה במחיקת מקום' });
  }
});

// Employees routes
app.get('/api/employees', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM employees ORDER BY last_name, first_name');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ message: 'שגיאה בשליפת העובדים' });
  }
});

app.get('/api/employees/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM employees WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'עובד לא נמצא' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching employee:', error);
    res.status(500).json({ message: 'שגיאה בשליפת העובד' });
  }
});

app.post('/api/employees', async (req, res) => {
  const { first_name, last_name, email, is_religious, has_health_constraints } = req.body;
  
  try {
    const result = await pool.query(
      `INSERT INTO employees (id, first_name, last_name, email, is_religious, has_health_constraints)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [uuidv4(), first_name, last_name, email, is_religious, has_health_constraints]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating employee:', error);
    res.status(500).json({ message: 'שגיאה ביצירת עובד' });
  }
});

app.post('/api/employees/:id', async (req, res) => {
  const { id } = req.params;
  const { first_name, last_name, email, is_religious, has_health_constraints } = req.body;
  
  try {
    const result = await pool.query(
      `UPDATE employees 
       SET first_name = $1, last_name = $2, email = $3, 
           is_religious = $4, has_health_constraints = $5,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
      [first_name, last_name, email, is_religious, has_health_constraints, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'עובד לא נמצא' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(500).json({ message: 'שגיאה בעדכון עובד' });
  }
});

app.post('/api/employees/:id/delete', async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await pool.query('DELETE FROM employees WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'עובד לא נמצא' });
    }
    
    res.json({ message: 'עובד נמחק בהצלחה' });
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({ message: 'שגיאה במחיקת עובד' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
