import { Employee, EmployeeConstraints, ReligiousLevel, ConstraintType, CustomConstraint, ConstraintSeverity } from '@/types/employee';
import { Table, Seat } from '@/types/tables';
import { updateSeat } from '@/lib/api/seats';

// Define additional types needed for the algorithm
type LocationPreference = 'window' | 'center' | 'any';
type NoisePreference = 'quiet' | 'moderate' | 'loud' | 'any';

export interface AllocationResult {
  employeeId: string;
  seatId: string;
  tableId?: string; 
  score: number;
}

export interface AllocationConstraints {
  respectGender: boolean;
  respectHealth: boolean;
}

interface EmployeePreference {
  preferredTeammates: string[];
  preferredLocation: LocationPreference;
  noisePreference: NoisePreference;
}

function getEmployeePreferences(employee: Employee): EmployeePreference {
  return {
    preferredTeammates: employee.preferred_colleagues || [],
    preferredLocation: employee.preferred_location || 'any',
    noisePreference: employee.noise_preference || 'any'
  };
}

function calculateLocationScore(seat: Seat, preference: LocationPreference): number {
  if (preference === 'any') return 10;
  if (seat.location && preference === seat.location) return 20;
  return 5;
}

function validateEmployeeExists(employeeId: string, employees: Employee[]): boolean {
  if (!employeeId) {
    console.error('Invalid employeeId: empty or undefined');
    return false;
  }
  
  const exists = employees.some(emp => emp.id === employeeId);
  if (!exists) {
    console.error(`Employee with ID ${employeeId} not found in list of ${employees.length} employees`);
    console.log('Available employee IDs:', employees.map(e => e.id).join(', '));
  }
  return exists;
}

function canSitTogether(employee1: Employee, employee2: Employee, constraints: AllocationConstraints): boolean {
  if (constraints.respectGender && employee1.gender && employee2.gender) {
    if (employee1.gender !== employee2.gender) {
      return false;
    }
  }
  
  const defaultConstraints: EmployeeConstraints = {
    religious: false,
    healthConstraints: false
  };
  
  const employee1Constraints: EmployeeConstraints = employee1.constraints || defaultConstraints;
  const employee2Constraints: EmployeeConstraints = employee2.constraints || defaultConstraints;
  
  const cannotSitWith1 = employee1Constraints.cannotSitWith || [];
  const cannotSitWith2 = employee2Constraints.cannotSitWith || [];
  
  if (cannotSitWith1.includes(employee2.id) || cannotSitWith2.includes(employee1.id)) {
    return false;
  }
  
  return true;
}

function calculateHealthScore(employee: Employee, seat: Seat): number {
  let score = 10; 
  
  if (!employee.has_health_constraints) return score;
  
  if (seat.is_accessible) score += 15;
  
  if (employee.preferred_location === 'window' && seat.location === 'window') {
    score += 10;
  }
  
  return score;
}

function calculateNoiseScore(table: Table, preference: NoisePreference): number {
  if (preference === 'any') return 10;
  if (table.noise_level && preference === table.noise_level) return 20;
  
  if (preference === 'quiet' && table.noise_level === 'loud') {
    return -5;
  }
  
  if (preference === 'loud' && table.noise_level === 'quiet') {
    return 0;
  }
  
  return 5; 
}

function calculateTeamProximityScore(
  employee: Employee,
  table: Table,
  currentAllocations: AllocationResult[],
  employees: Employee[],
  tables: Table[]
): number {
  const preferences = getEmployeePreferences(employee);
  let score = 0;

  for (const teammateId of preferences.preferredTeammates) {
    const teammateAllocation = currentAllocations.find(a => a.employeeId === teammateId);
    if (teammateAllocation) {
      if (teammateAllocation.tableId === table.id) {
        score += 40; 
      } else {
        const teammateTable = tables.find(t => t.id === teammateAllocation.tableId);
        if (teammateTable) {
          if (teammateTable.location === table.location) {
            score += 25; 
          } else {
            score += 10; 
          }
        }
      }
    }
  }

  const teamMembersAtTable = currentAllocations.filter(a => {
    const allocatedEmployee = employees.find(e => e.id === a.employeeId);
    return a.tableId === table.id && allocatedEmployee?.team === employee.team;
  }).length;

  if (teamMembersAtTable > 0) {
    score += 15 * Math.min(teamMembersAtTable, 3); 
  }

  return score;
}

function calculateReligiousScore(
  employee: Employee,
  table: Table,
  currentAllocations: AllocationResult[],
  employees: Employee[]
): number {
  let score = 0;

  if (employee.religious_level === 'religious') {
    if (table.religious_only) {
      score += 40;
    } else {
      const tableAllocations = currentAllocations.filter(a => a.tableId === table.id);
      const religiousCount = tableAllocations.reduce((count, allocation) => {
        const allocatedEmployee = employees.find(e => e.id === allocation.employeeId);
        if (allocatedEmployee?.religious_level === 'religious') {
          return count + 1;
        }
        return count;
      }, 0);

      if (religiousCount > 0) {
        score += 30;
      }
    }
  }

  return score;
}

function calculateSeatScore(
  employee: Employee,
  table: Table,
  seat: Seat,
  currentAllocations: AllocationResult[],
  constraints: AllocationConstraints,
  employees: Employee[],
  tables: Table[],
  seats: Seat[]
): number {
  let score = 100; 
  
  const tableOccupancy = currentAllocations.filter(a => a.tableId === table.id).length;
  if (tableOccupancy >= table.capacity) {
    return 0; 
  }

  if (constraints.respectGender && table.gender_restriction !== 'none') {
    const tableAllocations = currentAllocations.filter(a => a.tableId === table.id);
    const tableEmployees = tableAllocations
      .map(a => employees.find(e => e.id === a.employeeId))
      .filter((e): e is Employee => e !== undefined);

    if (tableEmployees.length > 0) {
      const sameGenderCount = tableEmployees.filter(e => e.gender === employee.gender).length;
      if (sameGenderCount !== tableEmployees.length) {
        score -= 50; 
      }
    }
  }

  if (constraints.respectHealth) {
    if (employee.has_health_constraints && !seat.is_accessible) {
      score -= 30; 
    }
  }

  const teamProximityScore = calculateTeamProximityScore(employee, table, currentAllocations, employees, tables);
  score += teamProximityScore;

  const noiseScore = calculateNoiseScore(table, getEmployeePreferences(employee).noisePreference);
  score += noiseScore;

  const locationScore = calculateLocationScore(seat, getEmployeePreferences(employee).preferredLocation);
  score += locationScore;

  const healthScore = calculateHealthScore(employee, seat);
  score += healthScore;

  const customConstraintsScore = calculateCustomConstraintsScore(employee, seat, table, currentAllocations, employees, seats);
  score += customConstraintsScore;

  return score;
}

function calculateCustomConstraintsScore(
  employee: Employee,
  seat: Seat,
  table: Table,
  currentAllocations: AllocationResult[],
  employees: Employee[],
  seats: Seat[]
): number {
  let score = 0;
  const customConstraints = employee.constraints?.customConstraints;
  
  if (!customConstraints || customConstraints.length === 0) {
    return score; // אין אילוצים מותאמים אישית
  }
  
  for (const constraint of customConstraints) {
    switch (constraint.type) {
      case ConstraintType.WINDOW_PROXIMITY:
        // אם לעובד יש אילוץ של קלסטרופוביה ודרוש מיקום ליד חלון
        if (seat.location === 'window') {
          score += constraint.severity === 'must' ? 100 : 30;
        } else if (constraint.severity === 'must') {
          score -= 150; // עונש חמור לאי עמידה באילוץ מסוג 'חובה'
        }
        break;
        
      case ConstraintType.FIXED_SEAT:
        // למשל בני שירות שצריכים תמיד את אותו מקום
        const previousSeatId = constraint.parameters.previousSeatId;
        if (previousSeatId && previousSeatId === seat.id) {
          score += constraint.severity === 'must' ? 100 : 30;
        } else if (constraint.severity === 'must') {
          score -= 100;
        }
        break;
        
      case ConstraintType.TEAM_PROXIMITY:
        // חברי צוות שחייבים לשבת קרוב אחד לשני
        const teamMembers = constraint.parameters.teamMemberIds || [];
        const teamMembersAtTable = currentAllocations.filter(a => 
          a.tableId === table.id && teamMembers.includes(a.employeeId)
        ).length;
        
        score += teamMembersAtTable * (constraint.severity === 'must' ? 40 : 20);
        break;
        
      case ConstraintType.AWAY_FROM_AC:
        // עובדים שצריכים להיות רחוקים ממזגן
        const isNearAC = seat.location === 'center' && constraint.parameters.shouldBeAway === true;
        if (isNearAC) {
          score -= constraint.severity === 'must' ? 80 : 20;
        } else {
          score += constraint.severity === 'must' ? 40 : 10;
        }
        break;
        
      case ConstraintType.ACCESSIBILITY:
        // צרכי נגישות מיוחדים (מעבר לאילוץ הבריאותי הרגיל)
        const needsAccessibility = constraint.parameters.needsAccessibility === true;
        if (needsAccessibility && seat.is_accessible) {
          score += constraint.severity === 'must' ? 150 : 50;
        } else if (needsAccessibility && !seat.is_accessible && constraint.severity === 'must') {
          score -= 200; // עונש חמור במיוחד על הפרת אילוצי נגישות קריטיים
        }
        break;

      case ConstraintType.SCHEDULE_BASED:
        // אילוצים מבוססי לוח זמנים
        const workDays = constraint.parameters.workDays || [];
        const needsFixedLocation = constraint.parameters.needsFixedLocation === true;
        
        if (workDays.length > 3 && needsFixedLocation) {
          // אם העובד נוכח רוב השבוע ודורש מיקום קבוע
          // בדיקה אם יש לנו קבועים היסטוריים
          const historicalAllocations = constraint.parameters.historicalAllocations || [];
          if (historicalAllocations.includes(seat.id)) {
            score += constraint.severity === 'must' ? 80 : 30;
          }
        }
        break;
        
      case ConstraintType.EQUIPMENT_NEEDS:
        // צרכי ציוד מיוחדים
        const neededEquipment = constraint.parameters.neededEquipment || [];
        const seatHasEquipment = constraint.parameters.seatsWithEquipment || [];
        
        if (neededEquipment.length > 0 && seatHasEquipment.includes(seat.id)) {
          score += constraint.severity === 'must' ? 120 : 40;
        } else if (neededEquipment.length > 0 && !seatHasEquipment.includes(seat.id) && constraint.severity === 'must') {
          score -= 100;
        }
        break;
        
      case ConstraintType.CUSTOM:
      default:
        // אילוצים מותאמים אישית אחרים
        // כאן אפשר להוסיף לוגיקה מותאמת אישית נוספת
        console.log(`Processing custom constraint: ${constraint.description}`);
        break;
    }
  }
  
  return score;
}

export function allocateSeats(
  employees: Employee[],
  tables: Table[],
  seats: Seat[],
  constraints: AllocationConstraints
): AllocationResult[] {
  console.log('Starting seat allocation process...');
  console.log(`Allocating seats for ${employees.length} employees across ${tables.length} tables with ${seats.length} total seats`);
  console.log('Constraints:', JSON.stringify(constraints));
  
  // Sort employees by priority - those with health constraints first, then religious, then by team
  employees.sort((a, b) => {
    if (a.has_health_constraints && !b.has_health_constraints) return -1;
    if (!a.has_health_constraints && b.has_health_constraints) return 1;
    
    if (a.religious_level === 'religious' && b.religious_level !== 'religious') return -1;
    if (a.religious_level !== 'religious' && b.religious_level === 'religious') return 1;
    
    const aPrefs = getEmployeePreferences(a);
    const bPrefs = getEmployeePreferences(b);
    
    if (aPrefs.preferredTeammates.length > bPrefs.preferredTeammates.length) return -1;
    if (aPrefs.preferredTeammates.length < bPrefs.preferredTeammates.length) return 1;
    
    return 0;
  });
  
  console.log('Employees sorted by priority (health constraints, religious, team preferences)');
  
  // Get available seats
  const availableSeats = seats.filter(seat => !seat.occupied_by);
  console.log(`${availableSeats.length} available seats found`);
  
  if (availableSeats.length < employees.length) {
    console.warn(`Warning: Not enough seats (${availableSeats.length}) for all employees (${employees.length})`);
  }
  
  let allocations: AllocationResult[] = [];
  
  for (const employee of employees) {
    console.log(`Processing employee: ${employee.first_name} ${employee.last_name} (ID: ${employee.id})`);
    console.log(`  Health constraints: ${employee.has_health_constraints ? 'Yes' : 'No'}, Religious: ${employee.religious_level || 'Not specified'}`);
    
    let bestScore = -1;
    let bestSeat: Seat | null = null;
    let bestTable: Table | null = null;
    
    for (const seat of availableSeats) {
      const table = tables.find(t => t.id === seat.table_id);
      if (!table) continue;
      
      const score = calculateSeatScore(
        employee,
        table,
        seat,
        allocations,
        constraints,
        employees,
        tables,
        seats
      );
      
      if (score > bestScore) {
        bestScore = score;
        bestSeat = seat;
        bestTable = table;
      }
    }
    
    if (bestSeat && bestTable) {
      console.log(`  Allocated to table: ${bestTable.name} (ID: ${bestTable.id}), seat position: ${bestSeat.position}, score: ${bestScore}`);
      
      // Remove allocated seat from available seats
      const seatIndex = availableSeats.findIndex(s => s.id === bestSeat!.id);
      if (seatIndex !== -1) {
        availableSeats.splice(seatIndex, 1);
      }
      
      allocations.push({
        employeeId: employee.id,
        seatId: bestSeat.id,
        tableId: bestTable.id,
        score: bestScore
      });
    } else {
      console.warn(`  Could not find suitable seat for employee: ${employee.first_name} ${employee.last_name} (ID: ${employee.id})`);
    }
  }
  
  console.log('Initial allocation complete. Running optimization...');
  
  // Optimize the allocations to maximize overall happiness
  allocations = optimizeAllocations(
    allocations,
    employees,
    tables,
    seats,
    constraints,
    availableSeats
  );
  
  console.log(`Final allocation complete. ${allocations.length} employees allocated.`);
  allocations.forEach((allocation, index) => {
    const employee = employees.find(e => e.id === allocation.employeeId);
    const seat = seats.find(s => s.id === allocation.seatId);
    const table = tables.find(t => t.id === allocation.tableId);
    console.log(`${index + 1}. ${employee?.first_name} ${employee?.last_name} → Table: ${table?.name}, Seat: ${seat?.position}, Score: ${allocation.score}`);
  });
  
  return allocations;
}

function optimizeAllocations(
  initialAllocations: AllocationResult[],
  employees: Employee[],
  tables: Table[],
  seats: Seat[],
  constraints: AllocationConstraints,
  availableSeats: Seat[]
): AllocationResult[] {
  console.log('Starting optimization process...');
  
  // Make a copy to work with
  let currentAllocations = [...initialAllocations];
  let currentScore = calculateTotalScore(currentAllocations, employees, tables, seats, constraints);
  console.log(`Initial total score: ${currentScore}`);
  
  // Number of iterations for optimization
  const MAX_ITERATIONS = 10;
  const MAX_ATTEMPTS = 5;
  
  // Track improvements
  let improved = true;
  let iteration = 0;
  
  while (improved && iteration < MAX_ITERATIONS) {
    improved = false;
    iteration++;
    console.log(`Optimization iteration ${iteration}...`);
    
    // Try to swap pairs of employees to improve score
    for (let i = 0; i < currentAllocations.length; i++) {
      const alloc1 = currentAllocations[i];
      const emp1 = employees.find(e => e.id === alloc1.employeeId);
      if (!emp1) continue;
      
      // Try swapping with other allocated employees
      for (let j = i + 1; j < currentAllocations.length; j++) {
        const alloc2 = currentAllocations[j];
        const emp2 = employees.find(e => e.id === alloc2.employeeId);
        if (!emp2) continue;
        
        // Check if swapping would violate constraints
        const seat2 = seats.find(s => s.id === alloc2.seatId);
        const table2 = tables.find(t => t.id === alloc2.tableId);
        
        if (!seat2 || !table2) continue;
        
        // Validate the swaps
        const valid1 = validateSeating(emp1, table2, seat2, currentAllocations, constraints, employees);
        const valid2 = validateSeating(emp2, table2, seat2, currentAllocations, constraints, employees);
        
        if (!valid1 || !valid2) continue;
        
        // Calculate scores
        const originalScore1 = alloc1.score;
        const newScore1 = calculateSeatScore(emp1, table2, seat2, currentAllocations, constraints, employees, tables, seats);
        
        // Get seat1 and table1 information from alloc1
        const seat1 = seats.find(s => s.id === alloc1.seatId);
        const table1 = tables.find(t => t.id === alloc1.tableId);
        
        if (!seat1 || !table1) continue;
        
        const newScore2 = calculateSeatScore(emp2, table1, seat1, currentAllocations, constraints, employees, tables, seats);
        
        const originalTotal = originalScore1 + alloc2.score;
        const newTotal = newScore1 + newScore2;
        
        // If score improves, do the swap
        if (newTotal > originalTotal) {
          console.log(`  Swapping ${emp1.first_name} ${emp1.last_name} and ${emp2.first_name} ${emp2.last_name}`);
          console.log(`  Score improvement: ${originalTotal} → ${newTotal} (+${newTotal - originalTotal})`);
          
          // Perform the swap
          const newAlloc1 = {...alloc1, seatId: alloc2.seatId, tableId: alloc2.tableId, score: newScore1};
          const newAlloc2 = {...alloc2, seatId: alloc1.seatId, tableId: alloc1.tableId, score: newScore2};
          
          currentAllocations[i] = newAlloc1;
          currentAllocations[j] = newAlloc2;
          
          improved = true;
          break; // Break inner loop, we'll continue from next i
        }
      }
      
      // Try unallocated employees with available seats
      if (!improved && availableSeats.length > 0) {
        // Find unallocated employees
        const unallocatedEmps = employees.filter(e => !currentAllocations.some(a => a.employeeId === e.id));
        
        for (const emp2 of unallocatedEmps) {
          for (const seat2 of availableSeats) {
            const table2 = tables.find(t => t.id === seat2.table_id);
            if (!table2) continue;
            
            const valid2 = validateSeating(emp2, table2, seat2, currentAllocations, constraints, employees);
            const valid1 = validateSeating(emp1, table2, seat2, currentAllocations, constraints, employees);
            
            if (!valid1 || !valid2) continue;
            
            // Calculate scores
            const originalScore1 = alloc1.score;
            const newScore1 = calculateSeatScore(emp1, table2, seat2, currentAllocations, constraints, employees, tables, seats);
            
            // Get seat1 and table1 information from alloc1
            const seat1 = seats.find(s => s.id === alloc1.seatId);
            const table1 = tables.find(t => t.id === alloc1.tableId);
            
            if (!seat1 || !table1) continue;
            
            const newScore2 = calculateSeatScore(emp2, table1, seat1, currentAllocations, constraints, employees, tables, seats);
            
            if (newScore1 > originalScore1 || newScore2 > 0) {
              console.log(`  Allocating ${emp1.first_name} ${emp1.last_name} to new seat and adding ${emp2.first_name} ${emp2.last_name}`);
              
              // Update allocation
              const newAlloc1 = {...alloc1, seatId: seat2.id, tableId: table2.id, score: newScore1};
              const newAlloc2 = {employeeId: emp2.id, seatId: alloc1.seatId, tableId: alloc1.tableId, score: newScore2};
              
              currentAllocations[i] = newAlloc1;
              currentAllocations.push(newAlloc2);
              
              // Remove seat from available seats
              const seatIndex = availableSeats.findIndex(s => s.id === seat2.id);
              if (seatIndex !== -1) {
                availableSeats.splice(seatIndex, 1);
              }
              
              improved = true;
              break;
            }
          }
          if (improved) break;
        }
      }
    }
    
    const newTotalScore = calculateTotalScore(currentAllocations, employees, tables, seats, constraints);
    console.log(`  Current total score after iteration ${iteration}: ${newTotalScore}`);
    
    if (newTotalScore <= currentScore) {
      improved = false;
    } else {
      currentScore = newTotalScore;
    }
  }
  
  console.log(`Optimization completed after ${iteration} iterations`);
  console.log(`Final total score: ${currentScore} (${((currentScore / initialAllocations.length) || 0).toFixed(2)} per employee)`);
  
  return currentAllocations;
}

// Helper function to calculate total score
function calculateTotalScore(
  allocations: AllocationResult[],
  employees: Employee[],
  tables: Table[],
  seats: Seat[],
  constraints: AllocationConstraints
): number {
  return allocations.reduce((total, allocation) => {
    return total + allocation.score;
  }, 0);
}

// Helper function to validate if an employee can sit at a specific seat
function validateSeating(
  employee: Employee,
  table: Table,
  seat: Seat,
  currentAllocations: AllocationResult[],
  constraints: AllocationConstraints,
  employees: Employee[]
): boolean {
  // Health constraints
  if (constraints.respectHealth && employee.has_health_constraints && !seat.is_accessible) {
    return false;
  }
  
  // Religious constraints
  if (constraints.respectHealth && table.religious_only && employee.religious_level !== 'religious') {
    return false;
  }
  
  // Gender constraints
  if (constraints.respectGender && table.gender_restriction !== 'none') {
    const tableAllocations = currentAllocations.filter(a => a.tableId === table.id);
    const tableEmployees = tableAllocations
      .map(a => employees.find(e => e.id === a.employeeId))
      .filter((e): e is Employee => e !== undefined);
    
    if (tableEmployees.length > 0) {
      // Check if everyone at the table is the same gender
      const sameGenderCount = tableEmployees.filter(e => e.gender === employee.gender).length;
      if (sameGenderCount !== tableEmployees.length) {
        return false;
      }
    }
  }
  
  // Check 'cannot sit with' constraints
  const employeeConstraints = employee.constraints || {cannotSitWith: []};
  const cannotSitWith = employeeConstraints.cannotSitWith || [];
  
  const tableAllocations = currentAllocations.filter(a => a.tableId === table.id);
  const tableEmployeeIds = tableAllocations.map(a => a.employeeId);
  
  for (const id of cannotSitWith) {
    if (tableEmployeeIds.includes(id)) {
      return false;
    }
  }
  
  return true;
}

export function applyAllocations(allocations: AllocationResult[]): Promise<AllocationResult[]> {
  console.log(`Starting to apply ${allocations.length} allocations to database...`);
  return new Promise(async (resolve, reject) => {
    try {
      const results: AllocationResult[] = [];
      const errors: { allocation: AllocationResult; error: any }[] = [];
      
      // Group allocations by table for better log readability
      const allocationsByTable: Record<string, AllocationResult[]> = {};
      
      for (const allocation of allocations) {
        if (!allocation.tableId) {
          console.error(`Skipping allocation for employee ${allocation.employeeId} - missing tableId`);
          continue;
        }
        
        if (!allocationsByTable[allocation.tableId]) {
          allocationsByTable[allocation.tableId] = [];
        }
        allocationsByTable[allocation.tableId].push(allocation);
      }
      
      // Process allocations by table
      for (const tableId of Object.keys(allocationsByTable)) {
        const tableAllocations = allocationsByTable[tableId];
        console.log(`Applying ${tableAllocations.length} allocations to table ${tableId}...`);
        
        // Process allocations sequentially to avoid race conditions
        for (const allocation of tableAllocations) {
          try {
            if (!allocation.seatId || !allocation.employeeId) {
              console.error(`Invalid allocation data: ${JSON.stringify(allocation)}`);
              errors.push({ allocation, error: 'Invalid allocation data' });
              continue;
            }
            
            // Update seat in database
            const updated = await updateSeat(allocation.seatId, { 
              status: 'occupied',
              occupied_by: allocation.employeeId 
            });
            
            if (updated) {
              results.push(allocation);
            } else {
              console.error(`Failed to update seat ${allocation.seatId} - API returned empty response`);
              errors.push({ allocation, error: 'API returned empty response' });
            }
          } catch (error) {
            console.error(`Error updating seat ${allocation.seatId}:`, error);
            errors.push({ allocation, error });
          }
        }
      }
      
      // Log summary of results
      console.log(`Completed applying ${results.length} of ${allocations.length} allocations`);
      if (errors.length > 0) {
        console.error(`Encountered ${errors.length} errors during allocation`);
      }
      
      resolve(results);
    } catch (error) {
      console.error('Error applying allocations:', error);
      reject(error);
    }
  });
}

export function validateAllocation(
  allocation: AllocationResult,
  employees: Employee[],
  tables: Table[],
  seats: Seat[],
  constraints: AllocationConstraints
): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  
  // Enhanced validation with detailed logging
  console.log(`Validating allocation: Employee ${allocation.employeeId} to Seat ${allocation.seatId} at Table ${allocation.tableId}`);
  
  // Check if we have valid data arrays
  if (!employees || !employees.length) {
    console.error('Employee data is missing or empty');
    issues.push('Missing employee data');
    return { valid: false, issues };
  }
  
  if (!tables || !tables.length) {
    console.error('Table data is missing or empty');
    issues.push('Missing table data');
    return { valid: false, issues };
  }
  
  if (!seats || !seats.length) {
    console.error('Seat data is missing or empty');
    issues.push('Missing seat data');
    return { valid: false, issues };
  }
  
  const employee = employees.find(e => e.id === allocation.employeeId);
  const table = tables.find(t => t.id === allocation.tableId);
  const seat = seats.find(s => s.id === allocation.seatId);
  
  // Check if employee exists
  if (!employee) {
    console.error(`Employee with ID ${allocation.employeeId} not found`);
    console.log('Available employee IDs:', employees.map(e => `${e.id} (${e.first_name} ${e.last_name})`).join(', '));
    issues.push('Employee not found');
    return { valid: false, issues };
  }
  
  // Check if table exists
  if (!table) {
    console.error(`Table with ID ${allocation.tableId} not found`);
    console.log('Available table IDs:', tables.map(t => `${t.id} (${t.name})`).join(', '));
    issues.push('Table not found');
    return { valid: false, issues };
  }
  
  // Check if seat exists
  if (!seat) {
    console.error(`Seat with ID ${allocation.seatId} not found`);
    issues.push('Seat not found');
    return { valid: false, issues };
  }
  
  // Additional validation checks
  if (seat.status === 'occupied' && seat.occupied_by && seat.occupied_by !== allocation.employeeId) {
    issues.push(`Seat already occupied by another employee: ${seat.occupied_by}`);
  }
  
  // Validate constraints based on other validation rules
  const isValid = issues.length === 0 && validateSeating(employee, table, seat, [], constraints, employees);
  
  if (!isValid && issues.length === 0) {
    issues.push('Failed constraint validation');
  }
  
  // Log validation result
  if (isValid) {
    console.log(`Validation successful for employee ${employee.first_name} ${employee.last_name} to seat ${seat.position} at table ${table.name}`);
  } else {
    console.error(`Validation failed for allocation:`, issues);
  }
  
  return { valid: isValid, issues };
}
