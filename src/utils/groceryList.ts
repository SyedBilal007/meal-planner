export type Meal = {
  id: string;
  title: string;
  ingredients: string;
};

export type WeekPlan = Record<'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun', Meal[]>;

export type GroceryItem = {
  id: string;
  name: string;
  qty: number;
  unit?: string;
};

export type GroceryCategory = {
  name: string;
  keywords: string[];
  color: string;
  icon: string;
};

export type CategorizedGroceryList = {
  [categoryName: string]: {
    items: GroceryItem[];
    category: GroceryCategory;
  };
};

// Category definitions with keywords and styling
export const groceryCategories: GroceryCategory[] = [
  {
    name: 'Produce',
    keywords: ['tomato', 'onion', 'potato', 'garlic', 'lemon', 'chilli', 'spinach', 'cucumber', 'pepper', 'carrot', 'lettuce', 'cabbage', 'ginger', 'coriander', 'mint', 'basil', 'parsley', 'avocado'],
    color: 'green',
    icon: '🥬'
  },
  {
    name: 'Dairy',
    keywords: ['milk', 'yogurt', 'cheese', 'butter', 'cream', 'curd', 'ghee', 'dairy'],
    color: 'blue',
    icon: '🥛'
  },
  {
    name: 'Pantry',
    keywords: ['rice', 'flour', 'pasta', 'salt', 'sugar', 'oil', 'spices', 'masala', 'cumin', 'turmeric', 'chili', 'pepper', 'oregano', 'basil', 'ginger-garlic', 'tamarind', 'vinegar', 'soy', 'sauce'],
    color: 'amber',
    icon: '🫙'
  },
  {
    name: 'Protein',
    keywords: ['chicken', 'beef', 'mutton', 'egg', 'fish', 'lentil', 'chickpea', 'dal', 'moong', 'chana', 'rajma', 'soy', 'tofu', 'meat', 'poultry', 'seafood'],
    color: 'red',
    icon: '🥩'
  },
  {
    name: 'Bakery',
    keywords: ['bread', 'bun', 'wrap', 'naan', 'roti', 'tortilla', 'bagel', 'croissant', 'muffin'],
    color: 'orange',
    icon: '🥖'
  },
  {
    name: 'Beverages',
    keywords: ['tea', 'coffee', 'juice', 'water', 'soda', 'drink', 'beverage'],
    color: 'purple',
    icon: '☕'
  }
];

/**
 * Parses ingredient text and returns an array of grocery items
 * @param text - Raw ingredient text with line breaks
 * @returns Array of parsed grocery items sorted by name
 */
export const parseIngredients = (text: string): GroceryItem[] => {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const itemMap = new Map<string, GroceryItem>();

  lines.forEach(line => {
    // Check if line starts with a number (including decimals)
    const numericMatch = line.match(/^(\d+(?:\.\d+)?)\s+(\w+)\s+(.+)$/);
    
    if (numericMatch) {
      const [, qtyStr, unit, name] = numericMatch;
      const qty = parseFloat(qtyStr);
      const cleanName = name.trim().toLowerCase();
      const key = `${cleanName}|${unit.toLowerCase()}`;
      
      if (itemMap.has(key)) {
        itemMap.get(key)!.qty += qty;
      } else {
        itemMap.set(key, {
          id: key,
          name: cleanName,
          qty,
          unit: unit
        });
      }
    } else {
      // Check for number without unit
      const numberOnlyMatch = line.match(/^(\d+(?:\.\d+)?)\s+(.+)$/);
      if (numberOnlyMatch) {
        const [, qtyStr, name] = numberOnlyMatch;
        const qty = parseFloat(qtyStr);
        const cleanName = name.trim().toLowerCase();
        
        if (itemMap.has(cleanName)) {
          itemMap.get(cleanName)!.qty += qty;
        } else {
          itemMap.set(cleanName, {
            id: cleanName,
            name: cleanName,
            qty
          });
        }
      } else {
        // Non-numeric line - just count occurrences
        const cleanName = line.toLowerCase();
        if (itemMap.has(cleanName)) {
          itemMap.get(cleanName)!.qty += 1;
        } else {
          itemMap.set(cleanName, {
            id: cleanName,
            name: cleanName,
            qty: 1
          });
        }
      }
    }
  });

  return Array.from(itemMap.values()).sort((a, b) => a.name.localeCompare(b.name));
};

/**
 * Generates a grocery list from a weekly meal plan
 * @param plan - Weekly meal plan object
 * @returns Array of grocery items with merged quantities
 */
export const generateGroceryList = (plan: WeekPlan): GroceryItem[] => {
  const allIngredients = Object.values(plan)
    .flatMap(meals => meals.map(meal => meal.ingredients))
    .join('\n');
  
  return parseIngredients(allIngredients);
};

/**
 * Categorizes grocery items based on keyword matching
 * @param items - Array of grocery items
 * @returns Object with categorized items
 */
export const categorizeGroceryItems = (items: GroceryItem[]): CategorizedGroceryList => {
  const categorized: CategorizedGroceryList = {};
  const otherItems: GroceryItem[] = [];

  // Initialize categories
  groceryCategories.forEach(category => {
    categorized[category.name] = {
      items: [],
      category
    };
  });

  items.forEach(item => {
    let categorized_item = false;
    const itemName = item.name.toLowerCase();

    // Check each category for keyword matches
    for (const category of groceryCategories) {
      const hasKeyword = category.keywords.some(keyword => 
        itemName.includes(keyword.toLowerCase())
      );

      if (hasKeyword) {
        categorized[category.name].items.push(item);
        categorized_item = true;
        break;
      }
    }

    // If no category matched, add to "Other"
    if (!categorized_item) {
      otherItems.push(item);
    }
  });

  // Add "Other" category if there are uncategorized items
  if (otherItems.length > 0) {
    categorized['Other'] = {
      items: otherItems.sort((a, b) => a.name.localeCompare(b.name)),
      category: {
        name: 'Other',
        keywords: [],
        color: 'gray',
        icon: '📦'
      }
    };
  }

  // Sort items within each category by name
  Object.values(categorized).forEach(categoryData => {
    categoryData.items.sort((a, b) => a.name.localeCompare(b.name));
  });

  return categorized;
};

/**
 * Generates categorized grocery list from weekly meal plan
 * @param plan - Weekly meal plan object
 * @returns Categorized grocery items
 */
export const generateCategorizedGroceryList = (plan: WeekPlan): CategorizedGroceryList => {
  const groceryList = generateGroceryList(plan);
  return categorizeGroceryItems(groceryList);
};

/**
 * Downloads text content as a file
 * @param filename - Name of the file to download
 * @param content - Text content to download
 */
export const downloadText = (filename: string, content: string) => {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
