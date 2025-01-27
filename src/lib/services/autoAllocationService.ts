import { Employee } from '@/types/employee';
import { Workspace, Room } from '@/types/workspace';
import { Allocation } from '@/types/allocation';
import { SeatingAllocationService } from './seatingAllocationService';

export class AutoAllocationService {
  /**
   * ביצוע הקצאה אוטומטית של מקומות ישיבה לכל העובדים
   */
  static async allocateSeats(
    employees: Employee[],
    workspaces: Workspace[],
    rooms: Room[],
    existingAllocations: Allocation[]
  ): Promise<Allocation[]> {
    // מיון העובדים לפי סדר עדיפות
    const sortedEmployees = this.prioritizeEmployees(employees);
    const newAllocations: Allocation[] = [];

    for (const employee of sortedEmployees) {
      // מציאת כל המקומות המתאימים לעובד
      const compatibleWorkspaces = SeatingAllocationService.findCompatibleWorkspaces(
        employee,
        workspaces,
        rooms,
        [...existingAllocations, ...newAllocations]
      );

      if (compatibleWorkspaces.length > 0) {
        // בחירת המקום המתאים ביותר
        const bestWorkspace = compatibleWorkspaces[0].workspace;
        
        // יצירת הקצאה חדשה
        const newAllocation: Allocation = {
          id: crypto.randomUUID(),
          employee_id: employee.id,
          workspace_id: bestWorkspace.id,
          status: 'pending',
          start_date: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        newAllocations.push(newAllocation);
      }
    }

    return newAllocations;
  }

  /**
   * מיון העובדים לפי סדר עדיפות להקצאת מקומות
   */
  private static prioritizeEmployees(employees: Employee[]): Employee[] {
    return employees.sort((a, b) => {
      // חישוב ציון עדיפות לכל עובד
      const scoreA = this.calculateEmployeePriority(a);
      const scoreB = this.calculateEmployeePriority(b);
      return scoreB - scoreA;
    });
  }

  /**
   * חישוב ציון עדיפות לעובד
   */
  private static calculateEmployeePriority(employee: Employee): number {
    let score = 0;

    // עובדים עם יותר אילוצים מקבלים עדיפות גבוהה יותר
    score += employee.health_constraints.length * 10;
    
    // עובדים דתיים/חרדים מקבלים עדיפות גבוהה יותר
    if (employee.religious_level === 'orthodox') score += 30;
    if (employee.religious_level === 'religious') score += 20;
    
    // עובדים שמגיעים יותר ימים למשרד מקבלים עדיפות גבוהה יותר
    score += employee.work_days.length * 5;

    return score;
  }
}
