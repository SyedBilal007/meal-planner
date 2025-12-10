import AiMealGenerator from '../components/AiMealGenerator';

export default function AiMealsPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-sm text-gray-500">AI Assistant</p>
        <h1 className="text-2xl font-semibold text-gray-900">AI Meal Generator</h1>
        <p className="text-sm text-gray-600">
          Paste your ingredients and let AI suggest a simple meal plan.
        </p>
      </header>

      <AiMealGenerator />
    </div>
  );
}

