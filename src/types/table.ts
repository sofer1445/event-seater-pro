export interface Table {
  id: string;
  name: string;
  capacity: number;
  description?: string;
  gender_restriction?: 'male' | 'female' | 'none';
  religious_only?: boolean;
  location?: 'center' | 'window' | 'corner';
  noise_level?: 'quiet' | 'moderate' | 'loud';
  created_at: string;
  updated_at: string;
  seat_count?: number;
  occupied_seats?: number;
}

export interface Seat {
  id: string;
  table_id: string;
  position: number;
  description?: string;
  is_accessible?: boolean;
  is_quiet_zone?: boolean;
  status: 'available' | 'occupied' | 'reserved';
  occupied_by?: string;
  created_at: string;
  updated_at: string;
  location?: 'window' | 'center' | 'corner';
}

export type LocationPreference = 'center' | 'window' | 'corner' | 'any';
export type NoisePreference = 'quiet' | 'moderate' | 'loud' | 'any';

export interface EmployeeConstraints {
  noisePreference?: NoisePreference;
  locationPreference?: LocationPreference;
  healthConstraints?: boolean;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  gender?: 'male' | 'female' | 'other';
  religious_level?: 'secular' | 'traditional' | 'religious';
  team?: string;
  team_members?: string[];
  constraints?: EmployeeConstraints;
  created_at: string;
  updated_at: string;
}
