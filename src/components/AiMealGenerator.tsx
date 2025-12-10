import { useState } from 'react';
import { generateMealPlanFromAI } from '../api/openaiClient';

type AiMealGeneratorProps = {
  className?: string;
};

export default function AiMealGenerator({ className }: AiMealGeneratorProps) {
  const [ingredients, setIngredients] = useState('');
  const [dietaryPreferences, setDietaryPreferences] = useState('');
  const [days, setDays] = useState(3);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ingredients.trim()) {
      setError('Please enter some ingredients first.');
      return;
    }

    setError(null);
    setResult(null);
    setLoading(true);

    try {
      const text = await generateMealPlanFromAI({
        ingredients: ingredients.trim(),
        dietaryPreferences: dietaryPreferences.trim(),
        days: Math.min(Math.max(days || 1, 1), 7),
      });
      setResult(text);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Something went wrong while generating the meal plan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`space-y-4 rounded-xl border bg-white p-4 shadow-sm ${className ?? ''}`}>
      <div>
        <h2 className="text-xl font-semibold text-gray-900">AI Meal Generator</h2>
        <p className="text-sm text-gray-600">
          Paste your ingredients and let AI suggest a simple meal plan.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-800">
            Ingredients in your fridge / pantry
          </label>
          <textarea
            className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            rows={4}
            placeholder="e.g., chicken, rice, tomatoes, onions, yogurt, spinach..."
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-800">
            Dietary preferences / restrictions (optional)
          </label>
          <input
            className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="e.g., halal, vegetarian, high protein, low carb..."
            value={dietaryPreferences}
            onChange={(e) => setDietaryPreferences(e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-800">Number of days</label>
          <input
            type="number"
            min={1}
            max={7}
            className="w-24 rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            value={days}
            onChange={(e) => setDays(Number(e.target.value) || 1)}
          />
        </div>

        {error && <p className="text-xs text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center rounded-md border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100 disabled:opacity-60"
        >
          {loading ? 'Generating...' : 'Generate Meal Plan'}
        </button>
      </form>

      {result && (
        <div className="mt-4 space-y-2">
          <h3 className="text-sm font-semibold text-gray-900">AI Suggestions</h3>
          <div className="whitespace-pre-wrap rounded-md border bg-gray-50 p-3 text-sm">
            {result}
          </div>
        </div>
      )}
    </div>
  );
}

