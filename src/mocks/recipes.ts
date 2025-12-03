export type RecipeIngredient = {
  name: string;
  quantity: number;
  unit: string;
};

export type Recipe = {
  id: number;
  title: string;
  description?: string;
  ingredients: RecipeIngredient[];
  instructions?: string;
  cuisineType?: string;
  rating?: number; // 1-5, optional
};

let recipes: Recipe[] = [
  {
    id: 1,
    title: 'Chicken Biryani',
    description: 'Aromatic basmati rice cooked with tender chicken and fragrant spices',
    cuisineType: 'Indian',
    rating: 5,
    ingredients: [
      { name: 'Chicken', quantity: 500, unit: 'g' },
      { name: 'Basmati Rice', quantity: 2, unit: 'cups' },
      { name: 'Onion', quantity: 2, unit: 'pcs' },
      { name: 'Tomato', quantity: 2, unit: 'pcs' },
      { name: 'Ginger Garlic Paste', quantity: 2, unit: 'tbsp' },
      { name: 'Yogurt', quantity: 1, unit: 'cup' },
      { name: 'Biryani Masala', quantity: 2, unit: 'tbsp' },
    ],
    instructions: '1. Marinate chicken with yogurt and spices for 30 minutes\n2. Cook rice until 70% done\n3. Layer chicken and rice in a pot\n4. Cook on dum (steam) for 20 minutes\n5. Serve hot with raita',
  },
  {
    id: 2,
    title: 'Pasta Carbonara',
    description: 'Classic Italian pasta with eggs, cheese, and pancetta',
    cuisineType: 'Italian',
    rating: 4,
    ingredients: [
      { name: 'Pasta', quantity: 400, unit: 'g' },
      { name: 'Eggs', quantity: 3, unit: 'pcs' },
      { name: 'Parmesan Cheese', quantity: 100, unit: 'g' },
      { name: 'Pancetta', quantity: 150, unit: 'g' },
      { name: 'Black Pepper', quantity: 1, unit: 'tsp' },
    ],
    instructions: '1. Cook pasta al dente\n2. Fry pancetta until crispy\n3. Mix eggs and cheese in a bowl\n4. Toss hot pasta with pancetta\n5. Add egg mixture off heat, stirring quickly\n6. Season with black pepper',
  },
  {
    id: 3,
    title: 'Vegetable Stir Fry',
    description: 'Quick and healthy mix of fresh vegetables',
    cuisineType: 'Asian',
    rating: 4,
    ingredients: [
      { name: 'Bell Peppers', quantity: 2, unit: 'pcs' },
      { name: 'Broccoli', quantity: 200, unit: 'g' },
      { name: 'Carrots', quantity: 2, unit: 'pcs' },
      { name: 'Soy Sauce', quantity: 2, unit: 'tbsp' },
      { name: 'Garlic', quantity: 3, unit: 'cloves' },
      { name: 'Ginger', quantity: 1, unit: 'inch' },
    ],
    instructions: '1. Cut vegetables into bite-sized pieces\n2. Heat oil in a wok\n3. Add garlic and ginger, stir for 30 seconds\n4. Add vegetables and stir fry for 5 minutes\n5. Add soy sauce and cook for 2 more minutes\n6. Serve hot',
  },
];

let nextRecipeId = 4;

// Simulate network delay
const delay = (ms: number = 200) => new Promise((resolve) => setTimeout(resolve, ms));

export async function mockGetRecipes(): Promise<Recipe[]> {
  await delay(200);
  return [...recipes];
}

export async function mockGetRecipeById(id: number): Promise<Recipe | null> {
  await delay(200);
  return recipes.find(r => r.id === id) || null;
}

export async function mockCreateRecipe(
  data: Omit<Recipe, 'id'>
): Promise<Recipe> {
  await delay(200);
  const newRecipe: Recipe = {
    id: nextRecipeId++,
    ...data,
  };
  recipes.push(newRecipe);
  return newRecipe;
}

export async function mockUpdateRecipe(
  id: number,
  updates: Partial<Omit<Recipe, 'id'>>
): Promise<Recipe | null> {
  await delay(200);
  const index = recipes.findIndex((r) => r.id === id);
  if (index === -1) return null;
  recipes[index] = { ...recipes[index], ...updates };
  return recipes[index];
}

export async function mockDeleteRecipe(id: number): Promise<void> {
  await delay(200);
  recipes = recipes.filter((r) => r.id !== id);
}

export async function mockSearchRecipes(query: string): Promise<Recipe[]> {
  await delay(200);
  const lowerQuery = query.toLowerCase().trim();
  if (!lowerQuery) return [...recipes];
  
  return recipes.filter(recipe => {
    // Search in title
    if (recipe.title.toLowerCase().includes(lowerQuery)) return true;
    
    // Search in description
    if (recipe.description?.toLowerCase().includes(lowerQuery)) return true;
    
    // Search in cuisine type
    if (recipe.cuisineType?.toLowerCase().includes(lowerQuery)) return true;
    
    // Search in ingredient names
    if (recipe.ingredients.some(ing => ing.name.toLowerCase().includes(lowerQuery))) return true;
    
    return false;
  });
}

