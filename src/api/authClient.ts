import axios from 'axios';

const API_BASE = "https://mealsync.up.railway.app";

/**
 * Register payload matching the backend API schema
 * POST /api/v1/auth/register
 */
export type RegisterPayload = {
  email: string;
  username: string;
  full_name?: string;
  dietary_preferences?: string;
  allergies?: string;
  password: string;
};

/**
 * Login payload matching the backend API schema
 * POST /api/v1/auth/login
 * identifier can be either username OR email
 */
export type LoginPayload = {
  identifier: string; // Can be username OR email
  password: string;
};

/**
 * Token data returned from login endpoint
 */
export type TokenData = {
  access_token: string;
  token_type: string;
  refresh_token: string;
};

/**
 * User object returned from /api/v1/auth/me
 */
export type User = {
  id: string;
  email: string;
  username?: string;
  full_name?: string;
  name?: string;
  dietaryPreferences?: string | null;
  dietary_preferences?: string | null;
  createdAt?: string;
};

/**
 * Backend response structure
 */
type BackendResponse<T> = {
  success: boolean;
  error?: {
    message?: string;
    [key: string]: any;
  };
  data: T;
};

/**
 * Register a new user
 * 
 * Endpoint: POST /api/v1/auth/register
 * 
 * @param payload - Registration data (email, username, full_name, password, optional dietary_preferences and allergies)
 * @returns Promise resolving to user data
 * @throws Error with message from backend if registration fails
 */
export async function registerUser(payload: RegisterPayload) {
  try {
    const response = await axios.post<BackendResponse<any>>(
      `${API_BASE}/api/v1/auth/register`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      }
    );

    if (!response.data?.success) {
      throw new Error(response.data?.error?.message || 'Registration failed');
    }

    return response.data.data;
  } catch (error: any) {
    console.error('Auth registration error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });

    const apiMessage =
      error.response?.data?.detail ||
      error.response?.data?.error?.message ||
      error.response?.data?.error ||
      error.message ||
      'Registration failed';

    throw new Error(apiMessage);
  }
}

/**
 * Login an existing user
 * 
 * Endpoint: POST /api/v1/auth/login
 * Content-Type: application/x-www-form-urlencoded
 * 
 * @param payload - Login credentials (identifier can be username OR email, and password)
 * @returns Promise resolving to TokenData with access_token, token_type, and refresh_token
 * @throws Error with message from backend if login fails
 */
export async function loginUser(payload: LoginPayload): Promise<TokenData> {
  try {
    // Build form data for application/x-www-form-urlencoded
    const params = new URLSearchParams();
    params.append('username', payload.identifier); // Backend expects 'username' field
    params.append('password', payload.password);
    params.append('grant_type', 'password');

    const response = await axios.post<BackendResponse<TokenData>>(
      `${API_BASE}/api/v1/auth/login`,
      params,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
      }
    );

    // Backend wraps token in { success, error, data }
    if (!response.data?.success) {
      throw new Error(response.data?.error?.message || 'Login failed');
    }

    return response.data.data as TokenData;
  } catch (error: any) {
    console.error('Auth login error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });

    const apiMessage =
      error.response?.data?.detail ||
      error.response?.data?.error?.message ||
      error.response?.data?.error ||
      error.message ||
      'Login failed';

    throw new Error(apiMessage);
  }
}

/**
 * Get current user information
 * 
 * Endpoint: GET /api/v1/auth/me
 * Requires: Authorization: Bearer <access_token>
 * 
 * @param accessToken - JWT access token
 * @returns Promise resolving to User object
 * @throws Error if token is invalid or user not found
 */
export async function getCurrentUser(accessToken: string): Promise<User> {
  try {
    const response = await axios.get<BackendResponse<User>>(
      `${API_BASE}/api/v1/auth/me`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      }
    );

    if (!response.data?.success) {
      throw new Error(response.data?.error?.message || 'Failed to get user');
    }

    return response.data.data;
  } catch (error: any) {
    console.error('Get user error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });

    const apiMessage =
      error.response?.data?.detail ||
      error.response?.data?.error?.message ||
      error.response?.data?.error ||
      error.message ||
      'Failed to get user';

    throw new Error(apiMessage);
  }
}



