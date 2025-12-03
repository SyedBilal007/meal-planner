# Mock Data Implementation Summary

## Overview
Implemented a mock data layer for MealSync frontend to work without backend API calls. All pantry, meals, and grocery operations now use in-memory mock data instead of HTTP requests.

## Files Created

### 1. `src/mocks/pantry.ts`
- Mock pantry data with 5 sample ingredients
- Functions:
  - `mockGetPantry()` - Get all pantry items
  - `mockAddPantryItem()` - Add new ingredient
  - `mockUpdatePantryItem()` - Update existing ingredient
  - `mockDeletePantryItem()` - Delete ingredient
- Simulates network delay (200ms)
- Uses in-memory array storage

### 2. `src/mocks/meals.ts`
- Mock meals data with 3 sample meals
- Functions:
  - `mockGetMeals(weekStart)` - Get meals for a week, grouped by day
  - `mockAddMeal(day, meal, weekStart)` - Add meal to specific day
  - `mockUpdateMeal(id, updates)` - Update meal
  - `mockDeleteMeal(id)` - Delete meal
- Automatically groups meals by day of week
- Simulates network delay (200ms)

### 3. `src/mocks/index.ts`
- Central export file
- `USE_MOCK_DATA` flag (set to `true`) - Easy toggle to switch between mock and real API
- Re-exports all mock functions

## Files Modified

### 1. `src/components/Pantry.tsx`
- Updated to use mock data when `USE_MOCK_DATA = true`
- All CRUD operations (get, add, update, delete) use mock functions
- Falls back to real API when `USE_MOCK_DATA = false`
- No breaking changes to component interface

### 2. `src/components/MealPlanner.tsx`
- Updated to use mock data for fetching meals
- `addMeal()` uses `mockAddMeal()` when mock mode enabled
- `deleteMeal()` uses `mockDeleteMeal()` when mock mode enabled
- `fetchMeals()` uses `mockGetMeals()` when mock mode enabled
- Works without requiring `currentHousehold` in mock mode

## How It Works

### Toggle Between Mock and Real API

In `src/mocks/index.ts`:
```typescript
export const USE_MOCK_DATA = true;  // Set to false to use real API
```

### Example Usage in Components

```typescript
if (USE_MOCK_DATA) {
  const items = await mockGetPantry();
} else {
  const response = await pantryAPI.getAll();
  const items = response.data;
}
```

## Mock Data Structure

### Pantry Items
```typescript
{
  id: string;
  name: string;
  quantity?: string;
  unit?: string;
  created_at?: string;
  updated_at?: string;
}
```

### Meals
```typescript
{
  id: string;
  title: string;
  ingredients: string;  // Newline-separated
  date: Date;           // Internal use for day assignment
}
```

### Week Plan
```typescript
{
  Mon: Meal[];
  Tue: Meal[];
  Wed: Meal[];
  Thu: Meal[];
  Fri: Meal[];
  Sat: Meal[];
  Sun: Meal[];
}
```

## Sample Mock Data

### Pantry (5 items)
- Onion (2 pcs)
- Tomato (3 pcs)
- Milk (1 L)
- Chicken Breast (500 g)
- Rice (2 kg)

### Meals (3 items)
- Chicken Stir Fry (today, dinner)
- Pasta Carbonara (tomorrow, dinner)
- Omelette (today, breakfast)

## Benefits

✅ **No Backend Required** - App works completely offline
✅ **Fast Development** - No network delays during development
✅ **Easy Testing** - Predictable data for testing
✅ **Easy Switch** - One flag to toggle between mock and real API
✅ **Type Safe** - Same TypeScript types as real API
✅ **Realistic** - Simulates network delays

## Switching Back to Real API

1. Open `src/mocks/index.ts`
2. Change `USE_MOCK_DATA` to `false`
3. Uncomment real API code in components (marked with comments)
4. All components will automatically use real API calls

## Notes

- Mock data persists during session but resets on page reload
- All operations are async (simulating real API behavior)
- Network delays are simulated (200ms) for realistic feel
- Grocery list generation still works (uses existing utility functions with meal data)

