import type { WeekPlan } from './groceryList';

export interface BackendMeal {
  id: string;
  name: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  date: string;
  time?: string;
  assignedToId?: string;
  householdId: string;
  recipeId?: string;
  assignedTo?: {
    id: string;
    name: string;
    email: string;
  };
  recipe?: {
    id: string;
    name: string;
  };
}

export const getWeekStart = (date: Date = new Date()): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
  return new Date(d.setDate(diff));
};

export const getDayOfWeek = (date: Date): 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun' => {
  const day = date.getDay();
  const dayMap: { [key: number]: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun' } = {
    1: 'Mon',
    2: 'Tue',
    3: 'Wed',
    4: 'Thu',
    5: 'Fri',
    6: 'Sat',
    0: 'Sun',
  };
  return dayMap[day] || 'Mon';
};

export const convertMealsToWeekPlan = (
  meals: BackendMeal[],
  weekStart: Date
): WeekPlan => {
  const weekPlan: WeekPlan = {
    Mon: [],
    Tue: [],
    Wed: [],
    Thu: [],
    Fri: [],
    Sat: [],
    Sun: [],
  };

  meals.forEach((meal) => {
    const mealDate = new Date(meal.date);
    const dayOfWeek = getDayOfWeek(mealDate);
    
    // Check if meal is in the current week
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    if (mealDate >= weekStart && mealDate <= weekEnd) {
      weekPlan[dayOfWeek].push({
        id: meal.id,
        title: meal.name,
        ingredients: '', // Backend meals don't have ingredients directly, they're in recipes
      });
    }
  });

  return weekPlan;
};

export const getWeekDateRange = (weekStart: Date): { start: string; end: string } => {
  const start = new Date(weekStart);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(weekStart);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
};

