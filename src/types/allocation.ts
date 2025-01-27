export interface Allocation {
  id: string;
  created_at: string;
  updated_at: string;
  employee_id: string;
  workspace_id: string;
  start_date: string;
  end_date?: string;
  status: 'active' | 'pending' | 'completed' | 'cancelled';
}

export interface AllocationHistory {
  id: string;
  created_at: string;
  allocation_id: string;
  employee_id: string;
  workspace_id: string;
  action: 'created' | 'updated' | 'cancelled';
  reason?: string;
  changed_by: string;
}
