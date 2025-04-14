import { query } from '@/lib/api/db';
import { SeatingAllocationService } from '@/lib/services/seatingAllocationService';

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
  const employeeResult = await query('SELECT * FROM employees WHERE id = $1', [employeeId]);
  
  if (employeeResult.rows.length === 0) {
    console.error('Employee not found:', employeeId);
    return [];
  }

  const employee = employeeResult.rows[0];

  const workspacesResult = await query('SELECT * FROM workspaces');
  const workspaces = workspacesResult.rows;

  const roomsResult = await query('SELECT * FROM rooms');
  const rooms = roomsResult.rows;

  const existingAllocationsResult = await query('SELECT * FROM allocations WHERE status IN ($1, $2)', ['active', 'pending']);
  const existingAllocations = existingAllocationsResult.rows;

  const employeesResult = await query('SELECT * FROM employees');
  const employees = employeesResult.rows;

  const compatibleWorkspaces = SeatingAllocationService.findCompatibleWorkspaces(
    employee,
    workspaces,
    rooms,
    existingAllocations || [],
    employees
  );

  return compatibleWorkspaces.map(({ workspace, score }) => ({
    workspace_id: workspace.id,
    compatibility_score: score
  }));
}

export async function autoAllocateSeats(): Promise<any[]> {
  const employeesResult = await query('SELECT * FROM employees WHERE status = $1', ['active']);
  const employees = employeesResult.rows;

  const workspacesResult = await query('SELECT * FROM workspaces WHERE status = $1', ['available']);
  const workspaces = workspacesResult.rows;

  const roomsResult = await query('SELECT * FROM rooms');
  const rooms = roomsResult.rows;

  const existingAllocationsResult = await query('SELECT * FROM allocations WHERE status IN ($1, $2)', ['active', 'pending']);
  const existingAllocations = existingAllocationsResult.rows;

  const newAllocations = await SeatingAllocationService.allocateSeats(
    employees,
    workspaces,
    rooms,
    existingAllocations
  );

  // שמירת ההקצאות החדשות במסד הנתונים
  for (const allocation of newAllocations) {
    await query(
      'INSERT INTO allocations (id, employee_id, workspace_id, status, start_date, compatibility_score) VALUES ($1, $2, $3, $4, $5, $6)',
      [
        allocation.id,
        allocation.employee_id,
        allocation.workspace_id,
        allocation.status,
        allocation.start_date,
        allocation.compatibility_score || 0
      ]
    );
  }

  return newAllocations;
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
    const employeeResult = await query('SELECT * FROM employees WHERE id = $1', [employeeId]);
    if (employeeResult.rows.length === 0) {
      console.error('Employee not found:', employeeId);
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
    const employee = employeeResult.rows[0];

    const workspaceResult = await query('SELECT * FROM workspaces WHERE id = $1', [workspaceId]);
    if (workspaceResult.rows.length === 0) {
      console.error('Workspace not found:', workspaceId);
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
    const workspace = workspaceResult.rows[0];

    const roomResult = await query('SELECT * FROM rooms WHERE id = $1', [workspace.room_id]);
    if (roomResult.rows.length === 0) {
      console.error('Room not found:', workspace.room_id);
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
    const room = roomResult.rows[0];

    const existingAllocationsResult = await query('SELECT * FROM allocations WHERE status IN ($1, $2)', ['active', 'pending']);
    const existingAllocations = existingAllocationsResult.rows;

    // Fetch all employees and workspaces
    const employeesResult = await query('SELECT * FROM employees');
    const employees = employeesResult.rows;

    const workspacesResult = await query('SELECT * FROM workspaces');
    const workspaces = workspacesResult.rows;

    const result = SeatingAllocationService.isWorkspaceCompatible(
      employee,
      workspace,
      room,
      existingAllocations || [],
      employees,
      workspaces
    );

    return {
      isValid: result.compatible,
      constraints: result.constraints
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
