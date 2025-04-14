export interface WorkspaceFeatures {
    hasErgonomicChair: boolean;
    hasAdjustableDesk: boolean;
    isNearWindow: boolean;
    isNearAC: boolean;
    additionalFeatures?: string[];
}

export interface WorkspaceRestrictions {
    genderRestriction: 'male' | 'female' | 'none';
    religiousOnly: boolean;
}

export interface Workspace {
    id: string;
    name: string;
    roomId: string;
    number?: string;
    floor?: number;
    features: WorkspaceFeatures;
    restrictions: WorkspaceRestrictions;
    coordinates: {
        x: number;
        y: number;
    };
    capacity: number;
    created_at: string;
    updated_at: string;
}

export interface Room {
  id: string;
  name: string;
  floor: number;
  capacity: number;
  description?: string;
  gender_restriction?: 'male' | 'female' | null;
  religious_only?: boolean;
  features: string[];
  coordinates: { x: number; y: number };
  created_at: string;
  updated_at: string;
}
