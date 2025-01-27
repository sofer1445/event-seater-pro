import { supabase } from '@/lib/supabase';
import { Workspace } from '@/types/workspace';

export async function getWorkspaces(): Promise<Workspace[]> {
  const { data, error } = await supabase
    .from('workspaces')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getWorkspace(id: string): Promise<Workspace> {
  const { data, error } = await supabase
    .from('workspaces')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function createWorkspace(workspace: Omit<Workspace, 'id' | 'created_at' | 'updated_at'>): Promise<Workspace> {
  const { data, error } = await supabase
    .from('workspaces')
    .insert([workspace])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateWorkspace(
  id: string,
  workspace: Partial<Omit<Workspace, 'id' | 'created_at' | 'updated_at'>>
): Promise<Workspace> {
  const { data, error } = await supabase
    .from('workspaces')
    .update(workspace)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteWorkspace(id: string): Promise<void> {
  const { error } = await supabase
    .from('workspaces')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
