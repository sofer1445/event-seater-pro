import { supabase } from '@/lib/supabase';
import { Allocation, AllocationHistory } from '@/types/allocation';

export async function getAllocations(): Promise<Allocation[]> {
  const { data, error } = await supabase
    .from('allocations')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getAllocation(id: string): Promise<Allocation> {
  const { data, error } = await supabase
    .from('allocations')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function createAllocation(allocation: Omit<Allocation, 'id' | 'created_at' | 'updated_at'>): Promise<Allocation> {
  const { data, error } = await supabase
    .from('allocations')
    .insert([allocation])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateAllocation(
  id: string,
  allocation: Partial<Omit<Allocation, 'id' | 'created_at' | 'updated_at'>>
): Promise<Allocation> {
  const { data, error } = await supabase
    .from('allocations')
    .update(allocation)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function cancelAllocation(id: string): Promise<Allocation> {
  const { data, error } = await supabase
    .rpc('cancel_allocation', { allocation_id: id })
    .single();

  if (error) throw error;
  return data;
}

export async function getAllocationHistory(allocationId: string): Promise<AllocationHistory[]> {
  const { data, error } = await supabase
    .from('allocation_history')
    .select('*')
    .eq('allocation_id', allocationId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function findCompatibleWorkspaces(
  employeeId: string
): Promise<{ workspace_id: string; compatibility_score: number }[]> {
  // קבלת פרטי העובד
  const { data: employee, error: employeeError } = await supabase
    .from('employees')
    .select('*')
    .eq('id', employeeId)
    .single();

  if (employeeError) throw employeeError;

  // קבלת כל מקומות הישיבה והחדרים
  const { data: workspaces, error: workspacesError } = await supabase
    .from('workspaces')
    .select('*');

  if (workspacesError) throw workspacesError;

  const { data: rooms, error: roomsError } = await supabase
    .from('rooms')
    .select('*');

  if (roomsError) throw roomsError;

  // קבלת ההקצאות הקיימות
  const { data: existingAllocations, error: allocationsError } = await supabase
    .from('allocations')
    .select('*')
    .in('status', ['active', 'pending']);

  if (allocationsError) throw allocationsError;

  // שימוש בשירות ההקצאות למציאת מקומות מתאימים
  const compatibleWorkspaces = SeatingAllocationService.findCompatibleWorkspaces(
    employee,
    workspaces,
    rooms,
    existingAllocations || []
  );

  return compatibleWorkspaces.map(({ workspace, score }) => ({
    workspace_id: workspace.id,
    compatibility_score: score
  }));
}

export async function autoAllocateSeats(): Promise<Allocation[]> {
  // קבלת כל העובדים ללא מקום ישיבה
  const { data: employees, error: employeesError } = await supabase
    .from('employees')
    .select('*');

  if (employeesError) throw employeesError;

  // קבלת כל מקומות הישיבה והחדרים
  const { data: workspaces, error: workspacesError } = await supabase
    .from('workspaces')
    .select('*');

  if (workspacesError) throw workspacesError;

  const { data: rooms, error: roomsError } = await supabase
    .from('rooms')
    .select('*');

  if (roomsError) throw roomsError;

  // קבלת ההקצאות הקיימות
  const { data: existingAllocations, error: allocationsError } = await supabase
    .from('allocations')
    .select('*')
    .in('status', ['active', 'pending']);

  if (allocationsError) throw allocationsError;

  // ביצוע הקצאה אוטומטית
  const newAllocations = await AutoAllocationService.allocateSeats(
    employees || [],
    workspaces || [],
    rooms || [],
    existingAllocations || []
  );

  // שמירת ההקצאות החדשות במסד הנתונים
  if (newAllocations.length > 0) {
    const { data, error } = await supabase
      .from('allocations')
      .insert(newAllocations)
      .select();

    if (error) throw error;
    return data;
  }

  return [];
}

export async function validateAllocation(
  employeeId: string,
  workspaceId: string
): Promise<{ 
  isValid: boolean; 
  constraints: { 
    gender: boolean; 
    religious: boolean; 
    health: boolean; 
    schedule: boolean; 
  }; 
}> {
  // קבלת כל המידע הנדרש
  const { data: employee, error: employeeError } = await supabase
    .from('employees')
    .select('*')
    .eq('id', employeeId)
    .single();

  if (employeeError) throw employeeError;

  const { data: workspace, error: workspaceError } = await supabase
    .from('workspaces')
    .select('*')
    .eq('id', workspaceId)
    .single();

  if (workspaceError) throw workspaceError;

  const { data: room, error: roomError } = await supabase
    .from('rooms')
    .select('*')
    .eq('id', workspace.room_id)
    .single();

  if (roomError) throw roomError;

  const { data: existingAllocations, error: allocationsError } = await supabase
    .from('allocations')
    .select('*')
    .in('status', ['active', 'pending']);

  if (allocationsError) throw allocationsError;

  // בדיקת תקינות ההקצאה
  const result = SeatingAllocationService.isWorkspaceCompatible(
    employee,
    workspace,
    room,
    existingAllocations || []
  );

  return {
    isValid: result.compatible,
    constraints: result.constraints
  };
}
