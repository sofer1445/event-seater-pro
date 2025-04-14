import { Router } from 'express';
import { pool } from '../database';

const router = Router();

router.post('/', async (req, res) => {
  console.log('POST /api/generic-query - Executing generic database query');
  
  try {
    const { query, params } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    console.log('Executing query:', query);
    console.log('Query parameters:', params);

    const result = await pool.query(query, params || []);
    
    console.log(`Query returned ${result.rows.length} rows`);
    res.json(result.rows);
  } catch (error) {
    console.error('Error executing generic query:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ 
      error: 'Failed to execute query', 
      details: errorMessage 
    });
  }
});

export default router;
