import { httpClient, type BackendResponse } from './httpClient';

/**
 * Household object returned from the API
 */
export type Household = {
  id: number;
  uuid: string;
  name: string;
  description: string | null;
  invite_code: string;
  created_at: string;
  updated_at: string;
  owner_id: number;
};

/**
 * Create household payload
 */
export type CreateHouseholdPayload = {
  name: string;
  description?: string;
};

/**
 * Join household payload
 */
export type JoinHouseholdPayload = {
  invite_code: string;
};

/**
 * Get all households the current user belongs to
 * 
 * Endpoint: GET /api/v1/households
 * Requires: Authorization: Bearer <access_token>
 * 
 * @returns Promise resolving to array of Household objects
 * @throws Error if request fails
 */
export async function getMyHouseholds(): Promise<Household[]> {
  try {
    const response = await httpClient.get<BackendResponse<Household[]>>('/api/v1/households');

    if (!response.data?.success) {
      throw new Error(response.data?.error?.message || 'Failed to get households');
    }

    return response.data.data;
  } catch (error: any) {
    console.error('Get households error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });

    const apiMessage =
      error.response?.data?.detail ||
      error.response?.data?.error?.message ||
      error.response?.data?.error ||
      error.message ||
      'Failed to get households';

    throw new Error(apiMessage);
  }
}

/**
 * Create a new household
 * 
 * Endpoint: POST /api/v1/households
 * Requires: Authorization: Bearer <access_token>
 * 
 * @param payload - Household creation data (name, optional description)
 * @returns Promise resolving to created Household object
 * @throws Error if creation fails
 */
export async function createHousehold(payload: CreateHouseholdPayload): Promise<Household> {
  try {
    const response = await httpClient.post<BackendResponse<Household>>(
      '/api/v1/households',
      payload
    );

    if (!response.data?.success) {
      throw new Error(response.data?.error?.message || 'Failed to create household');
    }

    return response.data.data;
  } catch (error: any) {
    console.error('Create household error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });

    const apiMessage =
      error.response?.data?.detail ||
      error.response?.data?.error?.message ||
      error.response?.data?.error ||
      error.message ||
      'Failed to create household';

    throw new Error(apiMessage);
  }
}

/**
 * Join a household using an invite code
 * 
 * Endpoint: POST /api/v1/households/join
 * Requires: Authorization: Bearer <access_token>
 * 
 * @param inviteCode - The invite code for the household
 * @returns Promise resolving to joined Household object
 * @throws Error if join fails
 */
export async function joinHousehold(inviteCode: string): Promise<Household> {
  try {
    const payload: JoinHouseholdPayload = {
      invite_code: inviteCode.trim(),
    };

    const response = await httpClient.post<BackendResponse<Household>>(
      '/api/v1/households/join',
      payload
    );

    if (!response.data?.success) {
      throw new Error(response.data?.error?.message || 'Failed to join household');
    }

    return response.data.data;
  } catch (error: any) {
    console.error('Join household error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });

    const apiMessage =
      error.response?.data?.detail ||
      error.response?.data?.error?.message ||
      error.response?.data?.error ||
      error.message ||
      'Failed to join household';

    throw new Error(apiMessage);
  }
}

