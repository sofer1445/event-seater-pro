import { Employee, Gender, ReligiousLevel } from '@/types/employee';
import { Workspace, Room } from '@/types/workspace';
import { Allocation } from '@/types/allocation';
import { getEmployees, getWorkspaces, getRooms, getAllocations, createAllocation } from '../api/apiClient';

interface SeatingConstraints {
  gender: boolean;
  religious: boolean;
  health: boolean;
  schedule: boolean;
}

export class SeatingAllocationService {
  /**
   * בדיקה האם מקום ישיבה מתאים לעובד לפי כל האילוצים
   */
  static isWorkspaceCompatible(
    employee: Employee,
    workspace: Workspace,
    room: Room,
    existingAllocations: Allocation[],
    employees: Employee[],
    workspaces: Workspace[]
  ): { compatible: boolean; constraints: SeatingConstraints } {
    console.log('Checking workspace compatibility:', {
      employee: employee.id,
      workspace: workspace.id,
      room: room.id
    });

    const constraints: SeatingConstraints = {
      gender: true,
      religious: true,
      health: true,
      schedule: true,
    };

    // בדיקת אילוצי מגדר
    if (room.gender_restriction) {
      console.log('Checking gender constraints:', {
        employeeGender: employee.gender,
        roomRestriction: room.gender_restriction
      });
      constraints.gender = room.gender_restriction === `${employee.gender}_only`;
    }

    // בדיקת אילוצים דתיים
    if (employee.religious_level === 'orthodox') {
      console.log('Checking religious constraints:', {
        employeeLevel: employee.religious_level,
        roomGenderRestriction: room.gender_restriction
      });
      // חרדים יושבים רק בחדרים עם הגבלת מגדר מתאימה
      constraints.religious = !!room.gender_restriction && 
        room.gender_restriction === `${employee.gender}_only`;
    } else if (employee.religious_level === 'religious') {
      console.log('Checking religious constraints:', {
        employeeLevel: employee.religious_level,
        roomGenderRestriction: room.gender_restriction
      });
      // דתיים לא יושבים ליד המגדר השני
      const nearbyAllocations = existingAllocations.filter(allocation => 
        this.isNearby(workspace, allocation.workspace_id, workspaces)
      );
      
      constraints.religious = !nearbyAllocations.some(allocation => {
        const nearbyEmployee = employees.find(e => e.id === allocation.employee_id);
        return nearbyEmployee && nearbyEmployee.gender !== employee.gender;
      });
    }

    // בדיקת אילוצי בריאות
    constraints.health = employee.health_constraints.every(constraint => {
      switch (constraint) {
        case 'ergonomicChair':
          return workspace.features.includes('ergonomic_chair');
        case 'adjustableDesk':
          return workspace.features.includes('adjustable_desk');
        case 'nearWindow':
          return workspace.features.includes('near_window');
        case 'farFromAC':
          return !workspace.features.includes('near_ac');
        default:
          return true;
      }
    });

    // בדיקת התאמה ללוח זמנים
    const workspaceScheduleConflicts = existingAllocations
      .filter(allocation => allocation.workspace_id === workspace.id)
      .some(allocation => {
        const otherEmployee = employees.find(e => e.id === allocation.employee_id);
        return otherEmployee && this.hasScheduleConflict(employee, otherEmployee);
      });

    constraints.schedule = !workspaceScheduleConflicts;

    return {
      compatible: Object.values(constraints).every(value => value),
      constraints
    };
  }

  /**
   * בדיקה האם שני מקומות ישיבה קרובים אחד לשני
   */
  private static isNearby(workspace1: Workspace, workspace2Id: string, workspaces: Workspace[]): boolean {
    const workspace2 = workspaces.find(w => w.id === workspace2Id);
    if (!workspace2) return false;

    // מרחק של שולחן אחד נחשב "קרוב"
    const MAX_DISTANCE = 1.5; // במטרים
    
    const distance = Math.sqrt(
      Math.pow(workspace1.coordinates.x - workspace2.coordinates.x, 2) +
      Math.pow(workspace1.coordinates.y - workspace2.coordinates.y, 2)
    );

    return distance <= MAX_DISTANCE;
  }

  /**
   * בדיקה האם יש התנגשות בלוח הזמנים בין שני עובדים
   */
  private static hasScheduleConflict(employee1: Employee, employee2: Employee): boolean {
    // בדיקת חפיפה בימי עבודה
    const commonWorkDays = employee1.work_days.filter(day => 
      employee2.work_days.includes(day)
    );

    if (commonWorkDays.length === 0) return false;

    // בדיקת חפיפה בשעות עבודה
    const time1Start = new Date(`1970-01-01T${employee1.work_hours.start}`);
    const time1End = new Date(`1970-01-01T${employee1.work_hours.end}`);
    const time2Start = new Date(`1970-01-01T${employee2.work_hours.start}`);
    const time2End = new Date(`1970-01-01T${employee2.work_hours.end}`);

    return !(time1End <= time2Start || time2End <= time1Start);
  }

  /**
   * מציאת כל המקומות המתאימים לעובד
   */
  static findCompatibleWorkspaces(
    employee: Employee,
    workspaces: Workspace[],
    rooms: Room[],
    existingAllocations: Allocation[],
    employees: Employee[]
  ): { workspace: Workspace; score: number }[] {
    const compatibleWorkspaces = workspaces
      .map(workspace => {
        const room = rooms.find(r => r.id === workspace.room_id);
        if (!room) return null;

        const { compatible, constraints } = this.isWorkspaceCompatible(
          employee,
          workspace,
          room,
          existingAllocations,
          employees,
          workspaces
        );

        if (!compatible) return null;

        // חישוב ציון התאמה למקום הישיבה
        const score = this.calculateCompatibilityScore(
          employee,
          workspace,
          constraints
        );

        return { workspace, score };
      })
      .filter((result): result is { workspace: Workspace; score: number } => 
        result !== null
      )
      .sort((a, b) => b.score - a.score);

    return compatibleWorkspaces;
  }

  /**
   * חישוב ציון התאמה בין עובד למקום ישיבה
   */
  private static calculateCompatibilityScore(
    employee: Employee,
    workspace: Workspace,
    constraints: SeatingConstraints
  ): number {
    let score = 0;

    // ציון בסיסי על עמידה באילוצים
    if (constraints.gender) score += 25;
    if (constraints.religious) score += 25;
    if (constraints.health) score += 25;
    if (constraints.schedule) score += 25;

    // בונוס על התאמות נוספות
    employee.health_constraints.forEach(constraint => {
      if (workspace.features.includes(constraint)) score += 5;
    });

    return score;
  }

  /**
   * הקצאה אוטומטית של מקומות ישיבה
   */
  static async allocateSeats(
    employees: Employee[],
    workspaces: Workspace[],
    rooms: Room[],
    existingAllocations: Allocation[]
  ): Promise<Allocation[]> {
    const allocations: Allocation[] = [];

    // Sort employees by priority or any other criteria
    const sortedEmployees = [...employees].sort((a, b) => {
      // Add your sorting logic here
      return 0;
    });

    for (const employee of sortedEmployees) {
      const compatibleWorkspaces = this.findCompatibleWorkspaces(
        employee,
        workspaces,
        rooms,
        existingAllocations,
        employees
      );

      if (compatibleWorkspaces.length > 0) {
        // Choose the workspace with the highest score
        const bestWorkspace = compatibleWorkspaces.reduce((a, b) =>
          a.score > b.score ? a : b
        );

        // Create the allocation
        const allocation = {
          employee_id: employee.id,
          workspace_id: bestWorkspace.workspace.id,
          start_date: new Date().toISOString(),
          end_date: null
        };

        try {
          const newAllocation = await createAllocation(allocation);
          allocations.push(newAllocation);
          existingAllocations.push(newAllocation);
        } catch (error) {
          console.error('Failed to create allocation:', error);
        }
      }
    }

    return allocations;
  }
}
