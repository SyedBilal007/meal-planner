import axios, { type AxiosInstance, type AxiosError } from 'axios';

const API_BASE = "https://mealsync.up.railway.app";

/**
 * Backend response structure
 */
export type BackendResponse<T> = {
  success: boolean;
  error?: {
    message?: string;
    [key: string]: any;
  };
  data: T;
};

/**
 * Creates an axios instance that automatically adds Authorization header
 * from localStorage token
 */
function createHttpClient(): AxiosInstance {
  const client = axios.create({
    baseURL: API_BASE,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });

  // Request interceptor: Add Authorization header from localStorage
  client.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('mealsync_access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor: Handle 401 errors by logging out
  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      if (error.response?.status === 401) {
        // Clear tokens
        localStorage.removeItem('mealsync_access_token');
        localStorage.removeItem('mealsync_refresh_token');
        localStorage.removeItem('mealsync_token_type');
        localStorage.removeItem('mealsync_user');
        localStorage.removeItem('mealsync_active_household_id');
        
        // Dispatch a custom event that AuthContext can listen to
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        
        // Redirect to login if not already there
        if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
          window.location.href = '/login';
        }
      }
      return Promise.reject(error);
    }
  );

  return client;
}

// Export the configured axios instance
export const httpClient = createHttpClient();

