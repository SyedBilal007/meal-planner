import { httpClient, type BackendResponse } from './httpClient';

/**
 * Ingredient category enum matching backend schema
 */
export type IngredientCategory =
  | "produce"
  | "meat"
  | "seafood"
  | "dairy"
  | "bakery"
  | "pantry"
  | "spices"
  | "beverages"
  | "frozen"
  | "snacks"
  | "other";

/**
 * Unit of measurement enum matching backend schema
 */
export type UnitOfMeasurement =
  | "gram"
  | "kilogram"
  | "milliliter"
  | "liter"
  | "piece"
  | "pack"
  | "teaspoon"
  | "tablespoon"
  | "cup"
  | "ounce"
  | "pound";

/**
 * Ingredient object returned from the API
 */
export type Ingredient = {
  id: number;
  uuid: string;
  name: string;
  category: IngredientCategory;
  description: string | null;
  average_price: number | null;
  price_unit: UnitOfMeasurement;
  household_id: number;
  created_at: string;
  updated_at: string;
};

/**
 * Create ingredient payload
 */
export type IngredientCreate = {
  name: string;
  category: IngredientCategory;
  description?: string;
  average_price?: number;
  price_unit: UnitOfMeasurement;
  household_id: number;
};

/**
 * Update ingredient payload (all fields optional except household_id is omitted)
 */
export type IngredientUpdate = Partial<Omit<IngredientCreate, "household_id">>;

/**
 * Search parameters for ingredients
 */
export type IngredientSearchParams = {
  query?: string;
  category?: IngredientCategory | null;
  skip?: number;
  limit?: number;
};

/**
 * Get all ingredients for a household
 * 
 * Endpoint: GET /api/v1/households/{household_id}/ingredients
 * Requires: Authorization: Bearer <access_token>
 * 
 * @param householdId - The household ID
 * @param options - Optional pagination parameters
 * @returns Promise resolving to array of Ingredient objects
 * @throws Error if request fails
 */
export async function getHouseholdIngredients(
  householdId: number,
  options?: { skip?: number; limit?: number }
): Promise<Ingredient[]> {
  try {
    const params = new URLSearchParams();
    if (options?.skip !== undefined) {
      params.append('skip', String(options.skip));
    }
    if (options?.limit !== undefined) {
      params.append('limit', String(options.limit));
    }

    const queryString = params.toString();
    const url = `/api/v1/households/${householdId}/ingredients${queryString ? `?${queryString}` : ''}`;

    const response = await httpClient.get<BackendResponse<Ingredient[]>>(url);

    if (!response.data?.success) {
      throw new Error(response.data?.error?.message || 'Failed to load ingredients');
    }

    return response.data.data;
  } catch (error: any) {
    console.error('Get household ingredients error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });

    const apiMessage =
      error.response?.data?.detail ||
      error.response?.data?.error?.message ||
      error.response?.data?.error ||
      error.message ||
      'Failed to load ingredients';

    throw new Error(apiMessage);
  }
}

/**
 * Get a single ingredient by ID
 * 
 * Endpoint: GET /api/v1/ingredients/{ingredient_id}
 * Requires: Authorization: Bearer <access_token>
 * 
 * @param ingredientId - The ingredient ID
 * @returns Promise resolving to Ingredient object
 * @throws Error if request fails
 */
export async function getIngredient(ingredientId: number): Promise<Ingredient> {
  try {
    const response = await httpClient.get<BackendResponse<Ingredient>>(
      `/api/v1/ingredients/${ingredientId}`
    );

    if (!response.data?.success) {
      throw new Error(response.data?.error?.message || 'Failed to get ingredient');
    }

    return response.data.data;
  } catch (error: any) {
    console.error('Get ingredient error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });

    const apiMessage =
      error.response?.data?.detail ||
      error.response?.data?.error?.message ||
      error.response?.data?.error ||
      error.message ||
      'Failed to get ingredient';

    throw new Error(apiMessage);
  }
}

/**
 * Create a new ingredient for a household
 * 
 * Endpoint: POST /api/v1/households/{household_id}/ingredients
 * Requires: Authorization: Bearer <access_token>
 * 
 * @param householdId - The household ID
 * @param payload - Ingredient creation data (without household_id)
 * @returns Promise resolving to created Ingredient object
 * @throws Error if creation fails
 */
export async function createIngredient(
  householdId: number,
  payload: Omit<IngredientCreate, "household_id">
): Promise<Ingredient> {
  try {
    const fullPayload: IngredientCreate = {
      ...payload,
      household_id: householdId,
    };

    const response = await httpClient.post<BackendResponse<Ingredient>>(
      `/api/v1/households/${householdId}/ingredients`,
      fullPayload
    );

    if (!response.data?.success) {
      throw new Error(response.data?.error?.message || 'Failed to create ingredient');
    }

    return response.data.data;
  } catch (error: any) {
    console.error('Create ingredient error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });

    const apiMessage =
      error.response?.data?.detail ||
      error.response?.data?.error?.message ||
      error.response?.data?.error ||
      error.message ||
      'Failed to create ingredient';

    throw new Error(apiMessage);
  }
}

/**
 * Update an existing ingredient
 * 
 * Endpoint: PUT /api/v1/ingredients/{ingredient_id}
 * Requires: Authorization: Bearer <access_token>
 * 
 * @param ingredientId - The ingredient ID
 * @param payload - Ingredient update data (all fields optional)
 * @returns Promise resolving to updated Ingredient object
 * @throws Error if update fails
 */
export async function updateIngredient(
  ingredientId: number,
  payload: IngredientUpdate
): Promise<Ingredient> {
  try {
    const response = await httpClient.put<BackendResponse<Ingredient>>(
      `/api/v1/ingredients/${ingredientId}`,
      payload
    );

    if (!response.data?.success) {
      throw new Error(response.data?.error?.message || 'Failed to update ingredient');
    }

    return response.data.data;
  } catch (error: any) {
    console.error('Update ingredient error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });

    const apiMessage =
      error.response?.data?.detail ||
      error.response?.data?.error?.message ||
      error.response?.data?.error ||
      error.message ||
      'Failed to update ingredient';

    throw new Error(apiMessage);
  }
}

/**
 * Delete an ingredient
 * 
 * Endpoint: DELETE /api/v1/ingredients/{ingredient_id}
 * Requires: Authorization: Bearer <access_token>
 * 
 * @param ingredientId - The ingredient ID
 * @returns Promise resolving to void
 * @throws Error if deletion fails
 */
export async function deleteIngredient(ingredientId: number): Promise<void> {
  try {
    const response = await httpClient.delete<BackendResponse<void>>(
      `/api/v1/ingredients/${ingredientId}`
    );

    if (!response.data?.success) {
      throw new Error(response.data?.error?.message || 'Failed to delete ingredient');
    }
  } catch (error: any) {
    console.error('Delete ingredient error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });

    const apiMessage =
      error.response?.data?.detail ||
      error.response?.data?.error?.message ||
      error.response?.data?.error ||
      error.message ||
      'Failed to delete ingredient';

    throw new Error(apiMessage);
  }
}

/**
 * Search ingredients for a household
 * 
 * Endpoint: GET /api/v1/households/{household_id}/ingredients/search
 * Requires: Authorization: Bearer <access_token>
 * 
 * @param householdId - The household ID
 * @param params - Search parameters (query, category, skip, limit)
 * @returns Promise resolving to array of Ingredient objects
 * @throws Error if search fails
 */
export async function searchIngredients(
  householdId: number,
  params: IngredientSearchParams
): Promise<Ingredient[]> {
  try {
    const searchParams = new URLSearchParams();
    
    if (params.query !== undefined && params.query.trim().length > 0) {
      searchParams.append('query', params.query.trim());
    }
    if (params.category !== undefined && params.category !== null) {
      searchParams.append('category', params.category);
    }
    if (params.skip !== undefined) {
      searchParams.append('skip', String(params.skip));
    }
    if (params.limit !== undefined) {
      searchParams.append('limit', String(params.limit));
    }

    const queryString = searchParams.toString();
    const url = `/api/v1/households/${householdId}/ingredients/search${queryString ? `?${queryString}` : ''}`;

    const response = await httpClient.get<BackendResponse<Ingredient[]>>(url);

    if (!response.data?.success) {
      throw new Error(response.data?.error?.message || 'Failed to search ingredients');
    }

    return response.data.data;
  } catch (error: any) {
    console.error('Search ingredients error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });

    const apiMessage =
      error.response?.data?.detail ||
      error.response?.data?.error?.message ||
      error.response?.data?.error ||
      error.message ||
      'Failed to search ingredients';

    throw new Error(apiMessage);
  }
}

/**
 * Helper function to map common unit strings to UnitOfMeasurement enum
 */
export function mapUnitToEnum(unit: string): UnitOfMeasurement {
  const normalized = unit.toLowerCase().trim();
  
  const unitMap: Record<string, UnitOfMeasurement> = {
    'g': 'gram',
    'gram': 'gram',
    'grams': 'gram',
    'kg': 'kilogram',
    'kilogram': 'kilogram',
    'kilograms': 'kilogram',
    'ml': 'milliliter',
    'milliliter': 'milliliter',
    'milliliters': 'milliliter',
    'l': 'liter',
    'liter': 'liter',
    'liters': 'liter',
    'litre': 'liter',
    'litres': 'liter',
    'pcs': 'piece',
    'pc': 'piece',
    'piece': 'piece',
    'pieces': 'piece',
    'pack': 'pack',
    'packs': 'pack',
    'tsp': 'teaspoon',
    'teaspoon': 'teaspoon',
    'teaspoons': 'teaspoon',
    'tbsp': 'tablespoon',
    'tablespoon': 'tablespoon',
    'tablespoons': 'tablespoon',
    'cup': 'cup',
    'cups': 'cup',
    'oz': 'ounce',
    'ounce': 'ounce',
    'ounces': 'ounce',
    'lb': 'pound',
    'lbs': 'pound',
    'pound': 'pound',
    'pounds': 'pound',
  };

  return unitMap[normalized] || 'piece'; // Default to 'piece' if not found
}

