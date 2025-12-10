import { httpClient, type BackendResponse } from './httpClient';

/**
 * User object returned from /api/v1/auth/me
 * Matches the backend API schema
 */
export type User = {
  id: number;
  uuid: string;
  email: string;
  username: string | null;
  full_name: string | null;
  dietary_preferences: string | null;
  allergies: string | null;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
};

/**
 * Get current authenticated user
 * 
 * Endpoint: GET /api/v1/auth/me
 * Requires: Authorization: Bearer <access_token>
 * 
 * @returns Promise resolving to User object
 * @throws Error if token is invalid or user not found
 */
export async function getCurrentUser(): Promise<User> {
  try {
    const response = await httpClient.get<BackendResponse<User>>('/api/v1/auth/me');

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

