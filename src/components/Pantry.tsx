import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit2, X, Save, Package, AlertCircle, Loader2, LogOut } from 'lucide-react';
import { USE_MOCK_DATA } from '../config/dataSource';
import {
  mockGetPantry,
  mockAddPantryItem,
  mockUpdatePantryItem,
  mockDeletePantryItem,
  type PantryItem,
} from '../mocks/pantry';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  getHouseholdIngredients,
  createIngredient,
  updateIngredient,
  deleteIngredient,
  searchIngredients,
  type Ingredient,
  type IngredientCategory,
  mapUnitToEnum,
} from '../api/ingredientClient';

interface PantryFormData {
  name: string;
  quantity: string;
  unit: string;
  category: IngredientCategory;
}

const commonUnits = ['pcs', 'kg', 'g', 'ml', 'l', 'cups', 'tbsp', 'tsp', 'oz', 'lb'];
const ingredientCategories: IngredientCategory[] = [
  'produce',
  'meat',
  'seafood',
  'dairy',
  'bakery',
  'pantry',
  'spices',
  'beverages',
  'frozen',
  'snacks',
  'other',
];

export default function Pantry() {
  const { logout, activeHouseholdId } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<PantryFormData>({
    name: '',
    quantity: '',
    unit: 'piece',
    category: 'pantry',
  });
  const [editFormData, setEditFormData] = useState<PantryFormData>({
    name: '',
    quantity: '',
    unit: 'piece',
    category: 'pantry',
  });
  const [actionLoading, setActionLoading] = useState<number | string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchIngredients = useCallback(async () => {
    if (!activeHouseholdId) return;

    setLoading(true);
    setError('');
    try {
      const ingredients = await getHouseholdIngredients(activeHouseholdId, { limit: 1000 });
      setItems(ingredients);
    } catch (err: any) {
      console.error('Failed to fetch ingredients:', err);
      setError(
        err.message ||
        'Could not load pantry ingredients. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }, [activeHouseholdId]);

  // Fetch pantry items when activeHouseholdId changes
  useEffect(() => {
    if (!activeHouseholdId) {
      setItems([]);
      setLoading(false);
      return;
    }

    if (USE_MOCK_DATA) {
      // Use mock data if enabled
      fetchPantryItems();
    } else {
      // Use real API
      fetchIngredients();
    }
  }, [activeHouseholdId, fetchIngredients]);

  // Search ingredients when search query changes
  useEffect(() => {
    if (!activeHouseholdId || USE_MOCK_DATA) return;

    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        searchIngredients(activeHouseholdId, { query: searchQuery.trim(), limit: 100 })
          .then(setItems)
          .catch((err) => {
            console.error('Search failed:', err);
            setError(err.message || 'Search failed');
          });
      } else {
        // Load all ingredients when search is cleared
        fetchIngredients();
      }
    }, 300); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [searchQuery, activeHouseholdId, fetchIngredients]);

  const fetchPantryItems = async () => {
    setLoading(true);
    setError('');
    try {
      const items = await mockGetPantry();
      // Convert mock PantryItem[] to Ingredient[] for display
      const ingredients: Ingredient[] = items.map((item) => ({
        id: Number(item.id) || 0,
        uuid: item.id,
        name: item.name,
        category: 'pantry' as IngredientCategory,
        description: null,
        average_price: item.quantity ? parseFloat(item.quantity) || null : null,
        price_unit: mapUnitToEnum(item.unit || 'piece'),
        household_id: activeHouseholdId || 0,
        created_at: item.created_at || new Date().toISOString(),
        updated_at: item.updated_at || new Date().toISOString(),
      }));
      setItems(ingredients);
    } catch (err: any) {
      console.error('Failed to fetch pantry items:', err);
      setError(
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'Could not load pantry. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Ingredient name is required');
      return;
    }

    if (!activeHouseholdId && !USE_MOCK_DATA) {
      setError('Please select or create a household first');
      return;
    }

    setActionLoading('add');
    setError('');

    try {
      if (USE_MOCK_DATA) {
        const payload: { name: string; quantity?: string; unit?: string } = {
          name: formData.name.trim(),
        };
        if (formData.quantity.trim()) {
          payload.quantity = formData.quantity.trim();
        }
        if (formData.unit.trim()) {
          payload.unit = formData.unit.trim();
        }
        const newItem = await mockAddPantryItem(payload);
        // Convert to Ingredient format
        const ingredient: Ingredient = {
          id: Number(newItem.id) || 0,
          uuid: newItem.id,
          name: newItem.name,
          category: formData.category,
          description: null,
          average_price: newItem.quantity ? parseFloat(newItem.quantity) || null : null,
          price_unit: mapUnitToEnum(newItem.unit || 'piece'),
          household_id: activeHouseholdId || 0,
          created_at: newItem.created_at || new Date().toISOString(),
          updated_at: newItem.updated_at || new Date().toISOString(),
        };
        setItems((prev) => [...prev, ingredient]);
      } else {
        const newIngredient = await createIngredient(activeHouseholdId!, {
          name: formData.name.trim(),
          category: formData.category,
          description: formData.quantity.trim() ? `Quantity: ${formData.quantity}` : undefined,
          average_price: formData.quantity.trim() ? parseFloat(formData.quantity) || undefined : undefined,
          price_unit: mapUnitToEnum(formData.unit || 'piece'),
        });
        setItems((prev) => [...prev, newIngredient]);
      }
      setFormData({ name: '', quantity: '', unit: 'piece', category: 'pantry' });
      setShowAddForm(false);
    } catch (err: any) {
      console.error('Failed to add ingredient:', err);
      setError(err.message || 'Failed to add ingredient. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleEditClick = (item: Ingredient) => {
    setEditingId(item.id);
    setEditFormData({
      name: item.name,
      quantity: item.average_price?.toString() ?? '',
      unit: item.price_unit,
      category: item.category,
    });
    setError('');
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditFormData({ name: '', quantity: '', unit: 'piece', category: 'pantry' });
    setError('');
  };

  const handleEditSubmit = async (id: number, e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData.name.trim()) {
      setError('Ingredient name is required');
      return;
    }

    setActionLoading(id);
    setError('');

    try {
      if (USE_MOCK_DATA) {
        const payload: { name?: string; quantity?: string; unit?: string } = {};
        if (editFormData.name.trim()) {
          payload.name = editFormData.name.trim();
        }
        if (editFormData.quantity.trim()) {
          payload.quantity = editFormData.quantity.trim();
        }
        if (editFormData.unit.trim()) {
          payload.unit = editFormData.unit.trim();
        }
        const updatedItem = await mockUpdatePantryItem(String(id), payload);
        if (updatedItem) {
          const ingredient: Ingredient = {
            id: Number(updatedItem.id) || id,
            uuid: updatedItem.id,
            name: updatedItem.name,
            category: editFormData.category,
            description: null,
            average_price: updatedItem.quantity ? parseFloat(updatedItem.quantity) || null : null,
            price_unit: mapUnitToEnum(updatedItem.unit || 'piece'),
            household_id: activeHouseholdId || 0,
            created_at: updatedItem.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          setItems((prev) =>
            prev.map((item) => (item.id === id ? ingredient : item))
          );
          setEditingId(null);
          setEditFormData({ name: '', quantity: '', unit: 'piece', category: 'pantry' });
        } else {
          setError('Ingredient not found');
        }
      } else {
        const payload: {
          name?: string;
          category?: IngredientCategory;
          description?: string;
          average_price?: number;
          price_unit?: string;
        } = {};

        if (editFormData.name.trim()) {
          payload.name = editFormData.name.trim();
        }
        if (editFormData.category) {
          payload.category = editFormData.category;
        }
        if (editFormData.quantity.trim()) {
          const price = parseFloat(editFormData.quantity);
          if (!isNaN(price)) {
            payload.average_price = price;
          }
        }
        if (editFormData.unit.trim()) {
          payload.price_unit = mapUnitToEnum(editFormData.unit);
        }

        const updated = await updateIngredient(id, payload);
        setItems((prev) =>
          prev.map((item) => (item.id === id ? updated : item))
        );
        setEditingId(null);
        setEditFormData({ name: '', quantity: '', unit: 'piece', category: 'pantry' });
      }
    } catch (err: any) {
      console.error('Failed to update ingredient:', err);
      setError(err.message || 'Failed to update ingredient. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }

    setActionLoading(id);
    setError('');

    try {
      if (USE_MOCK_DATA) {
        await mockDeletePantryItem(String(id));
      } else {
        await deleteIngredient(id);
      }
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err: any) {
      console.error('Failed to delete ingredient:', err);
      setError(
        err.message ||
        'Failed to delete ingredient. Please try again.'
      );
    } finally {
      setActionLoading(null);
    }
  };

  // Show message if no household is selected
  if (!activeHouseholdId && !USE_MOCK_DATA) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="container mx-auto max-w-6xl">
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              No Household Selected
            </h2>
            <p className="text-gray-600 mb-4">
              Please select or create a household to manage its pantry ingredients.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Package className="w-8 h-8 text-indigo-600" />
              <h1 className="text-4xl font-bold text-gray-900">My Pantry</h1>
            </div>
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setShowAddForm(!showAddForm);
                  setError('');
                }}
                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                <Plus className="w-5 h-5" />
                {showAddForm ? 'Cancel' : 'Add Ingredient'}
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
          <p className="text-lg text-gray-600">
            Manage your pantry ingredients and track what you have available
          </p>
        </motion.div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-start gap-2"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </motion.div>
        )}

        {/* Search Bar (only show when not using mock data) */}
        {!USE_MOCK_DATA && (
          <div className="mb-6">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ingredients..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        )}

        {/* Add Ingredient Form */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white rounded-xl shadow-lg p-6 mb-6"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Add New Ingredient</h2>
              <form onSubmit={handleAddSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="md:col-span-2">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Ingredient Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="e.g., Chicken Breast"
                    disabled={actionLoading === 'add'}
                  />
                </div>
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as IngredientCategory })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    disabled={actionLoading === 'add'}
                  >
                    {ingredientCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                    Price/Quantity
                  </label>
                  <input
                    id="quantity"
                    type="number"
                    step="0.01"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="e.g., 5.99"
                    disabled={actionLoading === 'add'}
                  />
                </div>
                <div>
                  <label htmlFor="unit" className="block text-sm font-medium text-gray-700 mb-1">
                    Unit
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="unit"
                      type="text"
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      list="units"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="e.g., piece"
                      disabled={actionLoading === 'add'}
                    />
                    <datalist id="units">
                      {commonUnits.map((unit) => (
                        <option key={unit} value={unit} />
                      ))}
                    </datalist>
                  </div>
                </div>
                <div className="flex items-end md:col-span-5">
                  <motion.button
                    type="submit"
                    disabled={actionLoading === 'add'}
                    whileHover={{ scale: actionLoading === 'add' ? 1 : 1.02 }}
                    whileTap={{ scale: actionLoading === 'add' ? 1 : 0.98 }}
                    className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {actionLoading === 'add' ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Add
                      </>
                    )}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pantry Items List */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading pantry items...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                No ingredients yet
              </h3>
              <p className="text-gray-500 mb-4">
                Start building your pantry by adding your first ingredient
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700"
              >
                <Plus className="w-5 h-5" />
                Add Your First Ingredient
              </motion.button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ingredient Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price/Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unit
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <AnimatePresence>
                    {items.map((item) => (
                      <motion.tr
                        key={item.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="hover:bg-gray-50"
                      >
                        {editingId === item.id ? (
                          // Edit Mode
                          <td colSpan={4} className="px-6 py-4">
                            <form
                              onSubmit={(e) => handleEditSubmit(item.id, e)}
                              className="grid grid-cols-1 md:grid-cols-5 gap-4"
                            >
                              <div className="md:col-span-2">
                                <input
                                  type="text"
                                  value={editFormData.name}
                                  onChange={(e) =>
                                    setEditFormData({ ...editFormData, name: e.target.value })
                                  }
                                  required
                                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                  placeholder="Ingredient name"
                                  disabled={actionLoading === item.id}
                                />
                              </div>
                              <div>
                                <select
                                  value={editFormData.category}
                                  onChange={(e) =>
                                    setEditFormData({ ...editFormData, category: e.target.value as IngredientCategory })
                                  }
                                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                  disabled={actionLoading === item.id}
                                >
                                  {ingredientCategories.map((cat) => (
                                    <option key={cat} value={cat}>
                                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={editFormData.quantity}
                                  onChange={(e) =>
                                    setEditFormData({ ...editFormData, quantity: e.target.value })
                                  }
                                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                  placeholder="Price/Quantity"
                                  disabled={actionLoading === item.id}
                                />
                              </div>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={editFormData.unit}
                                  onChange={(e) =>
                                    setEditFormData({ ...editFormData, unit: e.target.value })
                                  }
                                  list="edit-units"
                                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                  placeholder="Unit"
                                  disabled={actionLoading === item.id}
                                />
                                <datalist id="edit-units">
                                  {commonUnits.map((unit) => (
                                    <option key={unit} value={unit} />
                                  ))}
                                </datalist>
                                <motion.button
                                  type="submit"
                                  disabled={actionLoading === item.id}
                                  whileHover={{ scale: actionLoading === item.id ? 1 : 1.05 }}
                                  whileTap={{ scale: actionLoading === item.id ? 1 : 0.95 }}
                                  className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {actionLoading === item.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Save className="w-4 h-4" />
                                  )}
                                </motion.button>
                                <motion.button
                                  type="button"
                                  onClick={handleEditCancel}
                                  disabled={actionLoading === item.id}
                                  whileHover={{ scale: actionLoading === item.id ? 1 : 1.05 }}
                                  whileTap={{ scale: actionLoading === item.id ? 1 : 0.95 }}
                                  className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <X className="w-4 h-4" />
                                </motion.button>
                              </div>
                            </form>
                          </td>
                        ) : (
                          // View Mode
                          <>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{item.name}</div>
                              <div className="text-xs text-gray-400 capitalize">{item.category}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">
                                {item.average_price !== null && item.average_price !== undefined
                                  ? item.average_price.toFixed(2)
                                  : '-'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500 capitalize">{item.price_unit || '-'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex justify-end gap-2">
                                <motion.button
                                  onClick={() => handleEditClick(item)}
                                  disabled={!!actionLoading}
                                  whileHover={{ scale: actionLoading ? 1 : 1.1 }}
                                  whileTap={{ scale: actionLoading ? 1 : 0.9 }}
                                  className="p-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Edit"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </motion.button>
                                <motion.button
                                  onClick={() => handleDelete(item.id, item.name)}
                                  disabled={!!actionLoading}
                                  whileHover={{ scale: actionLoading ? 1 : 1.1 }}
                                  whileTap={{ scale: actionLoading ? 1 : 0.9 }}
                                  className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Delete"
                                >
                                  {actionLoading === item.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="w-4 h-4" />
                                  )}
                                </motion.button>
                              </div>
                            </td>
                          </>
                        )}
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
