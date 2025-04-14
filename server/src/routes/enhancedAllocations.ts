import express from 'express';
import { EnhancedSeatingAllocationService } from '../lib/services/enhancedSeatingAllocation';
import { pool, query } from '../database';

const router = express.Router();

// Get all allocations (seats with employee assignments)
router.get('/', async (req, res) => {
  try {
    const result = await query(`
      SELECT s.id as seat_id, s.position, s.table_id, s.occupied_by as employee_id,
             t.name as table_name, t.capacity,
             e.first_name, e.last_name, e.email
      FROM seats s
      LEFT JOIN tables t ON s.table_id = t.id
      LEFT JOIN employees e ON s.occupied_by = e.id
      ORDER BY t.name, s.position
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching allocations:', error);
    res.status(500).json({ message: 'שגיאה בטעינת נתוני השיבוץ' });
  }
});

// Get problematic allocations/constraint violations
router.get('/violations', async (req, res) => {
  try {
    const result = await query(`
      SELECT cv.id, cv.employee_id, cv.seat_id, cv.constraint_details,
             e.first_name, e.last_name, e.email,
             s.position, s.table_id,
             t.name as table_name
      FROM constraint_violations cv
      JOIN employees e ON cv.employee_id = e.id
      JOIN seats s ON cv.seat_id = s.id
      JOIN tables t ON s.table_id = t.id
      ORDER BY cv.created_at DESC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching constraint violations:', error);
    res.status(500).json({ message: 'שגיאה בטעינת נתוני הפרות אילוצים' });
  }
});

// Assign an employee to a seat
router.post('/assign', async (req, res) => {
  try {
    const { employeeId, seatId } = req.body;
    
    if (!employeeId || !seatId) {
      return res.status(400).json({ message: 'נדרש מזהה עובד ומזהה מושב' });
    }
    
    const result = await EnhancedSeatingAllocationService.assignEmployeeToSeat(employeeId, seatId);
    
    if (result.success) {
      res.json({ success: true, message: result.message });
    } else {
      res.status(400).json({ success: false, message: result.message });
    }
  } catch (error) {
    console.error('Error assigning employee to seat:', error);
    res.status(500).json({ message: 'שגיאה בהקצאת עובד למושב' });
  }
});

// Free a seat
router.post('/free-seat/:seatId', async (req, res) => {
  try {
    const { seatId } = req.params;
    
    const result = await query(
      'UPDATE seats SET occupied_by = NULL, status = \'available\' WHERE id = $1 RETURNING *',
      [seatId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'המושב לא נמצא' });
    }
    
    res.json({ success: true, message: 'המושב פונה בהצלחה', seat: result.rows[0] });
  } catch (error) {
    console.error('Error freeing seat:', error);
    res.status(500).json({ message: 'שגיאה בפינוי המושב' });
  }
});

// Free all seats assigned to an employee
router.post('/free-employee/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;
    
    await EnhancedSeatingAllocationService.freeEmployeeSeats(employeeId);
    
    res.json({ success: true, message: 'כל המושבים של העובד פונו בהצלחה' });
  } catch (error) {
    console.error('Error freeing employee seats:', error);
    res.status(500).json({ message: 'שגיאה בפינוי מושבי העובד' });
  }
});

// Run a full allocation process
router.post('/run-allocation', async (req, res) => {
  try {
    const result = await EnhancedSeatingAllocationService.runFullAllocation();
    
    res.json({
      success: result.success,
      message: 'תהליך ההקצאה הושלם',
      summary: {
        allocatedEmployees: result.allocatedEmployees.length,
        unallocatedEmployees: result.unallocatedEmployees.length,
        constraintViolations: result.constraintViolations.length
      },
      allocatedEmployees: result.allocatedEmployees,
      unallocatedEmployees: result.unallocatedEmployees,
      constraintViolations: result.constraintViolations
    });
  } catch (error) {
    console.error('Error running allocation process:', error);
    res.status(500).json({ message: 'שגיאה בהרצת תהליך ההקצאה' });
  }
});

// Validate constraints for an employee at a specific table
router.get('/validate-constraints/:employeeId/:tableId', async (req, res) => {
  try {
    const { employeeId, tableId } = req.params;
    
    const result = await EnhancedSeatingAllocationService.validateEmployeeConstraints(employeeId, tableId);
    
    res.json(result);
  } catch (error) {
    console.error('Error validating constraints:', error);
    res.status(500).json({ message: 'שגיאה בבדיקת אילוצים' });
  }
});

// Get unallocated employees
router.get('/unallocated-employees', async (req, res) => {
  try {
    const result = await query(`
      SELECT e.* 
      FROM employees e
      LEFT JOIN seats s ON s.occupied_by = e.id
      WHERE s.id IS NULL
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching unallocated employees:', error);
    res.status(500).json({ message: 'שגיאה בטעינת רשימת עובדים ללא שיבוץ' });
  }
});

export default router;
