import express from 'express';
import { getAllocations, createAllocation } from '../lib/api/allocations';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const allocations = await getAllocations();
    res.json(allocations);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch allocations' });
  }
});

router.post('/', async (req, res) => {
  try {
    const newAllocation = await createAllocation(req.body);
    res.status(201).json(newAllocation);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create allocation' });
  }
});

export default router;
