import { apiClient } from './apiClient';
import { Seat } from '@/types/tables';
import { UpdateSeatDto } from '@/types/dto';

export interface CreateSeatDto {
  position: number;
  description?: string;
  is_accessible?: boolean;
  is_quiet_zone?: boolean;
}

export const getTableSeats = (tableId: string): Promise<Seat[]> => {
  return apiClient.get(`/tables/${tableId}/seats`);
};

export const getSeat = (id: string): Promise<Seat> => {
  return apiClient.get(`/seats/${id}`);
};

export const createSeat = (tableId: string, data: CreateSeatDto): Promise<Seat> => {
  return apiClient.post(`/tables/${tableId}/seats`, data);
};

export const updateSeat = (id: string, data: UpdateSeatDto): Promise<Seat> => {
  return apiClient.patch(`/seats/${id}`, data);
};

export const deleteSeat = (id: string): Promise<void> => {
  return apiClient.delete(`/seats/${id}`);
};
