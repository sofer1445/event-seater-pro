import { pool, query } from '../../database';

// Define constraint types
export enum ConstraintSeverity {
  MANDATORY = 'mandatory', // חובה
  PREFERRED = 'preferred', // מועדף
  OPTIONAL = 'optional'   // אופציונלי
}

export enum ConstraintType {
  WINDOW_SEAT = 'window_seat',         // קלסטרופוביה - מקום ליד חלון
  FIXED_LOCATION = 'fixed_location',   // בני שירות - מקום קבוע
  TEAM_PROXIMITY = 'team_proximity',   // קרבה לצוות עבודה
  AWAY_FROM_AC = 'away_from_ac',       // מרחק ממזגנים
  ACCESSIBILITY = 'accessibility',     // נגישות מיוחדת
  SCHEDULE_BASED = 'schedule_based',   // אילוץ תלוי לו"ז
  SPECIAL_EQUIPMENT = 'special_equipment' // ציוד מיוחד
}

export interface CustomConstraint {
  id: string;
  type: ConstraintType;
  severity: ConstraintSeverity;
  description?: string;
  value?: any;
  metadata?: Record<string, any>;
}

export class EnhancedSeatingAllocationService {
  // Check if an employee is already assigned to any seat
  static async isEmployeeAlreadyAssigned(employeeId: string): Promise<boolean> {
    const result = await query(
      'SELECT COUNT(*) as seat_count FROM seats WHERE occupied_by = $1',
      [employeeId]
    );
    
    return parseInt(result.rows[0].seat_count) > 0;
  }
  
  // Free all seats assigned to an employee
  static async freeEmployeeSeats(employeeId: string): Promise<void> {
    await query(
      'UPDATE seats SET occupied_by = NULL, status = \'available\' WHERE occupied_by = $1',
      [employeeId]
    );
  }
  
  // Assign an employee to a seat, with validation
  static async assignEmployeeToSeat(employeeId: string, seatId: string): Promise<{ success: boolean; message: string }> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Check if employee exists
      const employeeResult = await client.query('SELECT * FROM employees WHERE id = $1', [employeeId]);
      if (employeeResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return { success: false, message: 'העובד לא נמצא במערכת' };
      }
      
      // Check if seat exists
      const seatResult = await client.query('SELECT * FROM seats WHERE id = $1', [seatId]);
      if (seatResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return { success: false, message: 'המושב לא נמצא במערכת' };
      }
      
      const seat = seatResult.rows[0];
      
      // Check if seat is already occupied
      if (seat.occupied_by) {
        await client.query('ROLLBACK');
        return { success: false, message: 'המושב כבר תפוס על ידי עובד אחר' };
      }
      
      // Check if employee is already assigned elsewhere
      const existingAssignmentResult = await client.query(
        'SELECT id, table_id FROM seats WHERE occupied_by = $1',
        [employeeId]
      );
      
      // If found assignments, free them first
      if (existingAssignmentResult.rows.length > 0) {
        await client.query(
          'UPDATE seats SET occupied_by = NULL, status = \'available\' WHERE occupied_by = $1',
          [employeeId]
        );
      }
      
      // Now assign the employee to the new seat
      await client.query(
        'UPDATE seats SET occupied_by = $1, status = \'occupied\' WHERE id = $2',
        [employeeId, seatId]
      );
      
      // Check constraints
      const constraintValidation = await this.validateEmployeeConstraints(employeeId, seat.table_id, client);
      
      // If constraints are not satisfied, we should log but still allow assignment
      if (!constraintValidation.satisfied) {
        // Log the constraint issues
        await client.query(
          'INSERT INTO constraint_violations (employee_id, seat_id, constraint_details) VALUES ($1, $2, $3)',
          [employeeId, seatId, JSON.stringify(constraintValidation.issues)]
        );
      }
      
      await client.query('COMMIT');
      
      if (!constraintValidation.satisfied) {
        return { 
          success: true, 
          message: 'העובד הוקצה למושב, אך יש אילוצים שלא מתקיימים: ' + 
                   constraintValidation.issues.map(i => i.description).join(', ')
        };
      }
      
      return { success: true, message: 'העובד הוקצה למושב בהצלחה' };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error assigning employee to seat:', error);
      return { success: false, message: 'שגיאה בהקצאת העובד למושב' };
    } finally {
      client.release();
    }
  }
  
  // Validate if an employee's constraints are satisfied at a table
  static async validateEmployeeConstraints(
    employeeId: string, 
    tableId: string,
    client?: any
  ): Promise<{ satisfied: boolean; issues: Array<{ type: string; description: string; severity: string }> }> {
    const queryExecutor = client || pool;
    const issues: Array<{ type: string; description: string; severity: string }> = [];
    
    try {
      // Get employee with constraints
      const employeeResult = await queryExecutor.query(
        'SELECT *, constraints FROM employees WHERE id = $1',
        [employeeId]
      );
      
      if (employeeResult.rows.length === 0) {
        return { satisfied: false, issues: [{ type: 'not_found', description: 'העובד לא נמצא', severity: 'mandatory' }] };
      }
      
      const employee = employeeResult.rows[0];
      const constraints = employee.constraints || {};
      
      // Get table information
      const tableResult = await queryExecutor.query(
        'SELECT * FROM tables WHERE id = $1',
        [tableId]
      );
      
      if (tableResult.rows.length === 0) {
        return { satisfied: false, issues: [{ type: 'not_found', description: 'השולחן לא נמצא', severity: 'mandatory' }] };
      }
      
      const table = tableResult.rows[0];
      
      // Check religious constraint
      if (employee.is_religious && !table.religious_only) {
        issues.push({
          type: 'religious',
          description: 'העובד דתי אך השולחן אינו מיועד לדתיים בלבד',
          severity: 'mandatory'
        });
      }
      
      // Check health constraints
      if (employee.has_health_constraints) {
        // Check if the seat is accessible
        const accessibleSeatsResult = await queryExecutor.query(
          'SELECT COUNT(*) as count FROM seats WHERE table_id = $1 AND is_accessible = true',
          [tableId]
        );
        
        if (parseInt(accessibleSeatsResult.rows[0].count) === 0) {
          issues.push({
            type: 'accessibility',
            description: 'העובד זקוק לנגישות מיוחדת אך אין מושבים נגישים בשולחן זה',
            severity: 'mandatory'
          });
        }
      }
      
      // Check custom constraints
      if (constraints && typeof constraints === 'object') {
        const customConstraints = Object.values(constraints) as CustomConstraint[];
        
        for (const constraint of customConstraints) {
          switch (constraint.type) {
            case ConstraintType.WINDOW_SEAT:
              if (table.location !== 'window') {
                issues.push({
                  type: 'window_seat',
                  description: 'העובד זקוק למושב ליד חלון',
                  severity: constraint.severity
                });
              }
              break;
              
            case ConstraintType.AWAY_FROM_AC:
              // Example check - would need actual location data
              if (table.location === 'air_conditioner') {
                issues.push({
                  type: 'away_from_ac',
                  description: 'העובד צריך להיות רחוק ממזגן',
                  severity: constraint.severity
                });
              }
              break;
              
            // Add other constraint checks here
          }
        }
      }
      
      // Return the validation result
      // Only MANDATORY constraints cause the overall satisfaction to be false
      const hasMandatoryIssues = issues.some(issue => issue.severity === 'mandatory');
      
      return {
        satisfied: !hasMandatoryIssues,
        issues
      };
      
    } catch (error) {
      console.error('Error validating employee constraints:', error);
      return { 
        satisfied: false, 
        issues: [{ type: 'error', description: 'שגיאה בבדיקת אילוצי העובד', severity: 'mandatory' }] 
      };
    }
  }
  
  // Run a full allocation process
  static async runFullAllocation(): Promise<{
    success: boolean;
    allocatedEmployees: any[];
    unallocatedEmployees: any[];
    constraintViolations: any[];
    problemDetails: {
      unallocatedEmployeesDetails: Array<{
        id: string;
        name: string;
        email: string;
        reason: string;
        constraints: any[];
      }>;
    };
  }> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Reset all seat assignments
      await client.query('UPDATE seats SET occupied_by = NULL, status = \'available\'');
      
      // Get all active employees
      const employeesResult = await client.query('SELECT * FROM employees');
      const employees = employeesResult.rows;
      
      // Get all available seats
      const seatsResult = await client.query('SELECT s.*, t.* FROM seats s JOIN tables t ON s.table_id = t.id WHERE s.status = \'available\'');
      const availableSeats = seatsResult.rows;
      
      const allocatedEmployees: any[] = [];
      const unallocatedEmployees: any[] = [];
      const constraintViolations: any[] = [];
      const unallocatedEmployeesDetails: Array<{
        id: string;
        name: string;
        email: string;
        reason: string; 
        constraints: any[];
      }> = [];
      
      // Score and sort employees by constraint complexity
      const scoredEmployees = employees.map((emp: any) => {
        const constraintCount = emp.constraints ? Object.keys(emp.constraints).length : 0;
        const mandatoryCount = emp.constraints ? 
          Object.values(emp.constraints)
            .filter((c: any) => c.severity === 'mandatory').length : 0;
        
        return {
          employee: emp,
          score: mandatoryCount * 10 + constraintCount,
          hasHealthConstraints: emp.has_health_constraints || false,
          isReligious: emp.is_religious || false
        };
      });
      
      // Sort by score descending - allocate most constrained employees first
      scoredEmployees.sort((a: any, b: any) => b.score - a.score);
      
      // Allocation loop
      for (const { employee } of scoredEmployees) {
        let bestSeat = null;
        let bestScore = -1;
        let bestValidation = null;
        let allValidations: any[] = [];
        
        // Find the best seat for this employee
        for (const seat of availableSeats) {
          if (seat.occupied_by) continue; // Skip already occupied seats
          
          const validation = await this.validateEmployeeConstraints(employee.id, seat.table_id, client);
          allValidations.push({ seat, validation });
          
          // Calculate seat score based on constraint satisfaction
          const mandatoryFailures = validation.issues.filter((i: { type: string; description: string; severity: string }) => i.severity === 'mandatory').length;
          const preferredFailures = validation.issues.filter((i: { type: string; description: string; severity: string }) => i.severity === 'preferred').length;
          const optionalFailures = validation.issues.filter((i: { type: string; description: string; severity: string }) => i.severity === 'optional').length;
          
          // If there are mandatory failures, skip this seat
          if (mandatoryFailures > 0) continue;
          
          // Score: 100 - (preferred failures * 10) - (optional failures)
          const seatScore = 100 - (preferredFailures * 10) - optionalFailures;
          
          if (seatScore > bestScore) {
            bestScore = seatScore;
            bestSeat = seat;
            bestValidation = validation;
          }
        }
        
        if (bestSeat && bestScore > 0) {
          // Assign the employee to the best seat
          await client.query(
            'UPDATE seats SET occupied_by = $1, status = \'occupied\' WHERE id = $2',
            [employee.id, bestSeat.id]
          );
          
          // Mark the seat as occupied in our local array
          const seatIndex = availableSeats.findIndex((s: any) => s.id === bestSeat.id);
          if (seatIndex !== -1) {
            availableSeats[seatIndex].occupied_by = employee.id;
            availableSeats[seatIndex].status = 'occupied';
          }
          
          allocatedEmployees.push({
            employee_id: employee.id,
            employee_name: `${employee.first_name} ${employee.last_name}`,
            seat_id: bestSeat.id,
            table_id: bestSeat.table_id,
            score: bestScore,
            issues: bestValidation ? bestValidation.issues.filter(i => i.severity !== 'mandatory') : []
          });
          
          // Record any non-mandatory constraint violations
          if (bestValidation && bestValidation.issues.length > 0) {
            constraintViolations.push({
              employee_id: employee.id,
              employee_name: `${employee.first_name} ${employee.last_name}`,
              seat_id: bestSeat.id,
              table_id: bestSeat.table_id,
              issues: bestValidation.issues
            });
          }
        } else {
          // Couldn't allocate a seat for this employee - get detailed information about why
          const failureReasons = allValidations.map(({ seat, validation }) => {
            const mandatoryIssues = validation.issues.filter((i: { type: string; description: string; severity: string }) => i.severity === 'mandatory');
            return {
              seat_id: seat.id,
              table_id: seat.table_id,
              issues: mandatoryIssues
            };
          });
          
          // Group the failure reasons to provide a summarized view 
          const issuesByType: Record<string, string[]> = {};
          for (const { issues } of failureReasons) {
            for (const issue of issues) {
              if (!issuesByType[issue.type]) {
                issuesByType[issue.type] = [];
              }
              if (!issuesByType[issue.type].includes(issue.description)) {
                issuesByType[issue.type].push(issue.description);
              }
            }
          }
          
          // Create the failure summary
          const failureSummary = Object.entries(issuesByType)
            .map(([type, descriptions]) => `${type}: ${descriptions.join(', ')}`)
            .join('; ');
          
          // Add to unallocated employees list
          unallocatedEmployees.push({
            employee_id: employee.id,
            employee_name: `${employee.first_name} ${employee.last_name}`,
            reason: 'No suitable seat found that satisfies mandatory constraints',
            detailed_reason: failureSummary || 'Unknown constraints',
            constraint_failures: failureReasons
          });
          
          // Add detailed information to the unallocatedEmployeesDetails array
          unallocatedEmployeesDetails.push({
            id: employee.id,
            name: `${employee.first_name} ${employee.last_name}`,
            email: employee.email,
            reason: failureSummary || 'אין מקום מתאים שעומד באילוצים של העובד',
            constraints: employee.constraints ? Object.values(employee.constraints) : []
          });
        }
      }
      
      await client.query('COMMIT');
      
      return {
        success: true,
        allocatedEmployees,
        unallocatedEmployees,
        constraintViolations,
        problemDetails: {
          unallocatedEmployeesDetails
        }
      };
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error running full allocation:', error);
      return {
        success: false,
        allocatedEmployees: [],
        unallocatedEmployees: [],
        constraintViolations: [],
        problemDetails: {
          unallocatedEmployeesDetails: []
        }
      };
    } finally {
      client.release();
    }
  }
}
