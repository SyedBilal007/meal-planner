import type { Meal } from './meals';
import { parseIngredients } from '../utils/groceryList';

export type GroceryItem = {
  id: number;
  name: string;
  quantity: number;
  unit: string;
  bought?: boolean;
};

let grocery: GroceryItem[] = [];
let nextGroceryId = 1;

// Simulate network delay
const delay = (ms: number = 200) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Builds a grocery list from meals by parsing ingredients
 * Consolidates duplicate ingredients by name + unit
 */
export function buildGroceryListFromMeals(meals: Meal[]): GroceryItem[] {
  // Collect all ingredient text from meals
  const allIngredients = meals
    .map(meal => meal.notes || '')
    .filter(text => text.trim().length > 0)
    .join('\n');

  if (!allIngredients.trim()) {
    return [];
  }

  // Parse ingredients using existing utility
  const parsedItems = parseIngredients(allIngredients);
  
  // Convert to GroceryItem format with numeric quantity
  const groceryItems: GroceryItem[] = parsedItems.map((item) => ({
    id: nextGroceryId++,
    name: item.name,
    quantity: item.qty,
    unit: item.unit || '',
    bought: false,
  }));

  return groceryItems;
}

export async function mockGetGrocery(): Promise<GroceryItem[]> {
  await delay(200);
  return [...grocery];
}

export async function mockGenerateGroceryFromMeals(meals: Meal[]): Promise<GroceryItem[]> {
  await delay(200);
  const newItems = buildGroceryListFromMeals(meals);
  
  // Merge with existing items, avoiding duplicates
  newItems.forEach(newItem => {
    const existingIndex = grocery.findIndex(
      item => item.name.toLowerCase() === newItem.name.toLowerCase() && 
              item.unit === newItem.unit
    );
    
    if (existingIndex >= 0) {
      // Update quantity if item exists
      grocery[existingIndex].quantity += newItem.quantity;
    } else {
      // Add new item
      grocery.push(newItem);
    }
  });
  
  return [...grocery];
}

export async function mockToggleGroceryBought(
  id: number
): Promise<GroceryItem | null> {
  await delay(200);
  const index = grocery.findIndex((g) => g.id === id);
  if (index === -1) return null;
  grocery[index].bought = !grocery[index].bought;
  return grocery[index];
}

export async function mockAddGroceryItem(
  item: Omit<GroceryItem, 'id'>
): Promise<GroceryItem> {
  await delay(200);
  const newItem: GroceryItem = {
    id: nextGroceryId++,
    ...item,
    bought: item.bought || false,
  };
  grocery.push(newItem);
  return newItem;
}

export async function mockUpdateGroceryItem(
  id: number,
  updates: Partial<Omit<GroceryItem, 'id'>>
): Promise<GroceryItem | null> {
  await delay(200);
  const index = grocery.findIndex((g) => g.id === id);
  if (index === -1) return null;
  grocery[index] = { ...grocery[index], ...updates };
  return grocery[index];
}

export async function mockDeleteGroceryItem(id: number): Promise<void> {
  await delay(200);
  grocery = grocery.filter((g) => g.id !== id);
}

