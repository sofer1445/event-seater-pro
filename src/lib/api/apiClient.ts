const API_BASE_URL = 'http://localhost:4001/api';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export const apiClient = {
  async get(endpoint: string) {
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      console.log(`Making GET request to: ${url}`);
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'cors'
      });

      if (!response.ok) {
        console.error(`API Error: ${response.status} - ${response.statusText}`);
        console.error(`URL: ${url}`);
        
        // ניסיון לקרוא את גוף התשובה אם יש
        let errorMessage = `שגיאת שרת: ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData?.message) {
            errorMessage = errorData.message;
          }
          console.error('Error details:', errorData);
        } catch (parseErr) {
          console.error('Could not parse error response body:', parseErr);
        }
        
        throw new ApiError(response.status, errorMessage);
      }

      const data = await response.json();
      console.log(`Successful response from ${endpoint}:`, data);
      return data;
    } catch (error) {
      console.error('API Request Error:', error);
      
      // בדיקה אם זו שגיאת רשת
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('Network error - Is the server running?', error);
        throw new ApiError(0, 'בעיית חיבור לשרת - האם השרת רץ?');
      }
      
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, 'שגיאת התחברות לשרת');
    }
  },

  async post(endpoint: string, data: any) {
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      console.log(`Making POST request to: ${url}`, data);
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        mode: 'cors'
      });

      if (!response.ok) {
        console.error(`API Error: ${response.status} - ${response.statusText}`);
        console.error(`URL: ${url}`);
        
        // ניסיון לקרוא את גוף התשובה אם יש
        let errorMessage = `שגיאת שרת: ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData?.message) {
            errorMessage = errorData.message;
          }
          console.error('Error details:', errorData);
        } catch (parseErr) {
          console.error('Could not parse error response body:', parseErr);
        }
        
        throw new ApiError(response.status, errorMessage);
      }

      const responseData = await response.json();
      console.log(`Successful response from ${endpoint}:`, responseData);
      return responseData;
    } catch (error) {
      console.error('API Request Error:', error);
      
      // בדיקה אם זו שגיאת רשת
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('Network error - Is the server running?', error);
        throw new ApiError(0, 'בעיית חיבור לשרת - האם השרת רץ?');
      }
      
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, 'שגיאת התחברות לשרת');
    }
  },

  async patch(endpoint: string, data: any) {
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      console.log(`Making PATCH request to: ${url}`, data);
      
      // Add more detailed debugging
      console.log('PATCH request headers:', {
        'Content-Type': 'application/json',
      });
      console.log('PATCH request body:', JSON.stringify(data));
      
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        mode: 'cors'
      });

      // Add more detailed response logging
      console.log(`PATCH response status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        console.error(`API Error: ${response.status} - ${response.statusText}`);
        console.error(`URL: ${url}`);
        
        // ניסיון לקרוא את גוף התשובה אם יש
        let errorMessage = `שגיאת שרת: ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData?.message) {
            errorMessage = errorData.message;
          }
          console.error('Error details:', errorData);
        } catch (parseErr) {
          console.error('Could not parse error response body:', parseErr);
        }
        
        throw new ApiError(response.status, errorMessage);
      }

      const responseData = await response.json();
      console.log(`Successful response from ${endpoint}:`, responseData);
      return responseData;
    } catch (error) {
      console.error('API Request Error:', error);
      
      // בדיקה אם זו שגיאת רשת
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('Network error - Is the server running?', error);
        throw new ApiError(0, 'בעיית חיבור לשרת - האם השרת רץ?');
      }
      
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, 'שגיאת התחברות לשרת');
    }
  },

  async delete(endpoint: string) {
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      console.log(`Making DELETE request to: ${url}`);
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'cors'
      });

      if (!response.ok) {
        console.error(`API Error: ${response.status} - ${response.statusText}`);
        console.error(`URL: ${url}`);
        
        // ניסיון לקרוא את גוף התשובה אם יש
        let errorMessage = `שגיאת שרת: ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData?.message) {
            errorMessage = errorData.message;
          }
          console.error('Error details:', errorData);
        } catch (parseErr) {
          console.error('Could not parse error response body:', parseErr);
        }
        
        throw new ApiError(response.status, errorMessage);
      }

      if (response.status !== 204) {
        const responseData = await response.json();
        console.log(`Successful response from ${endpoint}:`, responseData);
        return responseData;
      }
      
      console.log(`Successful empty response from ${endpoint}`);
      return null;
    } catch (error) {
      console.error('API Request Error:', error);
      
      // בדיקה אם זו שגיאת רשת
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('Network error - Is the server running?', error);
        throw new ApiError(0, 'בעיית חיבור לשרת - האם השרת רץ?');
      }
      
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, 'שגיאת התחברות לשרת');
    }
  }
};

// API functions
export const getEmployees = () => apiClient.get('/employees');
export const getWorkspaces = () => apiClient.get('/workspaces');
export const getRooms = () => apiClient.get('/rooms');
export const getAllocations = () => apiClient.get('/allocations');
export const createAllocation = (allocation: any) => apiClient.post('/allocations', allocation);
