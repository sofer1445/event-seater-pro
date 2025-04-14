import { Router } from 'express';
import pool from '../database';

const router = Router();

// Get all workspaces
router.get('/', async (req, res) => {
  console.log('GET /api/workspaces - Fetching all workspaces');
  try {
    const result = await pool.query('SELECT * FROM workspaces ORDER BY created_at DESC');
    console.log(`Query returned ${result.rows.length} workspaces`);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching workspaces:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: 'Failed to fetch workspaces', details: errorMessage });
  }
});

// Generic query handler
router.post('/query', async (req, res) => {
  console.log('POST /api/workspaces/query - Handling query');
  try {
    const { query, params } = req.body;

    // If no specific query is provided, default to fetching all workspaces
    const queryText = query || 'SELECT * FROM workspaces ORDER BY created_at DESC';
    const queryParams = params || [];

    console.log('Executing query:', queryText);
    console.log('Query parameters:', queryParams);

    const result = await pool.query(queryText, queryParams);
    
    console.log(`Query returned ${result.rows.length} rows`);
    res.json(result.rows);
  } catch (error) {
    console.error('Error executing workspace query:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ 
      error: 'Failed to execute workspace query', 
      details: errorMessage 
    });
  }
});

// Create workspace
router.post('/', async (req, res) => {
  console.log('POST /api/workspaces - Creating new workspace');
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { name, room_id, coordinates, features, restrictions } = req.body;

    // First, find or create a room
    let roomQuery = 'SELECT id FROM rooms WHERE name = $1';
    let roomResult = await client.query(roomQuery, [room_id]);

    let roomId;
    if (roomResult.rows.length === 0) {
      // If room doesn't exist, create it
      const insertRoomQuery = `
        INSERT INTO rooms (name, floor) 
        VALUES ($1, 1) 
        RETURNING id
      `;
      roomResult = await client.query(insertRoomQuery, [room_id]);
    }

    roomId = roomResult.rows[0].id;

    // Then create the workspace
    const workspaceQuery = `
      INSERT INTO workspaces (name, room_id, coordinates, features, restrictions)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const workspaceResult = await client.query(workspaceQuery, [
      name, 
      roomId, 
      JSON.stringify(coordinates || { x: 0, y: 0 }), 
      features || [], 
      restrictions || []
    ]);

    await client.query('COMMIT');

    console.log('Workspace created successfully:', workspaceResult.rows[0]);
    res.status(201).json(workspaceResult.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating workspace:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: 'Failed to create workspace', details: errorMessage });
  } finally {
    client.release();
  }
});

// Create workspace with automatic room handling
router.post('/create', async (req, res) => {
  console.log('POST /api/workspaces/create - Creating new workspace');
  const client = await pool.connect();

  try {
    // Start a transaction
    await client.query('BEGIN');

    const { 
      name, 
      room, 
      coordinates, 
      features = [], 
      restrictions = [] 
    } = req.body;

    // If no room provided, create a default room
    let roomId;
    if (!room) {
      console.log('No room provided. Creating default room.');
      const defaultRoomResult = await client.query(`
        INSERT INTO rooms (name, floor) 
        VALUES ('Default Room', 1) 
        ON CONFLICT (name) DO UPDATE 
        SET name = EXCLUDED.name 
        RETURNING id
      `);
      roomId = defaultRoomResult.rows[0].id;
    } else {
      // Find or create the specified room
      const roomResult = await client.query(`
        INSERT INTO rooms (name, floor) 
        VALUES ($1, 1) 
        ON CONFLICT (name) DO UPDATE 
        SET name = EXCLUDED.name 
        RETURNING id
      `, [room]);
      roomId = roomResult.rows[0].id;
    }

    // Create workspace
    const workspaceResult = await client.query(`
      INSERT INTO workspaces (
        name, 
        room_id, 
        coordinates, 
        features, 
        restrictions
      ) VALUES ($1, $2, $3, $4, $5) RETURNING *
    `, [
      name, 
      roomId, 
      JSON.stringify(coordinates || { x: 0, y: 0 }), 
      features, 
      restrictions
    ]);

    // Commit the transaction
    await client.query('COMMIT');

    res.status(201).json(workspaceResult.rows[0]);
  } catch (error) {
    // Rollback the transaction in case of error
    await client.query('ROLLBACK');

    console.error('Error creating workspace:', error);
    res.status(500).json({ 
      error: 'Failed to create workspace', 
      details: error instanceof Error ? error.message : String(error) 
    });
  } finally {
    // Release the client back to the pool
    client.release();
  }
});

// Update workspace position
router.put('/:id/position', async (req, res) => {
  const { id } = req.params;
  const { x, y } = req.body;

  try {
    const result = await pool.query(
      'UPDATE workspaces SET x = $1, y = $2 WHERE id = $3 RETURNING *',
      [x, y, id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Workspace not found' });
    } else {
      res.json(result.rows[0]);
    }
  } catch (error) {
    console.error('Error updating workspace position:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
