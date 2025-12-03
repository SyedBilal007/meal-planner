import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Calendar, Copy, Download, ShoppingCart, ChevronDown, ChevronRight } from 'lucide-react';
import type { WeekPlan } from '../utils/groceryList';
import { generateGroceryList, generateCategorizedGroceryList, downloadText } from '../utils/groceryList';
import { getWeekStart } from '../utils/mealHelpers';
import { mockGetMeals, mockAddMeal, mockDeleteMeal } from '../mocks/meals';
import { getDayOfWeek } from '../utils/mealHelpers';
import AIMealGenerator from './AIMealGenerator';

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

export default function MealPlanner() {
  const [selectedDay, setSelectedDay] = useState<keyof WeekPlan>('Mon');
  const [weekPlan, setWeekPlan] = useState<WeekPlan>({
    Mon: [], Tue: [], Wed: [], Thu: [], Fri: [], Sat: [], Sun: []
  });
  const [weekStart, setWeekStart] = useState(getWeekStart());
  const [newMealTitle, setNewMealTitle] = useState('');
  const [newMealIngredients, setNewMealIngredients] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [copyByCategory, setCopyByCategory] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch meals from mock data
  const fetchMeals = useCallback(async () => {
    setLoading(true);
    try {
      const allMeals = await mockGetMeals();
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      // Convert mock meals to WeekPlan format
      const plan: WeekPlan = {
        Mon: [], Tue: [], Wed: [], Thu: [], Fri: [], Sat: [], Sun: []
      };
      
      allMeals.forEach((meal) => {
        const mealDate = new Date(meal.date);
        // Check if meal is in current week
        if (mealDate >= weekStart && mealDate <= weekEnd) {
          const dayOfWeek = getDayOfWeek(mealDate);
          plan[dayOfWeek].push({
            id: String(meal.id),
            title: meal.title,
            ingredients: meal.notes || '',
          });
        }
      });
      
      setWeekPlan(plan);
    } catch (error) {
      console.error('Failed to fetch meals:', error);
      showToast('Failed to load meals', 'error');
    } finally {
      setLoading(false);
    }
  }, [weekStart]);

  useEffect(() => {
    fetchMeals();
  }, [fetchMeals]);

  const addMeal = async () => {
    if (!newMealTitle.trim()) return;

    try {
      // Calculate date for selected day
      const dayIndex = days.indexOf(selectedDay);
      const mealDate = new Date(weekStart);
      mealDate.setDate(mealDate.getDate() + dayIndex);
      const dateString = mealDate.toISOString().split('T')[0]; // yyyy-mm-dd format
      
      await mockAddMeal({
        title: newMealTitle.trim(),
        date: dateString,
        notes: newMealIngredients.trim() || undefined,
      });
      
      // Refresh meals to get updated week plan
      await fetchMeals();

      setNewMealTitle('');
      setNewMealIngredients('');
      showToast('Meal added successfully!');
    } catch (error: any) {
      console.error('Failed to add meal:', error);
      showToast('Failed to add meal', 'error');
    }
  };

  const deleteMeal = async (mealId: string) => {
    if (!confirm('Are you sure you want to delete this meal?')) return;

    try {
      const mealIdNum = parseInt(mealId, 10);
      if (!isNaN(mealIdNum)) {
        await mockDeleteMeal(mealIdNum);
        await fetchMeals(); // Refresh to update week plan
      }
      showToast('Meal deleted successfully!');
    } catch (error: any) {
      console.error('Failed to delete meal:', error);
      showToast('Failed to delete meal', 'error');
    }
  };

  const getMealCount = (day: keyof WeekPlan) => weekPlan[day].length;

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const copyGroceryList = async () => {
    // For now, use local generation. Later can fetch from backend
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

  const toggleCategoryExpansion = (categoryName: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryName]: !prev[categoryName]
    }));
  };

  const changeWeek = (direction: 'prev' | 'next') => {
    const newWeekStart = new Date(weekStart);
    newWeekStart.setDate(newWeekStart.getDate() + (direction === 'next' ? 7 : -7));
    setWeekStart(newWeekStart);
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
            <h1 className="text-4xl font-bold text-gray-900">MealSync</h1>
          </div>
          <p className="text-lg text-gray-600 mb-4">
            Collaborative meal planning
          </p>
          <div className="flex justify-center items-center gap-4 flex-wrap">
            <AIMealGenerator onMealAdded={fetchMeals} />
          </div>
        </motion.div>

        {/* Week Navigation */}
        <div className="flex justify-center items-center gap-4 mb-6">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => changeWeek('prev')}
            className="px-4 py-2 bg-white rounded-lg shadow hover:bg-gray-50"
          >
            ← Previous Week
          </motion.button>
          <span className="text-lg font-semibold">
            {weekStart.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} -{' '}
            {new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </span>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => changeWeek('next')}
            className="px-4 py-2 bg-white rounded-lg shadow hover:bg-gray-50"
          >
            Next Week →
          </motion.button>
        </div>

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
                    aria-pressed={selectedDay === day}
                    aria-label={`Select ${dayNames[day]}`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">{dayNames[day]}</span>
                      <span className={`text-sm ${selectedDay === day ? 'text-white' : 'text-gray-500'}`}>
                        {getMealCount(day)} meal{getMealCount(day) !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right Column - Meals Editor */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="lg:col-span-2"
          >
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Meals for {dayNames[selectedDay]}
              </h2>

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
                      onKeyDown={(e) => e.key === 'Enter' && addMeal()}
                      placeholder="e.g., Chicken Stir Fry"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:outline-none"
                      aria-label="Meal title"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ingredients (one per line) - Optional
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
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={addMeal}
                    disabled={!newMealTitle.trim() || loading}
                    className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    {loading ? 'Adding...' : 'Add Meal'}
                  </motion.button>
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
                      {meal.ingredients && (
                        <div className="space-y-1">
                          {meal.ingredients.split('\n').filter(Boolean).map((ingredient, idx) => (
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
                      )}
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
                      Start planning your meals by adding one above
                    </p>
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
                  </motion.div>
                );
              }

              return (
                <div className="space-y-4">
                  {Object.entries(categorizedList).map(([categoryName, categoryData]) => {
                    if (categoryData.items.length === 0) return null;
                    
                    const isExpanded = expandedCategories[categoryName] !== false;
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
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className={`fixed bottom-4 right-4 px-6 py-4 rounded-lg shadow-lg z-50 ${
                toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
              }`}
            >
              {toast.message}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

