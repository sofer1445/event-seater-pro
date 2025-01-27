export interface WorkspaceFeatures {
    hasErgonomicChair: boolean;
    hasAdjustableDesk: boolean;
    isNearWindow: boolean;
    isNearAC: boolean;
    additionalFeatures?: string[];
}

export interface Workspace {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  room: string;
  floor: number;
  features: string[]; // ['standing_desk', 'monitor', 'keyboard']
  restrictions: string[]; // ['no_food', 'quiet_zone']
  coordinates: {
    x: number;
    y: number;
  };
}

export interface Room {
    id: string;
    name: string;
    floor: number;
    gender_restriction?: 'male_only' | 'female_only' | null;
    capacity: number;
    description?: string;
}
