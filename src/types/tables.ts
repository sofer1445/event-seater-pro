export interface Table {
  id: string;
  name: string;
  capacity: number;
  description?: string;
  gender_restriction: 'none' | 'male' | 'female';
  religious_only: boolean;
  location: 'window' | 'center';
  noise_level: 'quiet' | 'moderate' | 'loud';
  created_at: string;
  updated_at: string;
}

export interface Seat {
  id: string;
  table_id: string;
  status: 'available' | 'occupied' | 'reserved';
  location: 'window' | 'center';
  position: number;
  is_accessible: boolean;
  occupied_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  gender: 'male' | 'female';
  religious_level: 'secular' | 'traditional' | 'religious' | 'orthodox';
  team: string;
  team_members?: string[];
  constraints: {
    healthConstraints?: boolean;
    noisePreference?: 'quiet' | 'moderate' | 'any';
    locationPreference?: 'window' | 'center' | 'any';
  };
}
