import axios from 'axios';

const API_BASE = "https://mealsync.up.railway.app";

/**
 * Register payload matching the backend schema
 * Based on server/src/routes/auth.ts registerSchema
 */
export type RegisterPayload = {
  email: string;
  password: string;
  name?: string;
  dietaryPreferences?: string;
};

/**
 * Login payload matching the backend schema
 * Based on server/src/routes/auth.ts loginSchema
 */
export type LoginPayload = {
  email: string;
  password: string;
};

/**
 * User object returned from auth endpoints
 * Based on server/src/routes/auth.ts response structure
 */
export type User = {
  id: string;
  email: string;
  name: string | null;
  dietaryPreferences: string | null;
  createdAt?: string; // Only present in register response
};

/**
 * Auth response structure from backend
 * Based on server/src/routes/auth.ts response format
 */
export type AuthResponse = {
  user: User;
  token: string;
};

/**
 * Error response structure from backend
 */
type ErrorResponse = {
  error: string;
  details?: Array<{ path: string[]; message: string }>;
};

/**
 * Register a new user
 * 
 * Endpoint: POST /api/auth/register
 * 
 * @param payload - Registration data (email, password, optional name and dietaryPreferences)
 * @returns Promise resolving to AuthResponse with user and token
 * @throws Error with message from backend if registration fails
 */
export async function registerUser(payload: RegisterPayload): Promise<AuthResponse> {
  try {
    const response = await axios.post<AuthResponse>(
      `${API_BASE}/api/auth/register`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error: any) {
    // Handle 4xx errors with JSON error messages
    if (error.response?.status >= 400 && error.response?.status < 500) {
      const errorData: ErrorResponse = error.response.data;
      throw new Error(errorData.error || 'Registration failed');
    }
    // Handle network errors or other issues
    throw new Error(error.message || 'Failed to register user');
  }
}

/**
 * Login an existing user
 * 
 * Endpoint: POST /api/auth/login
 * 
 * @param payload - Login credentials (email and password)
 * @returns Promise resolving to AuthResponse with user and token
 * @throws Error with message from backend if login fails
 */
export async function loginUser(payload: LoginPayload): Promise<AuthResponse> {
  try {
    const response = await axios.post<AuthResponse>(
      `${API_BASE}/api/auth/login`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error: any) {
    // Handle 4xx errors with JSON error messages
    if (error.response?.status >= 400 && error.response?.status < 500) {
      const errorData: ErrorResponse = error.response.data;
      throw new Error(errorData.error || 'Login failed');
    }
    // Handle network errors or other issues
    throw new Error(error.message || 'Failed to login');
  }
}

