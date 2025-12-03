import axios from 'axios';

// FastAPI backend URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://mealsync.up.railway.app';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Household API
export const householdAPI = {
  create: (data: { name: string }) => api.post('/households', data),
  getAll: () => api.get('/households'),
  getById: (id: string) => api.get(`/households/${id}`),
  join: (data: { inviteCode: string }) => api.post('/households/join', data),
  leave: (id: string) => api.delete(`/households/${id}/leave`),
};

// Meal API
export const mealAPI = {
  getAll: (params: { householdId: string; startDate?: string; endDate?: string }) =>
    api.get('/meals', { params }),
  create: (data: {
    name: string;
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    date: string;
    time?: string;
    assignedToId?: string;
    householdId: string;
    recipeId?: string;
  }) => api.post('/meals', data),
  update: (id: string, data: Partial<{
    name: string;
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    date: string;
    time?: string;
    assignedToId?: string;
    recipeId?: string;
  }>) => api.put(`/meals/${id}`, data),
  delete: (id: string) => api.delete(`/meals/${id}`),
};

// Recipe API
export const recipeAPI = {
  getAll: () => api.get('/recipes'),
  getById: (id: string) => api.get(`/recipes/${id}`),
  create: (data: {
    name: string;
    instructions?: string;
    servings?: number;
    cookingTime?: number;
    ingredients?: Array<{ name: string; quantity?: string; unit?: string }>;
  }) => api.post('/recipes', data),
  update: (id: string, data: Partial<{
    name: string;
    instructions?: string;
    servings?: number;
    cookingTime?: number;
  }>) => api.put(`/recipes/${id}`, data),
  delete: (id: string) => api.delete(`/recipes/${id}`),
};

// Grocery API
export const groceryAPI = {
  generate: (data: {
    householdId: string;
    dateRangeStart: string;
    dateRangeEnd: string;
  }) => api.post('/grocery/generate', data),
  getAll: (params: { householdId: string }) =>
    api.get('/grocery', { params }),
  toggleItem: (id: string) => api.patch(`/grocery/items/${id}/toggle`),
};

// Share API
export const shareAPI = {
  create: (data: { householdId: string; expiresInDays?: number }) =>
    api.post('/share', data),
  getByToken: (token: string) => api.get(`/share/${token}`),
  deactivate: (token: string) => api.delete(`/share/${token}`),
};

// AI API
export const aiAPI = {
  generateMeals: (data: { ingredients: string[] }) =>
    api.post('/ai/generate-meals', data),
};

// Pantry API - FastAPI endpoints
export const pantryAPI = {
  getAll: () => api.get('/api/v1/pantry'),
  create: (data: { name: string; quantity?: string; unit?: string }) =>
    api.post('/api/v1/pantry', data),
  update: (id: string, data: { name?: string; quantity?: string; unit?: string }) =>
    api.patch(`/api/v1/pantry/${id}`, data),
  delete: (id: string) => api.delete(`/api/v1/pantry/${id}`),
};
