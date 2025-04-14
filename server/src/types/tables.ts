export interface Table {
  id: number;
  name: string;
  capacity: number;
  description?: string;
  gender_restriction?: 'male' | 'female' | 'none';
  religious_only?: boolean;
  location?: 'center' | 'window' | 'corner';
  noise_level?: 'quiet' | 'moderate' | 'loud';
  created_at: Date;
  updated_at: Date;
}

export interface Seat {
  id: number;
  table_id: number;
  position: number;
  description?: string;
  is_accessible?: boolean;
  is_quiet_zone?: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Employee {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  gender?: 'male' | 'female' | 'other';
  religious_level?: 'secular' | 'traditional' | 'religious';
  team?: string;
  team_members?: string[];
  health_constraints?: boolean;
  noise_preference?: 'quiet' | 'moderate' | 'loud' | 'any';
  location_preference?: 'center' | 'window' | 'corner';
  created_at: Date;
  updated_at: Date;
}
