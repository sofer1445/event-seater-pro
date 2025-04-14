export interface Room {
  id: string;
  name: string;
  floor: number;
  capacity: number;
  description?: string;
  created_at?: string;
  updated_at?: string;
}
