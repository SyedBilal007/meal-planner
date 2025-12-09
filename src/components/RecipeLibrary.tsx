import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit2, X, Save, BookOpen, AlertCircle, Loader2, Search, Star, ExternalLink, LogOut } from 'lucide-react';
import { USE_MOCK_DATA } from '../config/dataSource';
import {
  mockGetRecipes,
  mockCreateRecipe,
  mockUpdateRecipe,
  mockDeleteRecipe,
  mockSearchRecipes,
  type Recipe,
  type RecipeIngredient,
} from '../mocks/recipes';
import { recipeAPI } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface RecipeFormData {
  title: string;
  description: string;
  cuisineType: string;
  instructions: string;
  rating: string;
  ingredients: RecipeIngredient[];
}

export default function RecipeLibrary() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [viewingRecipeId, setViewingRecipeId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState<string | number | null>(null);
  const [formData, setFormData] = useState<RecipeFormData>({
    title: '',
    description: '',
    cuisineType: '',
    instructions: '',
    rating: '',
    ingredients: [{ name: '', quantity: 0, unit: '' }],
  });

  useEffect(() => {
    fetchRecipes();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      handleSearch(searchQuery);
    } else {
      fetchRecipes();
    }
  }, [searchQuery]);

  const fetchRecipes = async () => {
    setLoading(true);
    setError('');
    try {
      const data = USE_MOCK_DATA
        ? await mockGetRecipes()
        : (await recipeAPI.getAll()).data;
      setRecipes(data);
    } catch (err: any) {
      console.error('Failed to fetch recipes:', err);
      setError(
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'Could not load recipes. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      fetchRecipes();
      return;
    }

    setLoading(true);
    try {
      const results = USE_MOCK_DATA
        ? await mockSearchRecipes(query)
        : recipes.filter(r => 
            r.title.toLowerCase().includes(query.toLowerCase()) ||
            r.description?.toLowerCase().includes(query.toLowerCase())
          );
      setRecipes(results);
    } catch (err: any) {
      console.error('Failed to search recipes:', err);
      setError('Failed to search recipes');
    } finally {
      setLoading(false);
    }
  };

  const handleAddIngredient = () => {
    setFormData({
      ...formData,
      ingredients: [...formData.ingredients, { name: '', quantity: 0, unit: '' }],
    });
  };

  const handleRemoveIngredient = (index: number) => {
    setFormData({
      ...formData,
      ingredients: formData.ingredients.filter((_, i) => i !== index),
    });
  };

  const handleIngredientChange = (index: number, field: keyof RecipeIngredient, value: string | number) => {
    const newIngredients = [...formData.ingredients];
    newIngredients[index] = { ...newIngredients[index], [field]: value };
    setFormData({ ...formData, ingredients: newIngredients });
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('Recipe title is required');
      return;
    }

    setActionLoading('add');
    setError('');

    try {
      const ingredients = formData.ingredients.filter(
        ing => ing.name.trim() && ing.quantity > 0
      );

      const payload: Omit<Recipe, 'id'> = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        cuisineType: formData.cuisineType.trim() || undefined,
        instructions: formData.instructions.trim() || undefined,
        ingredients,
        rating: formData.rating ? parseInt(formData.rating) : undefined,
      };

      const newRecipe = USE_MOCK_DATA
        ? await mockCreateRecipe(payload)
        : (await recipeAPI.create({
            name: payload.title,
            instructions: payload.instructions,
            ingredients: payload.ingredients.map(ing => ({
              name: ing.name,
              quantity: String(ing.quantity),
              unit: ing.unit,
            })),
          })).data;

      setRecipes((prev) => [...prev, newRecipe]);
      setFormData({
        title: '',
        description: '',
        cuisineType: '',
        instructions: '',
        rating: '',
        ingredients: [{ name: '', quantity: 0, unit: '' }],
      });
      setShowAddForm(false);
      showToast('Recipe added successfully!');
    } catch (err: any) {
      console.error('Failed to add recipe:', err);
      setError(
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'Failed to add recipe. Please try again.'
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleEditClick = (recipe: Recipe) => {
    setEditingId(recipe.id);
    setFormData({
      title: recipe.title,
      description: recipe.description || '',
      cuisineType: recipe.cuisineType || '',
      instructions: recipe.instructions || '',
      rating: recipe.rating ? String(recipe.rating) : '',
      ingredients: recipe.ingredients.length > 0 
        ? recipe.ingredients 
        : [{ name: '', quantity: 0, unit: '' }],
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !editingId) {
      setError('Recipe title is required');
      return;
    }

    setActionLoading(editingId);
    setError('');

    try {
      const ingredients = formData.ingredients.filter(
        ing => ing.name.trim() && ing.quantity > 0
      );

      const updates: Partial<Omit<Recipe, 'id'>> = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        cuisineType: formData.cuisineType.trim() || undefined,
        instructions: formData.instructions.trim() || undefined,
        ingredients,
        rating: formData.rating ? parseInt(formData.rating) : undefined,
      };

      const updatedRecipe = USE_MOCK_DATA
        ? await mockUpdateRecipe(editingId, updates)
        : (await recipeAPI.update(String(editingId), {
            name: updates.title,
            instructions: updates.instructions,
          })).data;

      if (updatedRecipe) {
        setRecipes((prev) =>
          prev.map((recipe) => (recipe.id === editingId ? updatedRecipe : recipe))
        );
        setEditingId(null);
        setFormData({
          title: '',
          description: '',
          cuisineType: '',
          instructions: '',
          rating: '',
          ingredients: [{ name: '', quantity: 0, unit: '' }],
        });
        showToast('Recipe updated successfully!');
      } else {
        setError('Recipe not found');
      }
    } catch (err: any) {
      console.error('Failed to update recipe:', err);
      setError(
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'Failed to update recipe. Please try again.'
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: number, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) {
      return;
    }

    setActionLoading(id);
    setError('');

    try {
      if (USE_MOCK_DATA) {
        await mockDeleteRecipe(id);
      } else {
        await recipeAPI.delete(String(id));
      }
      setRecipes((prev) => prev.filter((recipe) => recipe.id !== id));
      if (editingId === id) {
        setEditingId(null);
      }
      if (viewingRecipeId === id) {
        setViewingRecipeId(null);
      }
      showToast('Recipe deleted successfully!');
    } catch (err: any) {
      console.error('Failed to delete recipe:', err);
      setError(
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'Failed to delete recipe. Please try again.'
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setShowAddForm(false);
    setFormData({
      title: '',
      description: '',
      cuisineType: '',
      instructions: '',
      rating: '',
      ingredients: [{ name: '', quantity: 0, unit: '' }],
    });
  };

  const handleViewRecipe = async (id: number) => {
    setViewingRecipeId(id);
  };

  const showToast = (message: string) => {
    // Simple toast - could be enhanced with a toast library
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 3000);
  };

  const renderStars = (rating?: number) => {
    if (!rating) return null;
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="text-sm text-gray-600 ml-1">({rating}/5)</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-indigo-600" />
              <h1 className="text-4xl font-bold text-gray-900">Recipe Library</h1>
            </div>
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                <Plus className="w-5 h-5" />
                Add Recipe
              </motion.button>
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
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search recipes by title, description, cuisine, or ingredients..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:outline-none"
            />
          </div>
        </motion.div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2"
          >
            <AlertCircle className="w-5 h-5" />
            {error}
          </motion.div>
        )}

        {/* Add Recipe Form */}
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg p-6 mb-6 border-2 border-indigo-200"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-gray-900">Add New Recipe</h2>
              <button
                onClick={handleCancel}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:outline-none resize-none"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cuisine Type
                  </label>
                  <input
                    type="text"
                    value={formData.cuisineType}
                    onChange={(e) => setFormData({ ...formData, cuisineType: e.target.value })}
                    placeholder="e.g., Italian, Indian, Asian"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rating (1-5)
                  </label>
                  <select
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:outline-none"
                  >
                    <option value="">No rating</option>
                    <option value="1">1 - Poor</option>
                    <option value="2">2 - Fair</option>
                    <option value="3">3 - Good</option>
                    <option value="4">4 - Very Good</option>
                    <option value="5">5 - Excellent</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ingredients
                </label>
                <div className="space-y-2">
                  {formData.ingredients.map((ingredient, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2">
                      <input
                        type="text"
                        placeholder="Ingredient name"
                        value={ingredient.name}
                        onChange={(e) => handleIngredientChange(index, 'name', e.target.value)}
                        className="col-span-5 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:outline-none"
                      />
                      <input
                        type="number"
                        placeholder="Qty"
                        value={ingredient.quantity || ''}
                        onChange={(e) => handleIngredientChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.1"
                        className="col-span-3 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Unit"
                        value={ingredient.unit}
                        onChange={(e) => handleIngredientChange(index, 'unit', e.target.value)}
                        className="col-span-3 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:outline-none"
                      />
                      {formData.ingredients.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveIngredient(index)}
                          className="col-span-1 text-red-500 hover:text-red-700"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleAddIngredient}
                    className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    Add Ingredient
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Instructions
                </label>
                <textarea
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  rows={6}
                  placeholder="Step-by-step cooking instructions..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:outline-none resize-none"
                />
              </div>
              <div className="flex gap-2">
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={actionLoading === 'add'}
                  className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {actionLoading === 'add' ? 'Adding...' : 'Add Recipe'}
                </motion.button>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCancel}
                  className="px-4 bg-gray-500 text-white rounded-lg font-medium hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                >
                  Cancel
                </motion.button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Edit Recipe Form */}
        {editingId && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-50 rounded-xl shadow-lg p-6 mb-6 border-2 border-blue-200"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-gray-900">Edit Recipe</h2>
              <button
                onClick={handleCancel}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:outline-none resize-none"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cuisine Type
                  </label>
                  <input
                    type="text"
                    value={formData.cuisineType}
                    onChange={(e) => setFormData({ ...formData, cuisineType: e.target.value })}
                    placeholder="e.g., Italian, Indian, Asian"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rating (1-5)
                  </label>
                  <select
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:outline-none"
                  >
                    <option value="">No rating</option>
                    <option value="1">1 - Poor</option>
                    <option value="2">2 - Fair</option>
                    <option value="3">3 - Good</option>
                    <option value="4">4 - Very Good</option>
                    <option value="5">5 - Excellent</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ingredients
                </label>
                <div className="space-y-2">
                  {formData.ingredients.map((ingredient, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2">
                      <input
                        type="text"
                        placeholder="Ingredient name"
                        value={ingredient.name}
                        onChange={(e) => handleIngredientChange(index, 'name', e.target.value)}
                        className="col-span-5 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:outline-none"
                      />
                      <input
                        type="number"
                        placeholder="Qty"
                        value={ingredient.quantity || ''}
                        onChange={(e) => handleIngredientChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.1"
                        className="col-span-3 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Unit"
                        value={ingredient.unit}
                        onChange={(e) => handleIngredientChange(index, 'unit', e.target.value)}
                        className="col-span-3 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:outline-none"
                      />
                      {formData.ingredients.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveIngredient(index)}
                          className="col-span-1 text-red-500 hover:text-red-700"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleAddIngredient}
                    className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    Add Ingredient
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Instructions
                </label>
                <textarea
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  rows={6}
                  placeholder="Step-by-step cooking instructions..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:outline-none resize-none"
                />
              </div>
              <div className="flex gap-2">
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={actionLoading === editingId}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {actionLoading === editingId ? 'Saving...' : 'Save Changes'}
                </motion.button>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCancel}
                  className="px-4 bg-gray-500 text-white rounded-lg font-medium hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                >
                  Cancel
                </motion.button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Recipe Import Placeholder (FR-43) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 mb-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Import Recipe from URL</h3>
          <p className="text-gray-600 mb-3">Import recipes from popular cooking websites (Coming soon)</p>
          <div className="flex gap-2">
            <input
              type="url"
              placeholder="Paste recipe URL here..."
              disabled
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
            />
            <button
              disabled
              className="px-4 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed"
            >
              Import
            </button>
          </div>
        </motion.div>

        {/* Recipes List */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading recipes...</p>
            </div>
          ) : recipes.length === 0 ? (
            <div className="p-12 text-center">
              <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                No recipes yet
              </h3>
              <p className="text-gray-500 mb-4">
                Start building your recipe library by adding your first recipe
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700"
              >
                <Plus className="w-5 h-5" />
                Add Your First Recipe
              </motion.button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
              <AnimatePresence>
                {recipes.map((recipe) => (
                  <motion.div
                    key={recipe.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    whileHover={{ scale: 1.02 }}
                    className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-xl font-semibold text-gray-900 flex-1">
                        {recipe.title}
                      </h3>
                      <div className="flex gap-1 ml-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleViewRecipe(recipe.id)}
                          className="text-indigo-600 hover:text-indigo-800 p-1"
                          aria-label="View recipe"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleEditClick(recipe)}
                          className="text-indigo-600 hover:text-indigo-800 p-1"
                          aria-label="Edit recipe"
                        >
                          <Edit2 className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDelete(recipe.id, recipe.title)}
                          disabled={actionLoading === recipe.id}
                          className="text-red-500 hover:text-red-700 p-1 disabled:opacity-50"
                          aria-label="Delete recipe"
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </div>
                    {recipe.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {recipe.description}
                      </p>
                    )}
                    {recipe.cuisineType && (
                      <span className="inline-block bg-indigo-100 text-indigo-800 text-xs font-medium px-2 py-1 rounded mb-3">
                        {recipe.cuisineType}
                      </span>
                    )}
                    {renderStars(recipe.rating)}
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs text-gray-500">
                        {recipe.ingredients.length} ingredient{recipe.ingredients.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

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
                      {renderStars(recipe.rating)}
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

