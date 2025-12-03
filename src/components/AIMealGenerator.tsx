import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Plus, Loader2 } from 'lucide-react';
import { mockAddMeal } from '../mocks/meals';

interface MealSuggestion {
  name: string;
  description: string;
  recipe?: {
    instructions: string;
    ingredients: Array<{ name: string; quantity: string; unit?: string }>;
  };
}

export default function AIMealGenerator({ onMealAdded }: { onMealAdded?: () => void }) {
  const [showModal, setShowModal] = useState(false);
  const [ingredients, setIngredients] = useState<string[]>(['']);
  const [suggestions, setSuggestions] = useState<MealSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedMealType, setSelectedMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('dinner');

  const addIngredientField = () => {
    setIngredients([...ingredients, '']);
  };

  const updateIngredient = (index: number, value: string) => {
    const updated = [...ingredients];
    updated[index] = value;
    setIngredients(updated);
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const generateMeals = async () => {
    const validIngredients = ingredients.filter((ing) => ing.trim().length > 0);
    if (validIngredients.length === 0) {
      setError('Please add at least one ingredient');
      return;
    }

    setLoading(true);
    setError('');
    setSuggestions([]);

    // AI meal generation is disabled in mock mode
    // In a real implementation, this would call the backend AI API
    setTimeout(() => {
      setError('AI meal generation is not available in mock mode. Please add meals manually.');
      setLoading(false);
    }, 500);
  };

  const addMealToPlan = async (suggestion: MealSuggestion, date: string, _mealType: string) => {
    try {
      // Convert date to yyyy-mm-dd format
      const dateString = new Date(date).toISOString().split('T')[0];
      
      // Build notes from description and recipe if available
      let notes = suggestion.description;
      if (suggestion.recipe) {
        notes += '\n\nIngredients:\n';
        suggestion.recipe.ingredients.forEach(ing => {
          notes += `- ${ing.quantity} ${ing.unit || ''} ${ing.name}\n`;
        });
        notes += `\nInstructions:\n${suggestion.recipe.instructions}`;
      }

      await mockAddMeal({
        title: suggestion.name,
        date: dateString,
        notes: notes || undefined,
      });
      
      if (onMealAdded) {
        onMealAdded();
      }
      setShowModal(false);
    } catch (err: any) {
      console.error('Failed to add meal to plan:', err);
      alert('Failed to add meal to plan');
    }
  };

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
      >
        <Sparkles className="w-4 h-4" />
        AI Meal Generator
      </motion.button>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-purple-600" />
                  <h2 className="text-2xl font-semibold">AI Meal Generator</h2>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Available Ingredients
                  </label>
                  <div className="space-y-2">
                    {ingredients.map((ing, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={ing}
                          onChange={(e) => updateIngredient(index, e.target.value)}
                          placeholder="e.g., chicken, tomatoes, rice"
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        />
                        {ingredients.length > 1 && (
                          <button
                            onClick={() => removeIngredient(index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            aria-label="Remove ingredient"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={addIngredientField}
                      className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      Add ingredient
                    </button>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={generateMeals}
                  disabled={loading}
                  className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate Meal Suggestions
                    </>
                  )}
                </motion.button>

                {suggestions.length > 0 && (
                  <div className="space-y-4 mt-6">
                    <h3 className="text-lg font-semibold">Suggested Meals</h3>
                    {suggestions.map((suggestion, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <h4 className="font-semibold text-lg mb-2">{suggestion.name}</h4>
                        <p className="text-gray-600 text-sm mb-4">{suggestion.description}</p>
                        
                        {suggestion.recipe && (
                          <div className="mb-4">
                            <h5 className="font-medium mb-2">Ingredients:</h5>
                            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                              {suggestion.recipe.ingredients.map((ing, i) => (
                                <li key={i}>
                                  {ing.quantity} {ing.unit || ''} {ing.name}
                                </li>
                              ))}
                            </ul>
                            <h5 className="font-medium mb-2 mt-3">Instructions:</h5>
                            <p className="text-sm text-gray-600 whitespace-pre-line">
                              {suggestion.recipe.instructions}
                            </p>
                          </div>
                        )}

                        <div className="flex gap-2 items-end">
                          <div className="flex-1">
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Date
                            </label>
                            <input
                              type="date"
                              value={selectedDate}
                              onChange={(e) => setSelectedDate(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Meal Type
                            </label>
                            <select
                              value={selectedMealType}
                              onChange={(e) => setSelectedMealType(e.target.value as any)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            >
                              <option value="breakfast">Breakfast</option>
                              <option value="lunch">Lunch</option>
                              <option value="dinner">Dinner</option>
                              <option value="snack">Snack</option>
                            </select>
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => addMealToPlan(suggestion, selectedDate || new Date().toISOString().split('T')[0], selectedMealType)}
                            disabled={!selectedDate}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Add to Plan
                          </motion.button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}




