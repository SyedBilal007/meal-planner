export type Meal = {
  id: number;
  title: string;
  date: string; // ISO string or yyyy-mm-dd
  timeSlot?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  assignedTo?: string; // Name of person assigned
  notes?: string;
};

let meals: Meal[] = [
  { id: 1, title: 'Sunday Biryani', date: '2025-12-07', timeSlot: 'dinner', assignedTo: 'Bilal' },
  { id: 2, title: 'Pasta Night', date: '2025-12-08', timeSlot: 'dinner' },
];

let nextMealId = 3;

// Simulate network delay
const delay = (ms: number = 200) => new Promise((resolve) => setTimeout(resolve, ms));

export async function mockGetMeals(): Promise<Meal[]> {
  await delay(200);
  return [...meals];
}

export async function mockAddMeal(
  meal: Omit<Meal, 'id'>
): Promise<Meal> {
  await delay(200);
  const newMeal: Meal = { id: nextMealId++, ...meal };
  meals.push(newMeal);
  return newMeal;
}

export async function mockUpdateMeal(
  id: number,
  updates: Partial<Omit<Meal, 'id'>>
): Promise<Meal | null> {
  await delay(200);
  const index = meals.findIndex((m) => m.id === id);
  if (index === -1) return null;
  meals[index] = { ...meals[index], ...updates };
  return meals[index];
}

export async function mockDeleteMeal(id: number): Promise<void> {
  await delay(200);
  meals = meals.filter((m) => m.id !== id);
}
