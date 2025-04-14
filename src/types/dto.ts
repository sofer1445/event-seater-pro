export interface UpdateSeatDto {
  status?: 'available' | 'occupied' | 'reserved';
  occupied_by?: string;
  is_accessible?: boolean;
}

export interface UpdateTableDto {
  name?: string;
  capacity?: number;
  description?: string;
}

export interface UpdateEmployeeDto {
  name?: string;
  email?: string;
  gender?: 'male' | 'female' | 'other';
  religious_level?: 'secular' | 'traditional' | 'religious';
  team?: string;
  team_members?: string[];
  health_constraints?: boolean;
  noise_preference?: 'quiet' | 'moderate' | 'loud';
  location_preference?: 'center' | 'window' | 'corner';
}
