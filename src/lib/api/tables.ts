import { apiClient } from './apiClient';
import { Table } from '@/types/tables';

export async function getTables(): Promise<Table[]> {
  return apiClient.get('/tables');
}

export async function getTable(id: string): Promise<Table> {
  return apiClient.get(`/tables/${id}`);
}

export async function createTable(table: Partial<Table>): Promise<Table> {
  return apiClient.post('/tables', table);
}

export async function updateTable(id: string, table: Partial<Table>): Promise<Table> {
  return apiClient.patch(`/tables/${id}`, table);
}

export async function deleteTable(id: string): Promise<void> {
  return apiClient.delete(`/tables/${id}`);
}
