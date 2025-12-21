import { useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { generateMealPlan, saveMealPlan } from '../api/aiClient';
import type { AiMealSuggestion, SaveMealItem } from '../api/aiClient';

/**
 * Extended meal suggestion with all fields from backend response
 */
type ExtendedMealSuggestion = AiMealSuggestion & {
  meal_date: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  meal_name: string;
  ingredients_used: string[];
  requires_shopping?: boolean;
  additional_ingredients_needed?: string[];
  estimated_prep_time_minutes?: number;
  estimated_calories?: number;
};

type AiMealGeneratorProps = {
  className?: string;
};

export default function AiMealGenerator({ className }: AiMealGeneratorProps) {
  const { activeHouseholdId, households } = useAuth();

  // Get household ID
  const householdId = activeHouseholdId ?? households[0]?.id ?? null;

  // Form state
  const [days, setDays] = useState(7);
  const [mealsPerDay, setMealsPerDay] = useState(3);
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [servings, setServings] = useState(4);
  const [useAvailableOnly, setUseAvailableOnly] = useState(true);
  const [dietaryPreferences, setDietaryPreferences] = useState('');
  const [preferredMealTypes, setPreferredMealTypes] = useState<{
    breakfast: boolean;
    lunch: boolean;
    dinner: boolean;
    snack: boolean;
  }>({
    breakfast: false,
    lunch: false,
    dinner: false,
    snack: false,
  });

  // Results state
  const [suggestions, setSuggestions] = useState<ExtendedMealSuggestion[]>([]);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Check if no household
  if (!householdId) {
    return (
      <div className={`space-y-4 rounded-xl border bg-white p-4 shadow-sm ${className ?? ''}`}>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">AI Meal Generator</h2>
        </div>
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          No household found. Create or join a household first.
        </div>
      </div>
    );
  }

  const handleGenerate = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setSuggestions([]);
    setSelectedSuggestions(new Set());

    // Validate householdId
    if (!householdId || typeof householdId !== 'number' || householdId <= 0) {
      setError('No household found. Create or join a household first.');
      return;
    }

    // Validate days
    const validatedDays = Math.floor(Number(days));
    if (isNaN(validatedDays) || validatedDays < 1 || validatedDays > 7) {
      setError('Days must be a number between 1 and 7.');
      return;
    }

    // Validate meals_per_day
    const validatedMealsPerDay = Math.floor(Number(mealsPerDay));
    if (isNaN(validatedMealsPerDay) || validatedMealsPerDay < 1 || validatedMealsPerDay > 6) {
      setError('Meals per day must be a number between 1 and 6.');
      return;
    }

    // Validate start_date (must be YYYY-MM-DD format or empty)
    let validatedStartDate = startDate.trim();
    if (validatedStartDate) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(validatedStartDate)) {
        setError('Start date must be in YYYY-MM-DD format (e.g., 2024-01-15).');
        return;
      }
      // Additional validation: check if it's a valid date
      const dateObj = new Date(validatedStartDate);
      if (isNaN(dateObj.getTime())) {
        setError('Start date is not a valid date.');
        return;
      }
    }

    setLoading(true);

    try {
      // Build ingredients array (empty for now, backend will use pantry if use_available_only is true)
      const ingredients: string[] = [];

      // Build dietary preferences array
      const dietaryPrefsArray = dietaryPreferences
        .split(',')
        .map((p) => p.trim())
        .filter((p) => p.length > 0);

      // Build preferred meal types array
      const mealTypesArray: string[] = [];
      if (preferredMealTypes.breakfast) mealTypesArray.push('breakfast');
      if (preferredMealTypes.lunch) mealTypesArray.push('lunch');
      if (preferredMealTypes.dinner) mealTypesArray.push('dinner');
      if (preferredMealTypes.snack) mealTypesArray.push('snack');

      // Use validated start date or default to today
      const finalStartDate = validatedStartDate || new Date().toISOString().split('T')[0];

      const payload = {
        household_id: householdId,
        days: validatedDays,
        meals_per_day: validatedMealsPerDay,
        start_date: finalStartDate,
        servings: Math.max(1, Math.floor(Number(servings)) || 1),
        use_available_only: useAvailableOnly,
        ...(dietaryPrefsArray.length > 0 && { dietary_preferences: dietaryPrefsArray }),
        ...(mealTypesArray.length > 0 && { preferred_meal_types: mealTypesArray }),
        ...(ingredients.length > 0 && { ingredients }),
      };

      // Log payload in development
      if (import.meta.env.DEV) {
        console.log('AI Meal Plan Generation Payload:', payload);
      }

      const response = await generateMealPlan(payload);

      // Transform response to ExtendedMealSuggestion format
      // Backend returns: { success: true, data: { meal_suggestions: [...] } }
      // generateMealPlan returns: { meal_suggestions: [...] }
      const extendedSuggestions = (response.meal_suggestions as any[]).map((suggestion) => ({
        ...suggestion,
        meal_name: suggestion.meal_name || suggestion.name,
        meal_date: suggestion.meal_date || finalStartDate,
        meal_type: suggestion.meal_type || 'dinner',
        ingredients_used: suggestion.ingredients_used || [],
        requires_shopping: suggestion.requires_shopping ?? false,
        additional_ingredients_needed: suggestion.additional_ingredients_needed || [],
        estimated_prep_time_minutes: suggestion.estimated_prep_time_minutes,
        estimated_calories: suggestion.estimated_calories,
      })) as ExtendedMealSuggestion[];

      setSuggestions(extendedSuggestions);
      // Select all by default
      setSelectedSuggestions(new Set(extendedSuggestions.map((_, i) => i)));
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to generate meal plan');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (selectedSuggestions.size === 0) {
      setError('Please select at least one meal to save');
      return;
    }

    setError(null);
    setSuccessMessage(null);
    setSaving(true);

    try {
      const selectedItems = Array.from(selectedSuggestions).map(
        (index) => suggestions[index]
      );

      const savePayload = {
        household_id: householdId,
        auto_create_ingredients: true,
        auto_match_recipes: true,
        meals: selectedItems.map((suggestion) => ({
          meal_name: suggestion.meal_name,
          meal_type: suggestion.meal_type,
          meal_date: suggestion.meal_date,
          description: suggestion.description,
          servings,
          recipe_id: null,
          assigned_to_id: null,
          ingredients_used: suggestion.ingredients_used,
          additional_ingredients_needed: suggestion.additional_ingredients_needed || [],
          estimated_prep_time_minutes: suggestion.estimated_prep_time_minutes,
          estimated_calories: suggestion.estimated_calories,
        })) as SaveMealItem[],
      };

      await saveMealPlan(savePayload);

      setSuccessMessage(`Saved ${selectedItems.length} meal(s)`);
      // Clear suggestions after successful save
      setSuggestions([]);
      setSelectedSuggestions(new Set());
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to save meal plan');
    } finally {
      setSaving(false);
    }
  };

  const toggleSelection = (index: number) => {
    const newSelected = new Set(selectedSuggestions);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedSuggestions(newSelected);
  };

  // Group suggestions by date and meal type
  const groupedSuggestions = suggestions.reduce((acc, suggestion, index) => {
    const date = suggestion.meal_date;
    const mealType = suggestion.meal_type;
    const key = `${date}-${mealType}`;

    if (!acc[key]) {
      acc[key] = {
        date,
        mealType,
        items: [],
      };
    }

    acc[key].items.push({ suggestion, index });
    return acc;
  }, {} as Record<string, { date: string; mealType: string; items: Array<{ suggestion: ExtendedMealSuggestion; index: number }> }>);

  const groupedArray = Object.values(groupedSuggestions).sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    const order = ['breakfast', 'lunch', 'dinner', 'snack'];
    return order.indexOf(a.mealType) - order.indexOf(b.mealType);
  });

  return (
    <div className={`space-y-4 rounded-xl border bg-white p-4 shadow-sm ${className ?? ''}`}>
      <div>
        <h2 className="text-xl font-semibold text-gray-900">AI Meal Generator</h2>
        <p className="text-sm text-gray-600">
          Generate personalized meal suggestions based on your preferences and available ingredients.
        </p>
      </div>

      <form onSubmit={handleGenerate} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-800">
              Days (1-7)
            </label>
            <input
              type="number"
              min={1}
              max={7}
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={days}
              onChange={(e) => setDays(Math.min(Math.max(Number(e.target.value) || 1, 1), 7))}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-800">
              Meals per day (1-6)
            </label>
            <input
              type="number"
              min={1}
              max={6}
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={mealsPerDay}
              onChange={(e) => setMealsPerDay(Math.min(Math.max(Number(e.target.value) || 1, 1), 6))}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-800">
              Start date
            </label>
            <input
              type="date"
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-800">
              Servings
            </label>
            <input
              type="number"
              min={1}
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={servings}
              onChange={(e) => setServings(Math.max(Number(e.target.value) || 1, 1))}
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={useAvailableOnly}
              onChange={(e) => setUseAvailableOnly(e.target.checked)}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm font-medium text-gray-800">
              Use available ingredients only
            </span>
          </label>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-800">
            Dietary preferences (comma separated)
          </label>
          <input
            type="text"
            className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="e.g., vegetarian, halal, high protein, low carb"
            value={dietaryPreferences}
            onChange={(e) => setDietaryPreferences(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-800">
            Preferred meal types (optional)
          </label>
          <div className="flex flex-wrap gap-4">
            {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((type) => (
              <label key={type} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={preferredMealTypes[type]}
                  onChange={(e) =>
                    setPreferredMealTypes((prev) => ({ ...prev, [type]: e.target.checked }))
                  }
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700 capitalize">{type}</span>
              </label>
            ))}
          </div>
        </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
            {successMessage}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center rounded-md border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100 disabled:opacity-60"
        >
          {loading ? 'Generating...' : 'Generate Suggestions'}
        </button>
      </form>

      {suggestions.length > 0 && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Suggestions ({selectedSuggestions.size} selected)
            </h3>
            <button
              onClick={handleSave}
              disabled={saving || selectedSuggestions.size === 0}
              className="inline-flex items-center rounded-md border border-green-200 bg-green-50 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-100 disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save Selected Meals'}
            </button>
          </div>

          <div className="space-y-6">
            {groupedArray.map((group, groupIndex) => (
              <div key={`${group.date}-${group.mealType}-${groupIndex}`} className="space-y-2">
                <div className="flex items-center space-x-2 border-b pb-1">
                  <span className="text-sm font-semibold text-gray-900 capitalize">
                    {new Date(group.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                  <span className="text-sm text-gray-500 capitalize">• {group.mealType}</span>
                </div>

                <div className="space-y-3">
                  {group.items.map(({ suggestion, index }) => (
                    <div
                      key={index}
                      className={`rounded-md border p-4 ${
                        suggestion.requires_shopping
                          ? 'border-orange-200 bg-orange-50'
                          : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          checked={selectedSuggestions.has(index)}
                          onChange={() => toggleSelection(index)}
                          className="mt-1 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <div className="flex-1 space-y-2">
                          <div>
                            <h4 className="font-semibold text-gray-900">{suggestion.meal_name}</h4>
                            {suggestion.description && (
                              <p className="text-sm text-gray-600">{suggestion.description}</p>
                            )}
                          </div>

                          {suggestion.ingredients_used && suggestion.ingredients_used.length > 0 && (
                            <div>
                              <span className="text-xs font-medium text-gray-700">
                                Ingredients used:
                              </span>
                              <p className="text-xs text-gray-600">
                                {suggestion.ingredients_used.join(', ')}
                              </p>
                            </div>
                          )}

                          {suggestion.requires_shopping &&
                            suggestion.additional_ingredients_needed &&
                            suggestion.additional_ingredients_needed.length > 0 && (
                              <div className="rounded-md border border-orange-300 bg-orange-100 p-2">
                                <span className="text-xs font-medium text-orange-800">
                                  Additional ingredients needed:
                                </span>
                                <p className="text-xs text-orange-700">
                                  {suggestion.additional_ingredients_needed.join(', ')}
                                </p>
                              </div>
                            )}

                          <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                            {suggestion.estimated_prep_time_minutes && (
                              <span>⏱ {suggestion.estimated_prep_time_minutes} min</span>
                            )}
                            {suggestion.estimated_calories && (
                              <span>🔥 {suggestion.estimated_calories} cal</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
