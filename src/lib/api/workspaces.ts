import { query } from '@/lib/api/db';
import { v4 as uuidv4 } from 'uuid';

export async function getWorkspaces(): Promise<any[]> {
  try {
    console.log('Fetching workspaces from PostgreSQL...');
    const result = await query(
      'SELECT id, name, room_id as "roomId", features, restrictions, coordinates, created_at, updated_at FROM workspaces ORDER BY created_at DESC'
    );
    console.log('Workspaces fetched successfully:', result.rows);
    return result.rows;
  } catch (error) {
    console.error('Failed to fetch workspaces:', error);
    throw error;
  }
}

export async function getWorkspace(id: string): Promise<any> {
  try {
    console.log('Fetching workspace from PostgreSQL...');
    const result = await query(
      'SELECT id, name, room_id as "roomId", features, restrictions, coordinates, created_at, updated_at FROM workspaces WHERE id = $1',
      [id]
    );
    console.log('Workspace fetched successfully:', result.rows[0]);
    return result.rows[0];
  } catch (error) {
    console.error('Failed to fetch workspace:', error);
    throw error;
  }
}

export async function createWorkspace(workspace: any): Promise<any> {
  try {
    console.log('Creating workspace...');
    
    // Prepare workspace data
    const workspaceData = {
      name: workspace.name,
      room_id: workspace.roomId || workspace.room_id, // Support both formats
      coordinates: workspace.coordinates || { x: 0, y: 0 },
      features: workspace.features || [],
      restrictions: workspace.restrictions || []
    };

    console.log('Workspace creation payload:', workspaceData);

    const result = await query(
      'INSERT INTO workspaces (name, room_id, coordinates, features, restrictions) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, room_id as "roomId", features, restrictions, coordinates, created_at, updated_at',
      [workspaceData.name, workspaceData.room_id, workspaceData.coordinates, workspaceData.features, workspaceData.restrictions]
    );

    return result.rows[0];
  } catch (error) {
    console.error('Failed to create workspace:', error);
    throw error;
  }
}

export async function updateWorkspace(
  id: string,
  workspace: any
): Promise<any> {
  try {
    console.log('Updating workspace in PostgreSQL...');
    const { name, roomId, features, restrictions, coordinates } = workspace;
    const result = await query(
      'UPDATE workspaces SET name = $1, room_id = $2, features = $3, restrictions = $4, coordinates = $5 WHERE id = $6 RETURNING id, name, room_id as "roomId", features, restrictions, coordinates, created_at, updated_at',
      [name, roomId, features, restrictions, coordinates, id]
    );
    console.log('Workspace updated successfully:', result.rows[0]);
    return result.rows[0];
  } catch (error) {
    console.error('Failed to update workspace:', error);
    throw error;
  }
}

export async function deleteWorkspace(id: string): Promise<void> {
  try {
    console.log('Deleting workspace from PostgreSQL...');
    await query('DELETE FROM workspaces WHERE id = $1', [id]);
    console.log('Workspace deleted successfully');
  } catch (error) {
    console.error('Failed to delete workspace:', error);
    throw error;
  }
}
