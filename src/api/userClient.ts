import { httpClient, type BackendResponse } from './httpClient';

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

export type UserUpdatePayload = {
  full_name?: string;
  dietary_preferences?: string;
  allergies?: string;
};

export type ChangePasswordPayload = {
  old_password: string;
  new_password: string;
};

async function unwrapData<T>(promise: Promise<{ data: BackendResponse<T> }>): Promise<T> {
  try {
    const response = await promise;
    if (!response.data?.success) {
      throw new Error(response.data?.error?.message || 'Request failed');
    }
    return response.data.data;
  } catch (error: any) {
    const apiMessage =
      error.response?.data?.detail ||
      error.response?.data?.error?.message ||
      error.response?.data?.error ||
      error.message ||
      'Request failed';
    throw new Error(apiMessage);
  }
}

/**
 * Get current authenticated user (users service)
 * Endpoint: GET /api/v1/users/me
 */
export async function getMe(): Promise<User> {
  return unwrapData(httpClient.get<BackendResponse<User>>('/api/v1/users/me'));
}

/**
 * Update current user profile
 * Endpoint: PUT /api/v1/users/me
 */
export async function updateMe(payload: UserUpdatePayload): Promise<User> {
  return unwrapData(httpClient.put<BackendResponse<User>>('/api/v1/users/me', payload));
}

/**
 * Change current user's password
 * Endpoint: POST /api/v1/users/me/change-password
 */
export async function changePassword(payload: ChangePasswordPayload): Promise<void> {
  await unwrapData(httpClient.post<BackendResponse<null>>('/api/v1/users/me/change-password', payload));
}

/**
 * Backward compatibility wrapper used elsewhere in the app
 * Delegates to GET /api/v1/users/me
 */
export async function getCurrentUser(): Promise<User> {
  return getMe();
}
