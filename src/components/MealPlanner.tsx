import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Calendar, RotateCcw, Copy, Download, ShoppingCart, BookOpen, X, ChevronDown, ChevronRight } from 'lucide-react';
import type { Meal, WeekPlan } from '../utils/groceryList';
import { generateGroceryList, generateCategorizedGroceryList, downloadText } from '../utils/groceryList';

const days: (keyof WeekPlan)[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const dayNames = {
  Mon: 'Monday',
  Tue: 'Tuesday', 
  Wed: 'Wednesday',
  Thu: 'Thursday',
  Fri: 'Friday',
  Sat: 'Saturday',
  Sun: 'Sunday'
};

const recipePresets = [
  {
    id: 'chicken-biryani',
    title: 'Chicken Biryani',
    ingredients: `2 kg chicken pieces
3 cups basmati rice
2 large onions
1 cup yogurt
4 tbsp biryani masala
2 tbsp ginger-garlic paste
1 tsp turmeric powder
1 tsp red chili powder
4 tbsp oil
Salt to taste
Fresh coriander leaves
Mint leaves`
  },
  {
    id: 'daal-tarka',
    title: 'Daal Tarka',
    ingredients: `1 cup yellow lentils (moong dal)
1 large onion
2 tomatoes
3 cloves garlic
1 inch ginger
1 tsp cumin seeds
1 tsp turmeric powder
1 tsp red chili powder
2 tbsp oil
Salt to taste
Fresh coriander leaves
1 green chili`
  },
  {
    id: 'veg-pasta',
    title: 'Veg Pasta',
    ingredients: `500 g pasta
2 bell peppers
1 large onion
2 tomatoes
3 cloves garlic
2 tbsp olive oil
1 tsp oregano
1 tsp basil
1 cup grated cheese
Salt to taste
Black pepper
Fresh basil leaves`
  },
  {
    id: 'omelette-wrap',
    title: 'Omelette Wrap',
    ingredients: `4 eggs
2 tortillas
1 bell pepper
1 onion
1 tomato
2 tbsp oil
1 tsp salt
1 tsp black pepper
1 cup grated cheese
Fresh herbs (optional)`
  },
  {
    id: 'grilled-chicken-salad',
    title: 'Grilled Chicken Salad',
    ingredients: `500 g chicken breast
2 cups mixed greens
1 cucumber
2 tomatoes
1 avocado
1 red onion
2 tbsp olive oil
1 tbsp lemon juice
1 tsp salt
1 tsp black pepper
Fresh herbs`
  },
  {
    id: 'aloo-paratha',
    title: 'Aloo Paratha',
    ingredients: `3 cups whole wheat flour
4 large potatoes
1 onion
2 green chilies
1 tsp cumin seeds
1 tsp turmeric powder
1 tsp red chili powder
2 tbsp oil
Salt to taste
Fresh coriander leaves
Butter for serving`
  }
];


const STORAGE_KEY = 'meal-plan-v1';

export default function MealPlanner() {
  const [selectedDay, setSelectedDay] = useState<keyof WeekPlan>('Mon');
  const [weekPlan, setWeekPlan] = useState<WeekPlan>({
    Mon: [],
    Tue: [],
    Wed: [],
    Thu: [],
    Fri: [],
    Sat: [],
    Sun: [],
  });
  const [newMealTitle, setNewMealTitle] = useState('');
  const [newMealIngredients, setNewMealIngredients] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showPresetsModal, setShowPresetsModal] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [copyByCategory, setCopyByCategory] = useState(false);

  // Load data from localStorage on mount
  useEffect(() => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        const parsedData = JSON.parse(savedData) as WeekPlan;
        setWeekPlan(parsedData);
      }
    } catch (error) {
      console.error('Failed to load meal plan from localStorage:', error);
    }
  }, []);

  // Save data to localStorage whenever weekPlan changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(weekPlan));
    } catch (error) {
      console.error('Failed to save meal plan to localStorage:', error);
    }
  }, [weekPlan]);

  // Handle keyboard accessibility for modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showPresetsModal) {
        setShowPresetsModal(false);
      }
    };

    if (showPresetsModal) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [showPresetsModal]);

  const addMeal = () => {
    if (!newMealTitle.trim()) return;

    const newMeal: Meal = {
      id: Date.now().toString(),
      title: newMealTitle.trim(),
      ingredients: newMealIngredients.trim(),
    };

    setWeekPlan(prev => ({
      ...prev,
      [selectedDay]: [...prev[selectedDay], newMeal],
    }));

    setNewMealTitle('');
    setNewMealIngredients('');
  };

  const deleteMeal = (mealId: string) => {
    setWeekPlan(prev => ({
      ...prev,
      [selectedDay]: prev[selectedDay].filter(meal => meal.id !== mealId),
    }));
  };

  const resetWeekPlan = () => {
    if (confirm('Are you sure you want to reset all meal plans? This action cannot be undone.')) {
      setWeekPlan({
        Mon: [],
        Tue: [],
        Wed: [],
        Thu: [],
        Fri: [],
        Sat: [],
        Sun: [],
      });
    }
  };

  const getMealCount = (day: keyof WeekPlan) => weekPlan[day].length;

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const copyGroceryList = async () => {
    let listText: string;
    
    if (copyByCategory) {
      const categorizedList = generateCategorizedGroceryList(weekPlan);
      const categoryTexts: string[] = [];
      
      Object.entries(categorizedList).forEach(([categoryName, categoryData]) => {
        if (categoryData.items.length > 0) {
          categoryTexts.push(`\n${categoryData.category.icon} ${categoryName}`);
          categoryData.items.forEach(item => {
            categoryTexts.push(`• ${item.qty}${item.unit ? ` ${item.unit}` : ''} × ${item.name}`);
          });
        }
      });
      
      listText = categoryTexts.join('\n').trim();
    } else {
      const groceryList = generateGroceryList(weekPlan);
      listText = groceryList
        .map(item => `• ${item.qty}${item.unit ? ` ${item.unit}` : ''} × ${item.name}`)
        .join('\n');
    }
    
    try {
      await navigator.clipboard.writeText(listText);
      showToast('Grocery list copied to clipboard!');
    } catch {
      showToast('Failed to copy to clipboard', 'error');
    }
  };

  const downloadGroceryList = () => {
    const groceryList = generateGroceryList(weekPlan);
    const listText = groceryList
      .map(item => `${item.qty}\t${item.name}${item.unit ? ` (${item.unit})` : ''}`)
      .join('\n');
    
    downloadText('grocery-list.txt', listText);
    showToast('Grocery list downloaded!');
  };

  const insertPresetRecipe = (preset: typeof recipePresets[0]) => {
    const newMeal: Meal = {
      id: Date.now().toString(),
      title: preset.title,
      ingredients: preset.ingredients,
    };

    setWeekPlan(prev => ({
      ...prev,
      [selectedDay]: [...prev[selectedDay], newMeal],
    }));

    setShowPresetsModal(false);
    showToast(`Added ${preset.title} to ${dayNames[selectedDay]}!`);
  };

  const toggleCategoryExpansion = (categoryName: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryName]: !prev[categoryName]
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <div className="flex justify-center items-center gap-3 mb-4">
            <Calendar className="w-8 h-8 text-indigo-600" />
            <h1 className="text-4xl font-bold text-gray-900">Meal Planner & Grocery List</h1>
          </div>
          <p className="text-lg text-gray-600 mb-4">
            Plan your weekly meals and organize your grocery shopping
          </p>
          <div className="flex justify-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowPresetsModal(true)}
              className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 focus:bg-indigo-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:ring-offset-2"
              aria-label="Open recipe presets"
            >
              <BookOpen className="w-4 h-4" />
              Presets
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={resetWeekPlan}
              className="flex items-center gap-2 bg-red-500 hover:bg-red-600 focus:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-2"
              aria-label="Reset all meal plans"
            >
              <RotateCcw className="w-4 h-4" />
              Reset All Plans
            </motion.button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left Column - Days */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-1"
          >
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Weekly Schedule</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
                {days.map((day, index) => (
                  <motion.button
                    key={day}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedDay(day)}
                    className={`w-full p-4 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:ring-offset-2 ${
                      selectedDay === day
                        ? 'bg-indigo-600 text-white shadow-lg'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                    aria-label={`Select ${dayNames[day]} for meal planning`}
                    aria-pressed={selectedDay === day}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{dayNames[day]}</span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          selectedDay === day
                            ? 'bg-white bg-opacity-20 text-white'
                            : 'bg-indigo-100 text-indigo-600'
                        }`}
                      >
                        {getMealCount(day)} meals
                      </span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right Column - Meals */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="lg:col-span-2"
          >
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  {dayNames[selectedDay]} Meals
                </h2>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={addMeal}
                  disabled={!newMealTitle.trim()}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 focus:bg-indigo-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:ring-offset-2 disabled:focus:ring-0"
                  aria-label="Add meal to current day"
                >
                  <Plus className="w-4 h-4" />
                  Add Meal
                </motion.button>
              </div>

              {/* Add Meal Form */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.5 }}
                className="bg-gray-50 rounded-xl p-4 mb-6"
              >
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Meal Title
                    </label>
                    <input
                      type="text"
                      value={newMealTitle}
                      onChange={(e) => setNewMealTitle(e.target.value)}
                      placeholder="e.g., Chicken Stir Fry"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:outline-none"
                      aria-label="Meal title"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ingredients (one per line)
                    </label>
                    <textarea
                      value={newMealIngredients}
                      onChange={(e) => setNewMealIngredients(e.target.value)}
                      placeholder="Chicken breast&#10;Bell peppers&#10;Broccoli&#10;Soy sauce"
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:outline-none resize-none"
                      aria-label="Ingredients list"
                    />
                  </div>
                </div>
              </motion.div>

              {/* Meals List */}
              <div className="space-y-4">
                <AnimatePresence>
                  {weekPlan[selectedDay].map((meal, index) => (
                    <motion.div
                      key={meal.id}
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -20, scale: 0.95 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      layout
                      className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-4 border border-indigo-100"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {meal.title}
                        </h3>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => deleteMeal(meal.id)}
                          className="text-red-500 hover:text-red-700 focus:text-red-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-1 rounded p-1"
                          aria-label={`Delete meal: ${meal.title}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      </div>
                      <div className="space-y-1">
                        {meal.ingredients.split('\n').map((ingredient, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.2, delay: 0.1 + idx * 0.05 }}
                            className="flex items-center gap-2 text-sm text-gray-600"
                          >
                            <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></div>
                            <span>{ingredient}</span>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {weekPlan[selectedDay].length === 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.6 }}
                    className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-8 text-center border-2 border-dashed border-gray-200"
                  >
                    <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                      No meals planned for {dayNames[selectedDay]}
                    </h3>
                    <p className="text-gray-500 mb-4">
                      Start planning your meals by adding ingredients above
                    </p>
                    <div className="text-sm text-gray-400 space-y-1">
                      <p>💡 <strong>Tip:</strong> Add ingredients like "2 cups rice" or "chicken breast"</p>
                      <p>📝 Each line becomes a separate ingredient in your grocery list</p>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Grocery List Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-8"
        >
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
              <div className="flex items-center gap-3">
                <ShoppingCart className="w-6 h-6 text-indigo-600" />
                <h2 className="text-xl font-semibold text-gray-900">Grocery List</h2>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="copyByCategory"
                    checked={copyByCategory}
                    onChange={(e) => setCopyByCategory(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 focus:ring-2"
                  />
                  <label htmlFor="copyByCategory" className="text-sm text-gray-700">
                    Copy by category
                  </label>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={copyGroceryList}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 focus:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-300 focus:ring-offset-2"
                  aria-label="Copy grocery list to clipboard"
                >
                  <Copy className="w-4 h-4" />
                  Copy List
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={downloadGroceryList}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 focus:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2"
                  aria-label="Download grocery list as text file"
                >
                  <Download className="w-4 h-4" />
                  Download
                </motion.button>
              </div>
            </div>

            {/* Categorized Grocery List */}
            {(() => {
              const categorizedList = generateCategorizedGroceryList(weekPlan);
              const hasItems = Object.values(categorizedList).some(categoryData => categoryData.items.length > 0);
              
              if (!hasItems) {
                return (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.7 }}
                    className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-8 text-center border-2 border-dashed border-green-200"
                  >
                    <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-green-400" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                      No ingredients to shop for
                    </h3>
                    <p className="text-gray-500 mb-4">
                      Add some meals to automatically generate your grocery list
                    </p>
                    <div className="text-sm text-gray-400 space-y-1">
                      <p>🛒 <strong>Smart parsing:</strong> "2 kg potatoes" becomes "2 kg × potatoes"</p>
                      <p>📊 <strong>Auto-summing:</strong> Duplicate ingredients are combined</p>
                      <p>🏷️ <strong>Smart categories:</strong> Items are automatically grouped</p>
                    </div>
                  </motion.div>
                );
              }

              return (
                <div className="space-y-4">
                  {Object.entries(categorizedList).map(([categoryName, categoryData]) => {
                    if (categoryData.items.length === 0) return null;
                    
                    const isExpanded = expandedCategories[categoryName] !== false; // Default to expanded
                    const categoryColors = {
                      green: 'from-green-50 to-emerald-50 border-green-200 text-green-800',
                      blue: 'from-blue-50 to-cyan-50 border-blue-200 text-blue-800',
                      amber: 'from-amber-50 to-yellow-50 border-amber-200 text-amber-800',
                      red: 'from-red-50 to-rose-50 border-red-200 text-red-800',
                      orange: 'from-orange-50 to-amber-50 border-orange-200 text-orange-800',
                      purple: 'from-purple-50 to-violet-50 border-purple-200 text-purple-800',
                      gray: 'from-gray-50 to-slate-50 border-gray-200 text-gray-800'
                    };

                    return (
                      <motion.div
                        key={categoryName}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        className="bg-white rounded-xl border border-gray-200 overflow-hidden"
                      >
                        <button
                          onClick={() => toggleCategoryExpansion(categoryName)}
                          className={`w-full p-4 bg-gradient-to-r ${categoryColors[categoryData.category.color as keyof typeof categoryColors]} hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:ring-offset-2`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-xl">{categoryData.category.icon}</span>
                              <h3 className="font-semibold text-lg">{categoryName}</h3>
                              <span className="text-sm opacity-75">({categoryData.items.length} items)</span>
                            </div>
                            {isExpanded ? (
                              <ChevronDown className="w-5 h-5" />
                            ) : (
                              <ChevronRight className="w-5 h-5" />
                            )}
                          </div>
                        </button>
                        
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3 }}
                              className="overflow-hidden"
                            >
                              <div className="p-4 bg-gray-50">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {categoryData.items.map((item, index) => (
                                    <motion.div
                                      key={item.id}
                                      initial={{ opacity: 0, scale: 0.95 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      transition={{ duration: 0.3, delay: index * 0.05 }}
                                      className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm"
                                    >
                                      <div className="flex justify-between items-center">
                                        <span className="font-medium text-gray-900 capitalize">
                                          {item.name}
                                        </span>
                                        <span className="text-sm text-gray-600">
                                          {item.qty}{item.unit ? ` ${item.unit}` : ''}
                                        </span>
                                      </div>
                                    </motion.div>
                                  ))}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </motion.div>

        {/* Toast Notification */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className={`fixed bottom-6 right-6 px-6 py-3 rounded-lg shadow-lg z-50 ${
                toast.type === 'success' 
                  ? 'bg-green-500 text-white' 
                  : 'bg-red-500 text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="font-medium">{toast.message}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Recipe Presets Modal */}
        <AnimatePresence>
          {showPresetsModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
              onClick={() => setShowPresetsModal(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-6 h-6 text-indigo-600" />
                    <h2 className="text-2xl font-bold text-gray-900">Recipe Presets</h2>
                  </div>
                  <button
                    onClick={() => setShowPresetsModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    aria-label="Close modal"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                {/* Modal Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                  <p className="text-gray-600 mb-6 text-center">
                    Choose a recipe to add to <span className="font-semibold text-indigo-600">{dayNames[selectedDay]}</span>
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {recipePresets.map((preset) => (
                      <motion.div
                        key={preset.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:border-indigo-300 transition-colors"
                      >
                        <h3 className="font-semibold text-lg text-gray-900 mb-3">{preset.title}</h3>
                        <div className="text-sm text-gray-600 mb-4 max-h-24 overflow-y-auto">
                          <pre className="whitespace-pre-wrap font-sans">{preset.ingredients}</pre>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => insertPresetRecipe(preset)}
                          className="w-full bg-indigo-500 hover:bg-indigo-600 text-white py-2 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:ring-offset-2"
                        >
                          Insert to {dayNames[selectedDay]}
                        </motion.button>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
