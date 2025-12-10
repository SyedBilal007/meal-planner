import { httpClient, type BackendResponse } from './httpClient';
import type { UnitOfMeasurement } from './ingredientClient';

/**
 * Difficulty level enum matching backend schema
 */
export type DifficultyLevel = "easy" | "medium" | "hard";

/**
 * Cuisine type enum matching backend schema
 */
export type CuisineType =
  | "italian"
  | "indian"
  | "chinese"
  | "mexican"
  | "american"
  | "japanese"
  | "mediterranean"
  | "thai"
  | "middle_eastern"
  | "other";

/**
 * Recipe ingredient in a recipe
 */
export type RecipeIngredient = {
  ingredient_id: number;
  quantity: number;
  unit: UnitOfMeasurement;
  notes?: string;
  is_optional?: boolean;
  order?: number;
  name?: string; // optional, for UI display of ingredient name
};

/**
 * Recipe object returned from the API
 */
export type Recipe = {
  id: number;
  uuid: string;
  name: string;
  description?: string | null;
  instructions: string;
  prep_time_minutes: number;
  cook_time_minutes: number;
  servings: number;
  difficulty: DifficultyLevel;
  cuisine_type: CuisineType;
  tags?: string | null;
  calories_per_serving?: number | null;
  source_url?: string | null;
  image_url?: string | null;
  is_public: boolean;
  household_id: number;
  created_by_id: number;
  created_at: string;
  updated_at: string;
  total_time_minutes: number;
  ingredients: RecipeIngredient[];
  creator_name?: string;
};

/**
 * Create recipe payload
 */
export type RecipeCreate = {
  name: string;
  description?: string;
  instructions: string;
  prep_time_minutes?: number;
  cook_time_minutes?: number;
  servings?: number;
  difficulty?: DifficultyLevel;
  cuisine_type?: CuisineType;
  tags?: string;
  calories_per_serving?: number;
  source_url?: string;
  image_url?: string;
  is_public?: boolean;
  household_id: number;
  ingredients: RecipeIngredient[];
};

/**
 * Update recipe payload (all fields optional except household_id is omitted)
 */
export type RecipeUpdate = Partial<Omit<RecipeCreate, "household_id">> & {
  ingredients?: RecipeIngredient[];
};

/**
 * Search parameters for recipes
 */
export type RecipeSearchParams = {
  query?: string;
  cuisine_type?: CuisineType;
  difficulty?: DifficultyLevel;
  min_prep_time?: number;
  max_prep_time?: number;
  min_cook_time?: number;
  max_cook_time?: number;
  ingredient_ids?: number[];
  tags?: string;
  skip?: number;
  limit?: number;
};

/**
 * Get recipes for the current user
 * 
 * Endpoint: GET /api/v1/recipes
 * Requires: Authorization: Bearer <access_token>
 * 
 * @param options - Optional pagination parameters
 * @returns Promise resolving to array of Recipe objects
 * @throws Error if request fails
 */
export async function getMyRecipes(
  options?: { skip?: number; limit?: number }
): Promise<Recipe[]> {
  try {
    const params = new URLSearchParams();
    if (options?.skip !== undefined) {
      params.append('skip', String(options.skip));
    }
    if (options?.limit !== undefined) {
      params.append('limit', String(options.limit));
    }

    const queryString = params.toString();
    const url = `/api/v1/recipes${queryString ? `?${queryString}` : ''}`;

    const response = await httpClient.get<BackendResponse<Recipe[]>>(url);

    if (!response.data?.success) {
      throw new Error(response.data?.error?.message || 'Failed to load recipes');
    }

    return response.data.data;
  } catch (error: any) {
    console.error('Get my recipes error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });

    const apiMessage =
      error.response?.data?.detail ||
      error.response?.data?.error?.message ||
      error.response?.data?.error ||
      error.message ||
      'Failed to load recipes';

    throw new Error(apiMessage);
  }
}

/**
 * Get recipes for a household
 * 
 * Endpoint: GET /api/v1/recipes/households/{household_id}/recipes
 * Requires: Authorization: Bearer <access_token>
 * 
 * @param householdId - The household ID
 * @param options - Optional pagination parameters
 * @returns Promise resolving to array of Recipe objects
 * @throws Error if request fails
 */
export async function getHouseholdRecipes(
  householdId: number,
  options?: { skip?: number; limit?: number }
): Promise<Recipe[]> {
  try {
    const params = new URLSearchParams();
    if (options?.skip !== undefined) {
      params.append('skip', String(options.skip));
    }
    if (options?.limit !== undefined) {
      params.append('limit', String(options.limit));
    }

    const queryString = params.toString();
    const url = `/api/v1/recipes/households/${householdId}/recipes${queryString ? `?${queryString}` : ''}`;

    const response = await httpClient.get<BackendResponse<Recipe[]>>(url);

    if (!response.data?.success) {
      throw new Error(response.data?.error?.message || 'Failed to load household recipes');
    }

    return response.data.data;
  } catch (error: any) {
    console.error('Get household recipes error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });

    const apiMessage =
      error.response?.data?.detail ||
      error.response?.data?.error?.message ||
      error.response?.data?.error ||
      error.message ||
      'Failed to load household recipes';

    throw new Error(apiMessage);
  }
}

/**
 * Get a single recipe by ID
 * 
 * Endpoint: GET /api/v1/recipes/{recipe_id}
 * Requires: Authorization: Bearer <access_token>
 * 
 * @param recipeId - The recipe ID
 * @returns Promise resolving to Recipe object
 * @throws Error if request fails
 */
export async function getRecipeById(recipeId: number): Promise<Recipe> {
  try {
    const response = await httpClient.get<BackendResponse<Recipe>>(
      `/api/v1/recipes/${recipeId}`
    );

    if (!response.data?.success) {
      throw new Error(response.data?.error?.message || 'Failed to get recipe');
    }

    return response.data.data;
  } catch (error: any) {
    console.error('Get recipe error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });

    const apiMessage =
      error.response?.data?.detail ||
      error.response?.data?.error?.message ||
      error.response?.data?.error ||
      error.message ||
      'Failed to get recipe';

    throw new Error(apiMessage);
  }
}

/**
 * Create a new recipe
 * 
 * Endpoint: POST /api/v1/recipes
 * Requires: Authorization: Bearer <access_token>
 * 
 * @param payload - Recipe creation data
 * @returns Promise resolving to created Recipe object
 * @throws Error if creation fails
 */
export async function createRecipe(payload: RecipeCreate): Promise<Recipe> {
  try {
    const response = await httpClient.post<BackendResponse<Recipe>>(
      '/api/v1/recipes',
      payload
    );

    if (!response.data?.success) {
      throw new Error(response.data?.error?.message || 'Failed to create recipe');
    }

    return response.data.data;
  } catch (error: any) {
    console.error('Create recipe error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });

    const apiMessage =
      error.response?.data?.detail ||
      error.response?.data?.error?.message ||
      error.response?.data?.error ||
      error.message ||
      'Failed to create recipe';

    throw new Error(apiMessage);
  }
}

/**
 * Update an existing recipe
 * 
 * Endpoint: PUT /api/v1/recipes/{recipe_id}
 * Requires: Authorization: Bearer <access_token>
 * 
 * @param recipeId - The recipe ID
 * @param payload - Recipe update data (all fields optional)
 * @returns Promise resolving to updated Recipe object
 * @throws Error if update fails
 */
export async function updateRecipe(
  recipeId: number,
  payload: RecipeUpdate
): Promise<Recipe> {
  try {
    const response = await httpClient.put<BackendResponse<Recipe>>(
      `/api/v1/recipes/${recipeId}`,
      payload
    );

    if (!response.data?.success) {
      throw new Error(response.data?.error?.message || 'Failed to update recipe');
    }

    return response.data.data;
  } catch (error: any) {
    console.error('Update recipe error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });

    const apiMessage =
      error.response?.data?.detail ||
      error.response?.data?.error?.message ||
      error.response?.data?.error ||
      error.message ||
      'Failed to update recipe';

    throw new Error(apiMessage);
  }
}

/**
 * Delete a recipe
 * 
 * Endpoint: DELETE /api/v1/recipes/{recipe_id}
 * Requires: Authorization: Bearer <access_token>
 * 
 * @param recipeId - The recipe ID
 * @returns Promise resolving to void
 * @throws Error if deletion fails
 */
export async function deleteRecipe(recipeId: number): Promise<void> {
  try {
    const response = await httpClient.delete<BackendResponse<void>>(
      `/api/v1/recipes/${recipeId}`
    );

    if (!response.data?.success) {
      throw new Error(response.data?.error?.message || 'Failed to delete recipe');
    }
  } catch (error: any) {
    console.error('Delete recipe error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });

    const apiMessage =
      error.response?.data?.detail ||
      error.response?.data?.error?.message ||
      error.response?.data?.error ||
      error.message ||
      'Failed to delete recipe';

    throw new Error(apiMessage);
  }
}

/**
 * Search recipes for a household
 * 
 * Endpoint: POST /api/v1/recipes/search?household_id={household_id}
 * Requires: Authorization: Bearer <access_token>
 * 
 * @param householdId - The household ID
 * @param params - Search parameters
 * @returns Promise resolving to array of Recipe objects
 * @throws Error if search fails
 */
export async function searchRecipes(
  householdId: number,
  params: RecipeSearchParams
): Promise<Recipe[]> {
  try {
    const response = await httpClient.post<BackendResponse<Recipe[]>>(
      `/api/v1/recipes/search?household_id=${householdId}`,
      params
    );

    if (!response.data?.success) {
      throw new Error(response.data?.error?.message || 'Failed to search recipes');
    }

    return response.data.data;
  } catch (error: any) {
    console.error('Search recipes error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });

    const apiMessage =
      error.response?.data?.detail ||
      error.response?.data?.error?.message ||
      error.response?.data?.error ||
      error.message ||
      'Failed to search recipes';

    throw new Error(apiMessage);
  }
}

