import { query } from '../../database';

export class SeatingAllocationService {
  static async findCompatibleWorkspaces(employeeId: string) {
    const result = await query(`
      SELECT 
        w.id as workspace_id,
        CASE 
          WHEN e.gender = 'M' THEN 1
          WHEN e.gender = 'F' THEN 1
          ELSE 0.5
        END * 
        CASE 
          WHEN e.religious_restrictions = true THEN 1
          ELSE 0.5
        END * 
        CASE 
          WHEN e.health_restrictions = true THEN 1
          ELSE 0.5
        END as compatibility_score
      FROM workspaces w
      CROSS JOIN employees e
      WHERE e.id = $1
      ORDER BY compatibility_score DESC
    `, [employeeId]);
    
    return result.rows;
  }

  static async validateAllocation(employeeId: string, workspaceId: string) {
    // Get employee and workspace details
    const employeeResult = await query('SELECT * FROM employees WHERE id = $1', [employeeId]);
    const workspaceResult = await query('SELECT * FROM workspaces WHERE id = $1', [workspaceId]);
    
    if (employeeResult.rows.length === 0 || workspaceResult.rows.length === 0) {
      throw new Error('Employee or workspace not found');
    }

    const employee = employeeResult.rows[0];
    const workspace = workspaceResult.rows[0];

    // Initialize constraints validation
    const constraints = {
      gender: true,
      religious: true,
      health: true,
      schedule: true
    };

    // Check gender constraints if applicable
    if (workspace.gender_restriction && workspace.gender_restriction !== employee.gender) {
      constraints.gender = false;
    }

    // Check religious constraints
    if (employee.religious_restrictions && workspace.religious_incompatible) {
      constraints.religious = false;
    }

    // Check health constraints
    if (employee.health_restrictions && workspace.health_hazards) {
      constraints.health = false;
    }

    // Check schedule constraints
    const scheduleResult = await query(`
      SELECT COUNT(*) as overlap_count
      FROM allocations a
      WHERE a.workspace_id = $1
        AND a.end_date >= CURRENT_DATE
        AND (
          (a.start_date BETWEEN $2 AND $3)
          OR (a.end_date BETWEEN $2 AND $3)
          OR ($2 BETWEEN a.start_date AND a.end_date)
        )
    `, [workspaceId, employee.start_date, employee.end_date]);

    constraints.schedule = scheduleResult.rows[0].overlap_count === 0;

    return {
      isValid: Object.values(constraints).every(v => v),
      constraints
    };
  }
}
