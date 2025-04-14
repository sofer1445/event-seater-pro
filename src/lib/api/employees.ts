import { apiClient } from './apiClient';
import { Employee, EmployeeConstraints } from '@/types/employee';

export const getEmployees = (): Promise<Employee[]> => {
  return apiClient.get('/employees');
};

export const getEmployee = (id: string): Promise<Employee> => {
  return apiClient.get(`/employees/${id}`);
};

export const createEmployee = (employee: Partial<Employee>): Promise<Employee> => {
  return apiClient.post('/employees', employee);
};

export const updateEmployee = (id: string, employee: Partial<Employee>): Promise<Employee> => {
  return apiClient.patch(`/employees/${id}`, employee);
};

export const deleteEmployee = (id: string): Promise<void> => {
  return apiClient.delete(`/employees/${id}`);
};

/**
 * עדכון אילוצי העובד
 */
export const updateEmployeeConstraints = (id: string, constraints: EmployeeConstraints): Promise<Employee> => {
  return apiClient.patch(`/employees/${id}`, { constraints });
};

/**
 * קבלת אילוצי העובד
 */
export const getEmployeeConstraints = (id: string): Promise<EmployeeConstraints> => {
  return apiClient.get(`/employees/${id}/constraints`);
};
