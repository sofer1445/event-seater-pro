import { query } from '../../database';
import { SeatingAllocationService } from '../services/seatingAllocationService';
import { EnhancedSeatingAllocationService } from '../services/enhancedSeatingAllocation';

export async function getAllocations(): Promise<any[]> {
  const result = await query(`
    SELECT a.*, e.first_name, e.last_name, w.name as workspace_name 
    FROM allocations a 
    JOIN employees e ON a.employee_id = e.id 
    JOIN workspaces w ON a.workspace_id = w.id 
    ORDER BY a.created_at DESC
  `);
  return result.rows;
}

export async function getAllocation(id: string): Promise<any> {
  const result = await query(`
    SELECT a.*, e.first_name, e.last_name, w.name as workspace_name 
    FROM allocations a 
    JOIN employees e ON a.employee_id = e.id 
    JOIN workspaces w ON a.workspace_id = w.id 
    WHERE a.id = $1
  `, [id]);
  return result.rows[0];
}

export async function createAllocation(allocation: any): Promise<any> {
  const { employee_id, workspace_id, start_date, end_date } = allocation;
  const result = await query(
    'INSERT INTO allocations (employee_id, workspace_id, start_date, end_date, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [employee_id, workspace_id, start_date, end_date, 'active']
  );
  return result.rows[0];
}

export async function updateAllocation(
  id: string,
  allocation: any
): Promise<any> {
  const { employee_id, workspace_id, start_date, end_date, status } = allocation;
  const result = await query(
    'UPDATE allocations SET employee_id = $1, workspace_id = $2, start_date = $3, end_date = $4, status = $5 WHERE id = $6 RETURNING *',
    [employee_id, workspace_id, start_date, end_date, status, id]
  );
  return result.rows[0];
}

export async function cancelAllocation(id: string): Promise<any> {
  const result = await query('SELECT * FROM cancel_allocation($1)', [id]);
  return result.rows[0];
}

export async function getAllocationHistory(allocationId: string): Promise<any[]> {
  const result = await query('SELECT * FROM allocation_history WHERE allocation_id = $1 ORDER BY created_at DESC', [allocationId]);
  return result.rows;
}

export async function findCompatibleWorkspaces(
  employeeId: string
): Promise<{ workspace_id: string; compatibility_score: number }[]> {
  const result = await SeatingAllocationService.findCompatibleWorkspaces(employeeId);
  
  // Convert the result to the expected format
  return result.map((row: any) => ({
    workspace_id: row.workspace_id,
    compatibility_score: row.compatibility_score
  }));
}

export async function autoAllocateSeats(): Promise<any[]> {
  // For now, return an empty array as the allocateSeats method is not implemented
  // We'll use our enhanced allocation service instead
  console.log('Using enhanced allocation service instead of autoAllocateSeats');
  return [];
}

export async function validateAllocation(
  employeeId: string,
  workspaceId: string
): Promise<{ 
  isValid: boolean; 
  constraints: { 
    gender: boolean; 
    religious: boolean; 
    health: boolean; 
    schedule: boolean; 
  }; 
}> {
  try {
    // Use our enhanced service first if it exists
    const result = await EnhancedSeatingAllocationService.validateEmployeeConstraints(
      employeeId,
      workspaceId
    );
    
    // Convert the new constraints format to the old format
    const constraints = {
      gender: !result.issues.some(i => i.type === 'gender'),
      religious: !result.issues.some(i => i.type === 'religious'),
      health: !result.issues.some(i => i.type === 'accessibility' || i.type === 'health'),
      schedule: !result.issues.some(i => i.type === 'schedule_based')
    };
    
    return {
      isValid: result.satisfied,
      constraints
    };
  } catch (error) {
    console.error('Error validating allocation:', error);
    return {
      isValid: false,
      constraints: {
        gender: false,
        religious: false,
        health: false,
        schedule: false
      }
    };
  }
}
