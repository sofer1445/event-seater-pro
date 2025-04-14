export interface Allocation {
  id: string;
  employee_id: string;
  workspace_id: string;
  start_date: string;
  end_date?: string;
  status: 'active' | 'pending' | 'cancelled';
  created_at?: string;
  updated_at?: string;
  compatibility_score?: number;
}

export interface AllocationHistory {
  id: string;
  allocation_id: string;
  status: string;
  reason: string;
  created_at: string;
  updated_at: string;
}
