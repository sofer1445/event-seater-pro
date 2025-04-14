import express from 'express';
import { pool } from '../database';
import { Table } from '../types/tables';

const router = express.Router();

// Get all tables
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tables ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching tables:', error);
    res.status(500).json({ message: 'שגיאה בטעינת רשימת השולחנות' });
  }
});

// Get table by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM tables WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'השולחן לא נמצא' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching table:', error);
    res.status(500).json({ message: 'שגיאה בטעינת פרטי השולחן' });
  }
});

// Create new table
router.post('/', async (req, res) => {
  try {
    const {
      name,
      capacity,
      description,
      gender_restriction,
      religious_only,
      location,
      noise_level
    } = req.body;

    const result = await pool.query(
      `INSERT INTO tables (
        name, capacity, description, gender_restriction,
        religious_only, location, noise_level
      ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        name,
        capacity,
        description,
        gender_restriction || 'none',
        religious_only || false,
        location || 'center',
        noise_level || 'moderate'
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating table:', error);
    res.status(500).json({ 
      message: 'שגיאה ביצירת שולחן חדש', 
      error: error instanceof Error ? error.message : String(error) 
    });
  }
});

// Update table
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
      `UPDATE tables SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $${values.length} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'השולחן לא נמצא' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating table:', error);
    res.status(500).json({ message: 'שגיאה בעדכון פרטי השולחן' });
  }
});

// Delete table
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM tables WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'השולחן לא נמצא' });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting table:', error);
    res.status(500).json({ message: 'שגיאה במחיקת השולחן' });
  }
});

// Safe delete table with occupancy check
router.delete('/:id/safe', async (req, res) => {
  try {
    const { id } = req.params;
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Check if table has any occupied seats
      const occupiedResult = await client.query(
        'SELECT COUNT(*) as occupied_count FROM seats WHERE table_id = $1 AND occupied_by IS NOT NULL',
        [id]
      );
      
      const occupiedCount = parseInt(occupiedResult.rows[0].occupied_count);
      
      if (occupiedCount > 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ 
          message: 'השולחן לא ניתן למחיקה כיוון שיש בו מושבים תפוסים', 
          occupiedCount 
        });
      }
      
      // Delete the seats first
      await client.query('DELETE FROM seats WHERE table_id = $1', [id]);
      
      // Then delete the table
      const tableResult = await client.query('DELETE FROM tables WHERE id = $1 RETURNING *', [id]);
      
      if (tableResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ message: 'השולחן לא נמצא' });
      }
      
      await client.query('COMMIT');
      res.json({
        message: 'השולחן נמחק בהצלחה',
        table: tableResult.rows[0]
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error safely deleting table:', error);
    res.status(500).json({ message: 'שגיאה במחיקת השולחן' });
  }
});

// Clone an existing table
router.post('/:id/clone', async (req, res) => {
  try {
    const { id } = req.params;
    const { namePrefix, count = 1 } = req.body;
    
    // Get the source table
    const sourceTableResult = await pool.query('SELECT * FROM tables WHERE id = $1', [id]);
    
    if (sourceTableResult.rows.length === 0) {
      return res.status(404).json({ message: 'השולחן המקורי לא נמצא' });
    }
    
    const sourceTable = sourceTableResult.rows[0];
    const createdTables = [];
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Clone the table the specified number of times
      for (let i = 1; i <= count; i++) {
        const newName = namePrefix ? `${namePrefix} ${i}` : `${sourceTable.name} (עותק ${i})`;
        
        // Create the cloned table
        const clonedTableResult = await client.query(
          `INSERT INTO tables (
            name, capacity, description, gender_restriction,
            religious_only, location, noise_level
          ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
          [
            newName,
            sourceTable.capacity,
            sourceTable.description,
            sourceTable.gender_restriction,
            sourceTable.religious_only,
            sourceTable.location,
            sourceTable.noise_level
          ]
        );
        
        const clonedTable = clonedTableResult.rows[0];
        createdTables.push(clonedTable);
        
        // Get seats from the source table
        const sourceSeatsResult = await client.query(
          'SELECT * FROM seats WHERE table_id = $1',
          [id]
        );
        
        // Clone each seat but without occupied_by assignments
        for (const sourceSeat of sourceSeatsResult.rows) {
          await client.query(
            `INSERT INTO seats (
              table_id, position, status, description,
              is_accessible, is_quiet_zone, location
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
              clonedTable.id,
              sourceSeat.position,
              'available', // Always set as available
              sourceSeat.description,
              sourceSeat.is_accessible,
              sourceSeat.is_quiet_zone,
              sourceSeat.location
            ]
          );
        }
      }
      
      await client.query('COMMIT');
      res.status(201).json({
        message: `נוצרו ${createdTables.length} עותקים של השולחן בהצלחה`,
        tables: createdTables
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error cloning table:', error);
    res.status(500).json({ message: 'שגיאה ביצירת עותק לשולחן' });
  }
});

// Update table capacity (adding or removing seats as needed)
router.patch('/:id/capacity', async (req, res) => {
  try {
    const { id } = req.params;
    const { capacity } = req.body;
    
    if (typeof capacity !== 'number' || capacity < 1) {
      return res.status(400).json({ message: 'קיבולת השולחן חייבת להיות מספר חיובי' });
    }
    
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Update the table capacity
      const tableResult = await client.query(
        'UPDATE tables SET capacity = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
        [capacity, id]
      );
      
      if (tableResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ message: 'השולחן לא נמצא' });
      }
      
      // Get current seats
      const seatsResult = await client.query(
        'SELECT * FROM seats WHERE table_id = $1 ORDER BY position',
        [id]
      );
      
      const currentSeats = seatsResult.rows;
      const currentCapacity = currentSeats.length;
      
      if (capacity > currentCapacity) {
        // Add more seats
        for (let i = currentCapacity + 1; i <= capacity; i++) {
          await client.query(
            `INSERT INTO seats (
              table_id, position, status, description,
              is_accessible, is_quiet_zone, location
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
              id,
              i,
              'available',
              null,
              false,
              false,
              'center'
            ]
          );
        }
      } else if (capacity < currentCapacity) {
        // Check if any seats being removed are occupied
        const occupiedSeatsResult = await client.query(
          'SELECT * FROM seats WHERE table_id = $1 AND position > $2 AND occupied_by IS NOT NULL',
          [id, capacity]
        );
        
        if (occupiedSeatsResult.rows.length > 0) {
          await client.query('ROLLBACK');
          return res.status(400).json({ 
            message: 'לא ניתן להקטין את השולחן, יש מושבים תפוסים בעמדות שברצונך להסיר', 
            occupiedSeats: occupiedSeatsResult.rows 
          });
        }
        
        // Delete excess seats
        await client.query(
          'DELETE FROM seats WHERE table_id = $1 AND position > $2',
          [id, capacity]
        );
      }
      
      await client.query('COMMIT');
      
      // Get the updated list of seats
      const updatedSeatsResult = await pool.query(
        'SELECT * FROM seats WHERE table_id = $1 ORDER BY position',
        [id]
      );
      
      res.json({
        message: 'קיבולת השולחן עודכנה בהצלחה',
        table: tableResult.rows[0],
        seats: updatedSeatsResult.rows
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error updating table capacity:', error);
    res.status(500).json({ message: 'שגיאה בעדכון קיבולת השולחן' });
  }
});

// Get table seats
router.get('/:id/seats', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM seats WHERE table_id = $1 ORDER BY position',
      [id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching table seats:', error);
    res.status(500).json({ message: 'שגיאה בטעינת מקומות הישיבה' });
  }
});

export default router;
