import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit2, X, Save, Package, AlertCircle, Loader2 } from 'lucide-react';
import {
  mockGetPantry,
  mockAddPantryItem,
  mockUpdatePantryItem,
  mockDeletePantryItem,
  type PantryItem,
} from '../mocks/pantry';

interface PantryFormData {
  name: string;
  quantity: string;
  unit: string;
}

const commonUnits = ['pcs', 'kg', 'g', 'ml', 'l', 'cups', 'tbsp', 'tsp', 'oz', 'lb'];

export default function Pantry() {
  const [items, setItems] = useState<PantryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<PantryFormData>({
    name: '',
    quantity: '',
    unit: '',
  });
  const [editFormData, setEditFormData] = useState<PantryFormData>({
    name: '',
    quantity: '',
    unit: '',
  });
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Fetch pantry items on mount
  useEffect(() => {
    fetchPantryItems();
  }, []);

  const fetchPantryItems = async () => {
    setLoading(true);
    setError('');
    try {
      const items = await mockGetPantry();
      setItems(items);
    } catch (err: any) {
      console.error('Failed to fetch pantry items:', err);
      setError('Could not load pantry. Please try again.');
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

    setActionLoading('add');
    setError('');

    try {
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
      setItems((prev) => [...prev, newItem]);
      setFormData({ name: '', quantity: '', unit: '' });
      setShowAddForm(false);
    } catch (err: any) {
      console.error('Failed to add ingredient:', err);
      setError('Failed to add ingredient. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleEditClick = (item: PantryItem) => {
    setEditingId(item.id);
    setEditFormData({
      name: item.name,
      quantity: item.quantity ?? '',
      unit: item.unit ?? '',
    });
    setError('');
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditFormData({ name: '', quantity: '', unit: '' });
    setError('');
  };

  const handleEditSubmit = async (id: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData.name.trim()) {
      setError('Ingredient name is required');
      return;
    }

    setActionLoading(id);
    setError('');

    try {
      const payload: { name?: string; quantity?: string; unit?: string } = {};

      if (editFormData.name.trim()) {
        payload.name = editFormData.name.trim();
      }

      // Only include quantity if it has a value, otherwise omit (undefined)
      if (editFormData.quantity.trim()) {
        payload.quantity = editFormData.quantity.trim();
      }
      // If empty, don't include in payload (will be undefined, not null)

      // Only include unit if it has a value, otherwise omit (undefined)
      if (editFormData.unit.trim()) {
        payload.unit = editFormData.unit.trim();
      }
      // If empty, don't include in payload (will be undefined, not null)

      const updatedItem = await mockUpdatePantryItem(id, payload);

      if (updatedItem) {
        setItems((prev) =>
          prev.map((item) => (item.id === id ? updatedItem : item))
        );
        setEditingId(null);
        setEditFormData({ name: '', quantity: '', unit: '' });
      } else {
        setError('Ingredient not found');
      }
    } catch (err: any) {
      console.error('Failed to update ingredient:', err);
      setError('Failed to update ingredient. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }

    setActionLoading(id);
    setError('');

    try {
      await mockDeletePantryItem(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err: any) {
      console.error('Failed to delete ingredient:', err);
      setError('Failed to delete ingredient. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

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
              <form onSubmit={handleAddSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                  <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity
                  </label>
                  <input
                    id="quantity"
                    type="text"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="e.g., 500"
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
                      placeholder="e.g., g"
                      disabled={actionLoading === 'add'}
                    />
                    <datalist id="units">
                      {commonUnits.map((unit) => (
                        <option key={unit} value={unit} />
                      ))}
                    </datalist>
                  </div>
                </div>
                <div className="flex items-end">
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
                      Quantity
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
                              className="grid grid-cols-1 md:grid-cols-4 gap-4"
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
                                <input
                                  type="text"
                                  value={editFormData.quantity}
                                  onChange={(e) =>
                                    setEditFormData({ ...editFormData, quantity: e.target.value })
                                  }
                                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                  placeholder="Quantity"
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
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">
                                {item.quantity || '-'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">{item.unit || '-'}</div>
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
