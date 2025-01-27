export type Gender = 'male' | 'female' | 'other';
export type ReligiousLevel = 'secular' | 'traditional' | 'religious' | 'orthodox';

export interface HealthConstraint {
    type: 'ergonomicChair' | 'adjustableDesk' | 'nearWindow' | 'farFromAC' | 'other';
    description?: string;
}

export interface WorkSchedule {
    daysInOffice: ('sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday')[];
    requiresOfficeWhenSick: boolean;
}

export interface Employee {
  id: string;
  created_at: string;
  updated_at: string;
  first_name: string;
  last_name: string;
  email: string;
  gender: Gender;
  religious_level: ReligiousLevel;
  health_constraints: string[];
  work_days: number[]; // [1,2,3,4,5,6,7] where 1=Sunday, 7=Saturday
  work_hours: {
    start: string; // "09:00"
    end: string; // "17:00"
  };
}
