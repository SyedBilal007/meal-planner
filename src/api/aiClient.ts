import { httpClient, type BackendResponse } from './httpClient';

/**
 * AI meal suggestion matching backend schema
 */
export type AiMealSuggestion = {
  name: string;
  meal_name?: string;
  description: string;
  meal_date?: string;
  meal_type?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  ingredients_used?: string[];
  requires_shopping?: boolean;
  additional_ingredients_needed?: string[];
  estimated_prep_time_minutes?: number;
  estimated_calories?: number;
  recipe?: {
    instructions: string;
    ingredients: Array<{ name: string; quantity: string; unit?: string }>;
  };
};

/**
 * AI meal plan response wrapper
 */
export type AiMealPlanResponse = {
  meal_suggestions: AiMealSuggestion[];
};

/**
 * Generate meal plan payload
 */
export type GenerateMealPlanPayload = {
  household_id: number;
  days: number;
  meals_per_day: number;
  start_date: string;
  servings: number;
  use_available_only: boolean;
  dietary_preferences?: string[];
  preferred_meal_types?: string[];
  ingredients?: string[];
};

/**
 * Save meal item payload
 */
export type SaveMealItem = {
  meal_name: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  meal_date: string;
  description: string;
  servings: number;
  recipe_id: null;
  assigned_to_id: null;
  ingredients_used: string[];
  additional_ingredients_needed?: string[];
  estimated_prep_time_minutes?: number;
  estimated_calories?: number;
};

/**
 * Save meal plan payload
 */
export type SaveMealPlanPayload = {
  household_id: number;
  auto_create_ingredients: boolean;
  auto_match_recipes: boolean;
  meals: SaveMealItem[];
};

/**
 * Generate a meal plan from ingredients
 * 
 * Endpoint: POST /api/v1/ai/generate-meal-plan
 * Requires: Authorization: Bearer <access_token>
 * 
 * @param payload - Generate meal plan data (ingredients, optional dietary_preferences and days)
 * @returns Promise resolving to AiMealPlanResponse with meal_suggestions
 * @throws Error if request fails
 */
export async function generateMealPlan(
  payload: GenerateMealPlanPayload
): Promise<AiMealPlanResponse> {
  try {
    const response = await httpClient.post<BackendResponse<AiMealPlanResponse>>(
      '/api/v1/ai/generate-meal-plan',
      payload
    );

    if (!response.data?.success) {
      const errorMsg = response.data?.error?.message || 'Failed to generate meal plan';
      throw new Error(errorMsg);
    }

    // Backend returns: { success: true, data: { meal_suggestions: [...] } }
    // Return the inner data object which contains meal_suggestions
    return response.data.data;
  } catch (error: any) {
    console.error('Generate meal plan error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });

    // Extract error message from response
    let apiMessage = 'Failed to generate meal plan';

    if (error.response?.data) {
      const responseData = error.response.data;

      // Try to get error message from various possible locations
      if (typeof responseData === 'string') {
        // Response is plain text
        apiMessage = responseData;
      } else if (responseData.detail) {
        // FastAPI-style error detail
        apiMessage = typeof responseData.detail === 'string' 
          ? responseData.detail 
          : JSON.stringify(responseData.detail);
      } else if (responseData.error) {
        // Backend error object
        if (typeof responseData.error === 'string') {
          apiMessage = responseData.error;
        } else if (responseData.error.message) {
          apiMessage = responseData.error.message;
        } else {
          apiMessage = JSON.stringify(responseData.error);
        }
      } else if (responseData.message) {
        // Direct message field
        apiMessage = responseData.message;
      } else if (Array.isArray(responseData.details)) {
        // Validation errors array
        const details = responseData.details
          .map((d: any) => d.message || d.msg || String(d))
          .filter(Boolean)
          .join('; ');
        if (details) {
          apiMessage = details;
        }
      }
    } else if (error.message) {
      // Network error or other error with message
      apiMessage = error.message;
    }

    throw new Error(apiMessage);
  }
}

/**
 * Save a meal plan
 * 
 * Endpoint: POST /api/v1/ai/save-meal-plan
 * Requires: Authorization: Bearer <access_token>
 * 
 * @param payload - Save meal plan data (meal_suggestions, optional household_id)
 * @returns Promise resolving to void or saved meal plan data (adjust based on backend response)
 * @throws Error if request fails
 */
export async function saveMealPlan(
  payload: SaveMealPlanPayload
): Promise<void> {
  try {
    const response = await httpClient.post<BackendResponse<void>>(
      '/api/v1/ai/save-meal-plan',
      payload
    );

    if (!response.data?.success) {
      throw new Error(response.data?.error?.message || 'Failed to save meal plan');
    }
  } catch (error: any) {
    console.error('Save meal plan error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });

    // Extract error message from response
    let apiMessage = 'Failed to save meal plan';

    if (error.response?.data) {
      const responseData = error.response.data;

      // Try to get error message from various possible locations
      if (typeof responseData === 'string') {
        // Response is plain text
        apiMessage = responseData;
      } else if (responseData.detail) {
        // FastAPI-style error detail
        apiMessage = typeof responseData.detail === 'string' 
          ? responseData.detail 
          : JSON.stringify(responseData.detail);
      } else if (responseData.error) {
        // Backend error object
        if (typeof responseData.error === 'string') {
          apiMessage = responseData.error;
        } else if (responseData.error.message) {
          apiMessage = responseData.error.message;
        } else {
          apiMessage = JSON.stringify(responseData.error);
        }
      } else if (responseData.message) {
        // Direct message field
        apiMessage = responseData.message;
      } else if (Array.isArray(responseData.details)) {
        // Validation errors array
        const details = responseData.details
          .map((d: any) => d.message || d.msg || String(d))
          .filter(Boolean)
          .join('; ');
        if (details) {
          apiMessage = details;
        }
      }
    } else if (error.message) {
      // Network error or other error with message
      apiMessage = error.message;
    }

    throw new Error(apiMessage);
  }
}

