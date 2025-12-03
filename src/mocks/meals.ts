export type MealComment = {
  id: number;
  author: string; // simple string, e.g. "Bilal"
  text: string;
  createdAt: string; // ISO date string
};

export type Meal = {
  id: number;
  title: string;
  date: string; // ISO string or yyyy-mm-dd
  timeSlot?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  assignedTo?: string; // Name of person assigned
  notes?: string; // Ingredients text (one per line)
  recipeId?: number; // Link to recipe in recipe library
  comments?: MealComment[];
  claimedBy?: string; // name of the person who claimed this meal
};

let meals: Meal[] = [
  { id: 1, title: 'Sunday Biryani', date: '2025-12-07', timeSlot: 'dinner', assignedTo: 'Bilal', comments: [], claimedBy: undefined },
  { id: 2, title: 'Pasta Night', date: '2025-12-08', timeSlot: 'dinner', comments: [], claimedBy: undefined },
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

let nextCommentId = 1;

export async function mockAddMealComment(
  mealId: number,
  comment: { author: string; text: string }
): Promise<Meal | null> {
  await delay(200);
  const index = meals.findIndex((m) => m.id === mealId);
  if (index === -1) return null;
  
  const meal = meals[index];
  const newComment: MealComment = {
    id: nextCommentId++,
    author: comment.author,
    text: comment.text,
    createdAt: new Date().toISOString(),
  };
  
  const updatedComments = [...(meal.comments || []), newComment];
  meals[index] = {
    ...meal,
    comments: updatedComments,
  };
  
  return meals[index];
}

export async function mockDeleteMealComment(
  mealId: number,
  commentId: number
): Promise<Meal | null> {
  await delay(200);
  const index = meals.findIndex((m) => m.id === mealId);
  if (index === -1) return null;
  
  const meal = meals[index];
  const updatedComments = (meal.comments || []).filter(c => c.id !== commentId);
  meals[index] = {
    ...meal,
    comments: updatedComments,
  };
  
  return meals[index];
}

export async function mockClaimMeal(
  mealId: number,
  claimerName: string
): Promise<Meal | null> {
  await delay(200);
  const index = meals.findIndex((m) => m.id === mealId);
  if (index === -1) return null;
  
  meals[index] = {
    ...meals[index],
    claimedBy: claimerName,
  };
  
  return meals[index];
}
