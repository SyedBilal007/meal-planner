import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Calendar, Copy, Download, ShoppingCart, ChevronDown, ChevronRight, Save, Edit2, Clock, User, BookOpen, X, MessageSquare, ChefHat, LogOut } from 'lucide-react';
import { USE_MOCK_DATA } from '../config/dataSource';
import type { WeekPlan, GroceryItem, CategorizedGroceryList } from '../utils/groceryList';
import { downloadText, groceryCategories } from '../utils/groceryList';
import { getWeekStart, getWeekDateRange, convertMealsToWeekPlan } from '../utils/mealHelpers';
import { 
  mockGetMeals, 
  mockAddMeal, 
  mockUpdateMeal, 
  mockDeleteMeal,
  mockAddMealComment,
  mockDeleteMealComment,
  mockClaimMeal,
  type Meal as MockMeal
} from '../mocks/meals';
import { 
  mockGenerateGroceryFromMeals, 
  mockToggleGroceryBought, 
  mockAddGroceryItem, 
  mockUpdateGroceryItem, 
  mockDeleteGroceryItem,
  type GroceryItem as MockGroceryItem 
} from '../mocks/grocery';
import { mockGetRecipes, type Recipe } from '../mocks/recipes';
import { getDayOfWeek } from '../utils/mealHelpers';
import { mealAPI } from '../utils/api';
import { useHousehold } from '../contexts/HouseholdContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

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
  const { currentHousehold } = useHousehold();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [selectedDay, setSelectedDay] = useState<keyof WeekPlan>('Mon');
  const [weekPlan, setWeekPlan] = useState<WeekPlan>({
    Mon: [], Tue: [], Wed: [], Thu: [], Fri: [], Sat: [], Sun: []
  });
  const [weekStart, setWeekStart] = useState(getWeekStart());
  const [newMealTitle, setNewMealTitle] = useState('');
  const [newMealIngredients, setNewMealIngredients] = useState('');
  const [newMealTimeSlot, setNewMealTimeSlot] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('dinner');
  const [newMealAssignedTo, setNewMealAssignedTo] = useState('');
  const [newMealRecipeId, setNewMealRecipeId] = useState<number | undefined>(undefined);
  const [editingMealId, setEditingMealId] = useState<string | null>(null);
  const [editMealTitle, setEditMealTitle] = useState('');
  const [editMealIngredients, setEditMealIngredients] = useState('');
  const [editMealTimeSlot, setEditMealTimeSlot] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('dinner');
  const [editMealAssignedTo, setEditMealAssignedTo] = useState('');
  const [editMealRecipeId, setEditMealRecipeId] = useState<number | undefined>(undefined);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [viewingRecipeId, setViewingRecipeId] = useState<number | null>(null);
  const [mealRecipeMap, setMealRecipeMap] = useState<Record<string, number>>({});
  const [currentMealData, setCurrentMealData] = useState<MockMeal | null>(null);
  const [newCommentAuthor, setNewCommentAuthor] = useState('');
  const [newCommentText, setNewCommentText] = useState('');
  const [claimerName, setClaimerName] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [copyByCategory, setCopyByCategory] = useState(false);
  const [loading, setLoading] = useState(false);
  const [groceryItems, setGroceryItems] = useState<MockGroceryItem[]>([]);
  const [groceryLoading, setGroceryLoading] = useState(false);
  const [showAddGroceryForm, setShowAddGroceryForm] = useState(false);
  const [editingGroceryId, setEditingGroceryId] = useState<number | null>(null);
  const [newGroceryName, setNewGroceryName] = useState('');
  const [newGroceryQuantity, setNewGroceryQuantity] = useState('');
  const [newGroceryUnit, setNewGroceryUnit] = useState('');
  const [editGroceryName, setEditGroceryName] = useState('');
  const [editGroceryQuantity, setEditGroceryQuantity] = useState('');
  const [editGroceryUnit, setEditGroceryUnit] = useState('');

  // Fetch meals from mock data or real API
  const fetchMeals = useCallback(async () => {
    if (!USE_MOCK_DATA && !currentHousehold) {
      setWeekPlan({ Mon: [], Tue: [], Wed: [], Thu: [], Fri: [], Sat: [], Sun: [] });
      return;
    }

    setLoading(true);
    try {
      if (USE_MOCK_DATA) {
        const allMeals = await mockGetMeals();
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        
        // Convert mock meals to WeekPlan format
        const plan: WeekPlan = {
      Mon: [], Tue: [], Wed: [], Thu: [], Fri: [], Sat: [], Sun: []
        };
        
        const recipeMap: Record<string, number> = {};
        allMeals.forEach((meal) => {
          const mealDate = new Date(meal.date);
          // Check if meal is in current week
          if (mealDate >= weekStart && mealDate <= weekEnd) {
            const dayOfWeek = getDayOfWeek(mealDate);
            plan[dayOfWeek].push({
              id: String(meal.id),
              title: meal.title,
              ingredients: meal.notes || '',
              timeSlot: meal.timeSlot,
              assignedTo: meal.assignedTo,
            });
            if (meal.recipeId) {
              recipeMap[String(meal.id)] = meal.recipeId;
            }
          }
        });
        setMealRecipeMap(recipeMap);
        
        setWeekPlan(plan);
      } else {
        // Real API path
      const { start, end } = getWeekDateRange(weekStart);
        const response = await mealAPI.getAll({
          householdId: currentHousehold!.id,
        startDate: start,
        endDate: end,
      });
        const plan = convertMealsToWeekPlan(response.data, weekStart);
      setWeekPlan(plan);
      }
    } catch (error: any) {
      console.error('Failed to fetch meals:', error);
      showToast(
        error.response?.data?.error || 
        error.response?.data?.message || 
        'Failed to load meals', 
        'error'
      );
    } finally {
      setLoading(false);
    }
  }, [weekStart, currentHousehold]);

  useEffect(() => {
    fetchMeals();
  }, [fetchMeals]);

  useEffect(() => {
    if (USE_MOCK_DATA) {
      loadRecipes();
    }
  }, []);

  // Load and generate grocery list from meals
  useEffect(() => {
    if (USE_MOCK_DATA) {
      loadGroceryList();
    }
  }, [weekPlan]);

  const loadGroceryList = async () => {
    setGroceryLoading(true);
    try {
      // Get all meals for the current week
      const allMeals = await mockGetMeals();
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      // Filter meals in current week
      const weekMeals = allMeals.filter(meal => {
        const mealDate = new Date(meal.date);
        return mealDate >= weekStart && mealDate <= weekEnd;
      });
      
      // Generate grocery list from meals
      const items = await mockGenerateGroceryFromMeals(weekMeals);
      setGroceryItems(items);
    } catch (error) {
      console.error('Failed to load grocery list:', error);
    } finally {
      setGroceryLoading(false);
    }
  };

  const loadRecipes = async () => {
    try {
      const data = await mockGetRecipes();
      setRecipes(data);
    } catch (error) {
      console.error('Failed to load recipes:', error);
    }
  };

  const handleViewRecipe = (mealId: string) => {
    if (!USE_MOCK_DATA) return;
    const recipeId = mealRecipeMap[mealId];
    if (recipeId) {
      setViewingRecipeId(recipeId);
    }
  };

  const handleToggleBought = async (id: number) => {
    try {
      const updated = await mockToggleGroceryBought(id);
      if (updated) {
        setGroceryItems(prev => prev.map(item => item.id === id ? updated : item));
      }
    } catch (error) {
      console.error('Failed to toggle bought status:', error);
      showToast('Failed to update item', 'error');
    }
  };

  const handleAddGroceryItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroceryName.trim()) return;

    try {
      const quantity = parseFloat(newGroceryQuantity) || 1;
      const newItem = await mockAddGroceryItem({
        name: newGroceryName.trim(),
        quantity,
        unit: newGroceryUnit.trim() || '',
        bought: false,
      });
      setGroceryItems(prev => [...prev, newItem]);
      setNewGroceryName('');
      setNewGroceryQuantity('');
      setNewGroceryUnit('');
      setShowAddGroceryForm(false);
      showToast('Item added to grocery list!');
    } catch (error) {
      console.error('Failed to add grocery item:', error);
      showToast('Failed to add item', 'error');
    }
  };

  const handleEditGroceryClick = (item: MockGroceryItem) => {
    setEditingGroceryId(item.id);
    setEditGroceryName(item.name);
    setEditGroceryQuantity(String(item.quantity));
    setEditGroceryUnit(item.unit);
  };

  const handleEditGroceryCancel = () => {
    setEditingGroceryId(null);
    setEditGroceryName('');
    setEditGroceryQuantity('');
    setEditGroceryUnit('');
  };

  const handleEditGrocerySubmit = async () => {
    if (!editGroceryName.trim() || !editingGroceryId) return;

    try {
      const quantity = parseFloat(editGroceryQuantity) || 1;
      const updated = await mockUpdateGroceryItem(editingGroceryId, {
        name: editGroceryName.trim(),
        quantity,
        unit: editGroceryUnit.trim() || '',
      });
      if (updated) {
        setGroceryItems(prev => prev.map(item => item.id === editingGroceryId ? updated : item));
        handleEditGroceryCancel();
        showToast('Item updated!');
      }
    } catch (error) {
      console.error('Failed to update grocery item:', error);
      showToast('Failed to update item', 'error');
    }
  };

  const handleDeleteGroceryItem = async (id: number) => {
    if (!confirm('Are you sure you want to remove this item from the grocery list?')) return;

    try {
      await mockDeleteGroceryItem(id);
      setGroceryItems(prev => prev.filter(item => item.id !== id));
      if (editingGroceryId === id) {
        handleEditGroceryCancel();
      }
      showToast('Item removed from grocery list!');
    } catch (error) {
      console.error('Failed to delete grocery item:', error);
      showToast('Failed to remove item', 'error');
    }
  };

  const addMeal = async () => {
    if (!newMealTitle.trim()) return;
    if (!USE_MOCK_DATA && !currentHousehold) {
      showToast('Please select a household first', 'error');
      return;
    }

    try {
      // Calculate date for selected day
      const dayIndex = days.indexOf(selectedDay);
      const mealDate = new Date(weekStart);
      mealDate.setDate(mealDate.getDate() + dayIndex);
      
      if (USE_MOCK_DATA) {
        const dateString = mealDate.toISOString().split('T')[0]; // yyyy-mm-dd format
        await mockAddMeal({
          title: newMealTitle.trim(),
          date: dateString,
          timeSlot: newMealTimeSlot,
          assignedTo: newMealAssignedTo.trim() || undefined,
          notes: newMealIngredients.trim() || undefined,
          recipeId: newMealRecipeId,
        });
      } else {
        // Real API path
      await mealAPI.create({
        name: newMealTitle.trim(),
          mealType: 'dinner',
          date: mealDate.toISOString(),
          householdId: currentHousehold!.id,
        });
      }
      
      // Refresh meals to get updated week plan
      await fetchMeals();
      
      // Refresh grocery list if using mock data
      if (USE_MOCK_DATA) {
        await loadGroceryList();
      }

      setNewMealTitle('');
      setNewMealIngredients('');
      setNewMealTimeSlot('dinner');
      setNewMealAssignedTo('');
      setNewMealRecipeId(undefined);
      showToast('Meal added successfully!');
    } catch (error: any) {
      console.error('Failed to add meal:', error);
      showToast(
        error.response?.data?.error || 
        error.response?.data?.message || 
        'Failed to add meal', 
        'error'
      );
    }
  };

  const handleEditClick = async (meal: WeekPlan['Mon'][0]) => {
    setEditingMealId(meal.id);
    setEditMealTitle(meal.title);
    setEditMealIngredients(meal.ingredients || '');
    setEditMealTimeSlot(meal.timeSlot || 'dinner');
    setEditMealAssignedTo(meal.assignedTo || '');
    // Get full meal data including comments and claimedBy
    if (USE_MOCK_DATA) {
      const allMeals = await mockGetMeals();
      const mealData = allMeals.find(m => m.id === parseInt(meal.id, 10));
      if (mealData) {
        setEditMealRecipeId(mealData.recipeId);
        setCurrentMealData(mealData);
        setClaimerName(mealData.claimedBy || '');
      }
    }
  };

  const handleEditCancel = () => {
    setEditingMealId(null);
    setEditMealTitle('');
    setEditMealIngredients('');
    setEditMealTimeSlot('dinner');
    setEditMealAssignedTo('');
    setEditMealRecipeId(undefined);
    setCurrentMealData(null);
    setNewCommentAuthor('');
    setNewCommentText('');
    setClaimerName('');
  };

  const handleEditSubmit = async () => {
    if (!editMealTitle.trim()) return;
    if (!editingMealId) return;

    try {
      if (USE_MOCK_DATA) {
        const mealIdNum = parseInt(editingMealId, 10);
        if (!isNaN(mealIdNum)) {
          // Get all meals to find the existing meal and preserve its date
          const allMeals = await mockGetMeals();
          const existingMeal = allMeals.find(m => m.id === mealIdNum);
          if (existingMeal) {
            await mockUpdateMeal(mealIdNum, {
              title: editMealTitle.trim(),
              timeSlot: editMealTimeSlot,
              assignedTo: editMealAssignedTo.trim() || undefined,
              notes: editMealIngredients.trim() || undefined,
              recipeId: editMealRecipeId,
              // Preserve the date
              date: existingMeal.date,
            });
          }
        }
      } else {
        // Real API path
        await mealAPI.update(editingMealId, {
          name: editMealTitle.trim(),
          mealType: editMealTimeSlot,
        });
      }
      
      await fetchMeals();
      
      // Refresh grocery list if using mock data
      if (USE_MOCK_DATA) {
        await loadGroceryList();
        // Reload current meal data to get updated comments/claimedBy
        if (editingMealId) {
          const mealIdNum = parseInt(editingMealId, 10);
          if (!isNaN(mealIdNum)) {
            const allMeals = await mockGetMeals();
            const updatedMeal = allMeals.find(m => m.id === mealIdNum);
            if (updatedMeal) {
              setCurrentMealData(updatedMeal);
            }
          }
        }
      }
      
      // Don't cancel - keep editing mode open
      showToast('Meal updated successfully!');
    } catch (error: any) {
      console.error('Failed to update meal:', error);
      showToast(
        error.response?.data?.error || 
        error.response?.data?.message || 
        'Failed to update meal', 
        'error'
      );
    }
  };

  const deleteMeal = async (mealId: string) => {
    if (!confirm('Are you sure you want to delete this meal?')) return;

    try {
      if (USE_MOCK_DATA) {
        const mealIdNum = parseInt(mealId, 10);
        if (!isNaN(mealIdNum)) {
          await mockDeleteMeal(mealIdNum);
        }
      } else {
        // Real API path
      await mealAPI.delete(mealId);
      }
      await fetchMeals(); // Refresh to update week plan
      
      // Refresh grocery list if using mock data
      if (USE_MOCK_DATA) {
        await loadGroceryList();
      }
      
      if (editingMealId === mealId) {
        handleEditCancel();
      }
      showToast('Meal deleted successfully!');
    } catch (error: any) {
      console.error('Failed to delete meal:', error);
      showToast(
        error.response?.data?.error || 
        error.response?.data?.message || 
        'Failed to delete meal', 
        'error'
      );
    }
  };

  const getMealCount = (day: keyof WeekPlan) => weekPlan[day].length;

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const copyGroceryList = async () => {
    try {
    let listText: string;
    
    if (copyByCategory) {
        // Convert mock grocery items to categorized format
        const categorizedList = categorizeGroceryItemsFromMock(groceryItems);
      const categoryTexts: string[] = [];
      
      Object.entries(categorizedList).forEach(([categoryName, categoryData]) => {
        if (categoryData.items.length > 0) {
          categoryTexts.push(`\n${categoryData.category.icon} ${categoryName}`);
          categoryData.items.forEach(item => {
              const mockItem = groceryItems.find(gi => String(gi.id) === item.id);
              const boughtMark = mockItem?.bought ? '✓ ' : '';
              categoryTexts.push(`• ${boughtMark}${item.qty}${item.unit ? ` ${item.unit}` : ''} × ${item.name}`);
          });
        }
      });
      
      listText = categoryTexts.join('\n').trim();
    } else {
        listText = groceryItems
          .map(item => {
            const boughtMark = item.bought ? '✓ ' : '';
            return `• ${boughtMark}${item.quantity}${item.unit ? ` ${item.unit}` : ''} × ${item.name}`;
          })
        .join('\n');
    }
    
      await navigator.clipboard.writeText(listText);
      showToast('Grocery list copied to clipboard!');
    } catch {
      showToast('Failed to copy to clipboard', 'error');
    }
  };

  const downloadGroceryList = () => {
    const listText = groceryItems
      .map(item => {
        const boughtMark = item.bought ? '[✓] ' : '';
        return `${boughtMark}${item.quantity}\t${item.name}${item.unit ? ` (${item.unit})` : ''}`;
      })
      .join('\n');
    
    downloadText('grocery_list.txt', listText);
    showToast('Grocery list downloaded!');
  };

  // Helper to categorize mock grocery items
  const categorizeGroceryItemsFromMock = (items: MockGroceryItem[]): CategorizedGroceryList => {
    const categorized: CategorizedGroceryList = {};
    const otherItems: GroceryItem[] = [];

    // Initialize categories
    groceryCategories.forEach((category) => {
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
        const hasKeyword = category.keywords.some((keyword: string) => 
          itemName.includes(keyword.toLowerCase())
        );

        if (hasKeyword) {
          categorized[category.name].items.push({
            id: String(item.id),
            name: item.name,
            qty: item.quantity,
            unit: item.unit,
          });
          categorized_item = true;
          break;
        }
      }

      // If no category matched, add to "Other"
      if (!categorized_item) {
        otherItems.push({
          id: String(item.id),
          name: item.name,
          qty: item.quantity,
          unit: item.unit,
        });
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

    return categorized;
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
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-indigo-600" />
              <h1 className="text-4xl font-bold text-gray-900">MealSync</h1>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </motion.button>
          </div>
          <p className="text-lg text-gray-600 text-center">
            Collaborative meal planning
          </p>
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
              {!editingMealId && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.5 }}
                className="bg-gray-50 rounded-xl p-4 mb-6"
              >
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Meal</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Meal Title <span className="text-red-500">*</span>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Time Slot
                        </label>
                        <select
                          value={newMealTimeSlot}
                          onChange={(e) => setNewMealTimeSlot(e.target.value as 'breakfast' | 'lunch' | 'dinner' | 'snack')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:outline-none"
                        >
                          <option value="breakfast">Breakfast</option>
                          <option value="lunch">Lunch</option>
                          <option value="dinner">Dinner</option>
                          <option value="snack">Snack</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Assigned To (Optional)
                        </label>
                        <input
                          type="text"
                          value={newMealAssignedTo}
                          onChange={(e) => setNewMealAssignedTo(e.target.value)}
                          placeholder="e.g., Bilal"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:outline-none"
                          aria-label="Assigned to"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Link Recipe (Optional)
                      </label>
                      <select
                        value={newMealRecipeId || ''}
                        onChange={(e) => setNewMealRecipeId(e.target.value ? parseInt(e.target.value) : undefined)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:outline-none"
                      >
                        <option value="">No recipe</option>
                        {recipes.map(recipe => (
                          <option key={recipe.id} value={recipe.id}>
                            {recipe.title}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        Select a recipe from your library to link to this meal
                      </p>
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
              )}

              {/* Edit Meal Form */}
              {editingMealId && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-blue-50 rounded-xl p-4 mb-6 border-2 border-blue-200"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Meal</h3>
              <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Meal Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={editMealTitle}
                        onChange={(e) => setEditMealTitle(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:outline-none"
                        aria-label="Meal title"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Time Slot
                        </label>
                        <select
                          value={editMealTimeSlot}
                          onChange={(e) => setEditMealTimeSlot(e.target.value as 'breakfast' | 'lunch' | 'dinner' | 'snack')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:outline-none"
                        >
                          <option value="breakfast">Breakfast</option>
                          <option value="lunch">Lunch</option>
                          <option value="dinner">Dinner</option>
                          <option value="snack">Snack</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Assigned To (Optional)
                        </label>
                        <input
                          type="text"
                          value={editMealAssignedTo}
                          onChange={(e) => setEditMealAssignedTo(e.target.value)}
                          placeholder="e.g., Bilal"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:outline-none"
                          aria-label="Assigned to"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ingredients (one per line) - Optional
                      </label>
                      <textarea
                        value={editMealIngredients}
                        onChange={(e) => setEditMealIngredients(e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:outline-none resize-none"
                        aria-label="Ingredients list"
                      />
                    </div>

                    {/* Claim Cooking Responsibility */}
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center gap-2 mb-3">
                        <ChefHat className="w-5 h-5 text-indigo-600" />
                        <h4 className="text-sm font-semibold text-gray-900">Cooking Responsibility</h4>
                      </div>
                      {currentMealData?.claimedBy ? (
                        <div className="mb-3">
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">Claimed by:</span> {currentMealData.claimedBy}
                          </p>
                        </div>
                      ) : (
                        <div className="mb-3">
                          <p className="text-sm text-gray-500 italic">Not claimed yet</p>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={claimerName}
                          onChange={(e) => setClaimerName(e.target.value)}
                          placeholder="Enter your name"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:outline-none text-sm"
                        />
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={async () => {
                            if (!claimerName.trim() || !editingMealId) return;
                            try {
                              const mealIdNum = parseInt(editingMealId, 10);
                              if (!isNaN(mealIdNum)) {
                                const updated = await mockClaimMeal(mealIdNum, claimerName.trim());
                                if (updated) {
                                  setCurrentMealData(updated);
                                  setClaimerName('');
                                  showToast('Meal claimed successfully!');
                                }
                              }
                            } catch (error) {
                              console.error('Failed to claim meal:', error);
                              showToast('Failed to claim meal', 'error');
                            }
                          }}
                          disabled={!claimerName.trim()}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        >
                          Claim Meal
                        </motion.button>
                      </div>
                    </div>

                    {/* Comments Section */}
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center gap-2 mb-3">
                        <MessageSquare className="w-5 h-5 text-indigo-600" />
                        <h4 className="text-sm font-semibold text-gray-900">Comments</h4>
                      </div>
                      
                      {/* Comments List */}
                      <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                        {currentMealData?.comments && currentMealData.comments.length > 0 ? (
                          currentMealData.comments.map((comment) => (
                            <div key={comment.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm font-medium text-gray-900">{comment.author}</span>
                                    <span className="text-xs text-gray-500">
                                      {new Date(comment.createdAt).toLocaleDateString()} {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-700">{comment.text}</p>
                                </div>
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={async () => {
                                    if (!editingMealId) return;
                                    try {
                                      const mealIdNum = parseInt(editingMealId, 10);
                                      if (!isNaN(mealIdNum)) {
                                        const updated = await mockDeleteMealComment(mealIdNum, comment.id);
                                        if (updated) {
                                          setCurrentMealData(updated);
                                          showToast('Comment deleted');
                                        }
                                      }
                                    } catch (error) {
                                      console.error('Failed to delete comment:', error);
                                      showToast('Failed to delete comment', 'error');
                                    }
                                  }}
                                  className="text-red-500 hover:text-red-700 p-1"
                                  aria-label="Delete comment"
                                >
                                  <X className="w-4 h-4" />
                                </motion.button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500 italic text-center py-2">No comments yet</p>
                        )}
                      </div>

                      {/* Add Comment Form */}
                      <div className="space-y-2 border-t border-gray-200 pt-3">
                        <div>
                          <input
                            type="text"
                            value={newCommentAuthor}
                            onChange={(e) => setNewCommentAuthor(e.target.value)}
                            placeholder="Your name"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:outline-none text-sm"
                          />
                        </div>
                        <div className="flex gap-2">
                          <textarea
                            value={newCommentText}
                            onChange={(e) => setNewCommentText(e.target.value)}
                            placeholder="Add a comment..."
                            rows={2}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:outline-none resize-none text-sm"
                          />
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={async () => {
                              if (!newCommentAuthor.trim() || !newCommentText.trim() || !editingMealId) return;
                              try {
                                const mealIdNum = parseInt(editingMealId, 10);
                                if (!isNaN(mealIdNum)) {
                                  const updated = await mockAddMealComment(mealIdNum, {
                                    author: newCommentAuthor.trim(),
                                    text: newCommentText.trim(),
                                  });
                                  if (updated) {
                                    setCurrentMealData(updated);
                                    setNewCommentAuthor('');
                                    setNewCommentText('');
                                    showToast('Comment added!');
                                  }
                                }
                              } catch (error) {
                                console.error('Failed to add comment:', error);
                                showToast('Failed to add comment', 'error');
                              }
                            }}
                            disabled={!newCommentAuthor.trim() || !newCommentText.trim()}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center gap-1"
                          >
                            <Plus className="w-4 h-4" />
                            Add
                          </motion.button>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleEditSubmit}
                        disabled={!editMealTitle.trim() || loading}
                        className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        Save Changes
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleEditCancel}
                        className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                      >
                        Cancel
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => deleteMeal(editingMealId)}
                        className="px-4 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 flex items-center justify-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Meals List - Grouped by Time Slot */}
              <div className="space-y-4">
                {(() => {
                  const timeSlotOrder: ('breakfast' | 'lunch' | 'dinner' | 'snack')[] = ['breakfast', 'lunch', 'dinner', 'snack'];
                  const timeSlotLabels = {
                    breakfast: 'Breakfast',
                    lunch: 'Lunch',
                    dinner: 'Dinner',
                    snack: 'Snack',
                  };
                  
                  // Group meals by time slot
                  const mealsByTimeSlot: Record<string, typeof weekPlan['Mon']> = {};
                  weekPlan[selectedDay].forEach(meal => {
                    const slot = meal.timeSlot || 'dinner';
                    if (!mealsByTimeSlot[slot]) {
                      mealsByTimeSlot[slot] = [];
                    }
                    mealsByTimeSlot[slot].push(meal);
                  });

                  // Render meals grouped by time slot
                  return (
                    <>
                      {timeSlotOrder.map((slot) => {
                        const mealsInSlot = mealsByTimeSlot[slot] || [];
                        if (mealsInSlot.length === 0 && editingMealId === null) return null;

                        return (
                          <div key={slot} className="space-y-2">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              {timeSlotLabels[slot]}
                            </h3>
                            {mealsInSlot.length === 0 ? (
                              <div className="text-sm text-gray-400 italic pl-6">No meal planned</div>
                            ) : (
                              <div className="space-y-2">
                <AnimatePresence>
                                  {mealsInSlot.map((meal, index) => (
                    <motion.div
                      key={meal.id}
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -20, scale: 0.95 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      layout
                                      className={`bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-4 border border-indigo-100 cursor-pointer hover:shadow-md transition-shadow ${
                                        editingMealId === meal.id ? 'ring-2 ring-blue-500' : ''
                                      }`}
                                      onClick={() => editingMealId !== meal.id && handleEditClick(meal)}
                    >
                                      <div className="flex justify-between items-start mb-2">
                                        <div className="flex-1">
                                          <h4 className="text-lg font-semibold text-gray-900">
                          {meal.title}
                                          </h4>
                                          {meal.assignedTo && (
                                            <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                                              <User className="w-3 h-3" />
                                              <span>({meal.assignedTo})</span>
                                            </div>
                                          )}
                                          {mealRecipeMap[meal.id] && (
                                            <motion.button
                                              whileHover={{ scale: 1.05 }}
                                              whileTap={{ scale: 0.95 }}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleViewRecipe(meal.id);
                                              }}
                                              className="mt-2 inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                                            >
                                              <BookOpen className="w-3 h-3" />
                                              View Recipe
                                            </motion.button>
                                          )}
                                        </div>
                                        {editingMealId !== meal.id && (
                                          <div className="flex gap-1">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleEditClick(meal);
                                              }}
                                              className="text-indigo-600 hover:text-indigo-800 focus:text-indigo-800 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:ring-offset-1 rounded p-1"
                                              aria-label={`Edit meal: ${meal.title}`}
                                            >
                                              <Edit2 className="w-4 h-4" />
                                            </motion.button>
                                            <motion.button
                                              whileHover={{ scale: 1.1 }}
                                              whileTap={{ scale: 0.9 }}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                deleteMeal(meal.id);
                                              }}
                          className="text-red-500 hover:text-red-700 focus:text-red-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-1 rounded p-1"
                          aria-label={`Delete meal: ${meal.title}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                                          </div>
                                        )}
                      </div>
                      {meal.ingredients && (
                                        <div className="space-y-1 mt-2">
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
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </>
                  );
                })()}
                
                {weekPlan[selectedDay].length === 0 && !editingMealId && (
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

            {/* Add Grocery Item Form */}
            {showAddGroceryForm && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-indigo-50 rounded-xl p-4 mb-6 border-2 border-indigo-200"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Item to Grocery List</h3>
                <form onSubmit={handleAddGroceryItem} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Item Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={newGroceryName}
                        onChange={(e) => setNewGroceryName(e.target.value)}
                        placeholder="e.g., Onion"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quantity
                      </label>
                      <input
                        type="number"
                        value={newGroceryQuantity}
                        onChange={(e) => setNewGroceryQuantity(e.target.value)}
                        placeholder="1"
                        min="0"
                        step="0.1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Unit
                      </label>
                      <input
                        type="text"
                        value={newGroceryUnit}
                        onChange={(e) => setNewGroceryUnit(e.target.value)}
                        placeholder="e.g., pcs, kg, L"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add Item
                    </motion.button>
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setShowAddGroceryForm(false);
                        setNewGroceryName('');
                        setNewGroceryQuantity('');
                        setNewGroceryUnit('');
                      }}
                      className="px-4 bg-gray-500 text-white rounded-lg font-medium hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                    >
                      Cancel
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* Add Item Button */}
            {!showAddGroceryForm && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowAddGroceryForm(true)}
                className="mb-4 w-full sm:w-auto bg-indigo-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Item Manually
              </motion.button>
            )}

            {/* Categorized Grocery List */}
            {groceryLoading ? (
              <div className="p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <p className="text-gray-600 mt-4">Loading grocery list...</p>
              </div>
            ) : (() => {
              const categorizedList = categorizeGroceryItemsFromMock(groceryItems);
              const hasItems = groceryItems.length > 0;
              
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
                      Add some meals with ingredients to automatically generate your grocery list
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
                                  {categoryData.items.map((item, index) => {
                                    const mockItem = groceryItems.find(gi => String(gi.id) === item.id);
                                    if (!mockItem) return null;
                                    
                                    return (
                                    <motion.div
                                      key={item.id}
                                      initial={{ opacity: 0, scale: 0.95 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      transition={{ duration: 0.3, delay: index * 0.05 }}
                                        className={`bg-white rounded-lg p-3 border-2 shadow-sm ${
                                          mockItem.bought ? 'border-green-300 bg-green-50 opacity-75' : 'border-gray-200'
                                        }`}
                                      >
                                        {editingGroceryId === mockItem.id ? (
                                          <div className="space-y-2">
                                            <input
                                              type="text"
                                              value={editGroceryName}
                                              onChange={(e) => setEditGroceryName(e.target.value)}
                                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:outline-none"
                                            />
                                            <div className="flex gap-2">
                                              <input
                                                type="number"
                                                value={editGroceryQuantity}
                                                onChange={(e) => setEditGroceryQuantity(e.target.value)}
                                                min="0"
                                                step="0.1"
                                                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:outline-none"
                                              />
                                              <input
                                                type="text"
                                                value={editGroceryUnit}
                                                onChange={(e) => setEditGroceryUnit(e.target.value)}
                                                placeholder="unit"
                                                className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:outline-none"
                                              />
                                            </div>
                                            <div className="flex gap-1">
                                              <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={handleEditGrocerySubmit}
                                                className="flex-1 bg-green-600 text-white py-1 px-2 rounded text-xs font-medium hover:bg-green-700"
                                              >
                                                <Save className="w-3 h-3 inline mr-1" />
                                                Save
                                              </motion.button>
                                              <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={handleEditGroceryCancel}
                                                className="px-2 bg-gray-500 text-white rounded text-xs font-medium hover:bg-gray-600"
                                              >
                                                Cancel
                                              </motion.button>
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                              <input
                                                type="checkbox"
                                                checked={mockItem.bought || false}
                                                onChange={() => handleToggleBought(mockItem.id)}
                                                className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 focus:ring-2 flex-shrink-0"
                                              />
                                              <div className="flex-1 min-w-0">
                                                <span className={`font-medium text-gray-900 capitalize block truncate ${
                                                  mockItem.bought ? 'line-through text-gray-500' : ''
                                                }`}>
                                          {item.name}
                                        </span>
                                        <span className="text-sm text-gray-600">
                                          {item.qty}{item.unit ? ` ${item.unit}` : ''}
                                        </span>
                                      </div>
                                            </div>
                                            <div className="flex gap-1 flex-shrink-0">
                                              <motion.button
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() => handleEditGroceryClick(mockItem)}
                                                className="text-indigo-600 hover:text-indigo-800 p-1"
                                                aria-label="Edit item"
                                              >
                                                <Edit2 className="w-4 h-4" />
                                              </motion.button>
                                              <motion.button
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() => handleDeleteGroceryItem(mockItem.id)}
                                                className="text-red-500 hover:text-red-700 p-1"
                                                aria-label="Delete item"
                                              >
                                                <Trash2 className="w-4 h-4" />
                                              </motion.button>
                                            </div>
                                          </div>
                                        )}
                                    </motion.div>
                                    );
                                  })}
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
                toast?.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
              }`}
            >
              {toast?.message}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Recipe Detail Modal */}
        <AnimatePresence>
          {viewingRecipeId && (() => {
            const recipe = recipes.find(r => r.id === viewingRecipeId);
            if (!recipe) return null;
            
            return (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
                onClick={() => setViewingRecipeId(null)}
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
                >
                  <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
                    <h2 className="text-3xl font-bold text-gray-900">{recipe.title}</h2>
                    <button
                      onClick={() => setViewingRecipeId(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-6 h-6" />
                    </button>
      </div>
                  <div className="p-6 space-y-6">
                    {recipe.description && (
                      <p className="text-gray-700">{recipe.description}</p>
                    )}
                    <div className="flex items-center gap-4">
                      {recipe.cuisineType && (
                        <span className="bg-indigo-100 text-indigo-800 text-sm font-medium px-3 py-1 rounded">
                          {recipe.cuisineType}
                        </span>
                      )}
                      {recipe.rating && (
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span key={star} className={star <= recipe.rating! ? 'text-yellow-400' : 'text-gray-300'}>★</span>
                          ))}
                          <span className="text-sm text-gray-600 ml-1">({recipe.rating}/5)</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-3">Ingredients</h3>
                      <ul className="space-y-2">
                        {recipe.ingredients.map((ing, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                            <span className="text-gray-700">
                              {ing.quantity} {ing.unit} {ing.name}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    {recipe.instructions && (
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-3">Instructions</h3>
                        <div className="prose max-w-none">
                          <pre className="whitespace-pre-wrap font-sans text-gray-700">
                            {recipe.instructions}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            );
          })()}
        </AnimatePresence>
      </div>
    </div>
  );
}

