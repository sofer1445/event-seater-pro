import express from 'express';
import { pool } from '../database';
import { Seat } from '../types/tables';

const router = express.Router();

// Get all seats
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM seats ORDER BY table_id, position');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching seats:', error);
    res.status(500).json({ message: 'שגיאה בטעינת רשימת המקומות' });
  }
});

// Get seat by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM seats WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'המקום לא נמצא' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching seat:', error);
    res.status(500).json({ message: 'שגיאה בטעינת פרטי המקום' });
  }
});

// Create new seat
router.post('/', async (req, res) => {
  try {
    const {
      table_id,
      position,
      description,
      is_accessible,
      is_quiet_zone
    } = req.body;

    const result = await pool.query(
      `INSERT INTO seats (
        table_id, position, description,
        is_accessible, is_quiet_zone
      ) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [
        table_id,
        position,
        description,
        is_accessible || false,
        is_quiet_zone || false
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating seat:', error);
    res.status(500).json({ message: 'שגיאה ביצירת מקום חדש' });
  }
});

// Update seat
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
      `UPDATE seats SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $${values.length} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'המקום לא נמצא' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating seat:', error);
    res.status(500).json({ message: 'שגיאה בעדכון פרטי המקום' });
  }
});

// Delete seat
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM seats WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'המקום לא נמצא' });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting seat:', error);
    res.status(500).json({ message: 'שגיאה במחיקת המקום' });
  }
});

export default router;
