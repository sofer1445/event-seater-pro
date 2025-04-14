export type Gender = 'male' | 'female' | 'other';
export type ReligiousLevel = 'secular' | 'traditional' | 'religious' | 'orthodox';
export type WorkLocation = 'office' | 'home';
export type LocationPreference = 'window' | 'center' | 'any';
export type NoisePreference = 'quiet' | 'moderate' | 'loud' | 'any';

// סוגי אילוצים מותאמים אישית
export enum ConstraintType {
  WINDOW_PROXIMITY = 'window_proximity',    // קרבה לחלון (לבעלי קלסטרופוביה)
  FIXED_SEAT = 'fixed_seat',                // מקום קבוע (לבני שירות)
  TEAM_PROXIMITY = 'team_proximity',        // קרבה לחברי צוות מסוימים
  AWAY_FROM_AC = 'away_from_ac',            // מרחק ממזגן
  ACCESSIBILITY = 'accessibility',          // נגישות (מעבר לאילוץ הבריאותי הרגיל)
  SCHEDULE_BASED = 'schedule_based',        // אילוץ תלוי לוח זמנים
  EQUIPMENT_NEEDS = 'equipment_needs',      // צרכי ציוד מיוחדים
  CUSTOM = 'custom'                         // אילוץ מותאם אישית אחר
}

// חומרת האילוץ
export type ConstraintSeverity = 'must' | 'prefer';

// מבנה אילוץ מותאם אישית
export interface CustomConstraint {
  type: ConstraintType | string;     // סוג האילוץ המותאם אישית
  description: string;               // תיאור האילוץ
  severity: ConstraintSeverity;      // חובה או העדפה
  parameters: {                      // פרמטרים נוספים לפי סוג האילוץ
    [key: string]: any;
  };
}

export interface HealthConstraint {
    type: 'ergonomicChair' | 'adjustableDesk' | 'nearWindow' | 'farFromAC' | 'other';
    description?: string;
}

export interface WorkDay {
  day: 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday';
  location: WorkLocation;
}

export interface EmployeeConstraints {
  religious: boolean;
  healthConstraints: boolean;
  preferredArea?: string;
  cannotSitWith?: string[];
  mustSitWith?: string[];
  requiresPrivateRoom?: boolean;
  
  // אילוצים מותאמים אישית
  customConstraints?: CustomConstraint[];
}

export interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  name?: string; 
  email: string;
  is_religious?: boolean;
  has_health_constraints?: boolean;
  gender?: Gender;
  religious_level?: ReligiousLevel;
  workspace_id?: string;
  constraints?: EmployeeConstraints;
  status?: 'active' | 'inactive';
  created_at?: string;
  updated_at?: string;
  work_schedule?: WorkDay[];
  work_hours?: {
    start: string;
    end: string;
  };
  team?: string;
  preferred_colleagues?: string[];
  preferred_location?: LocationPreference;
  noise_preference?: NoisePreference;
}

export type PartialEmployee = Partial<Employee>;
