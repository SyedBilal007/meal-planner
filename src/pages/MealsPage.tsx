import MealPlanner from '../components/MealPlanner';
import AiMealGenerator from '../components/AiMealGenerator';

export default function MealsPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-gray-900">Meals</h1>
        <p className="text-sm text-gray-600">
          Plan your meals and get AI ideas based on what you already have.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <AiMealGenerator />
        </div>
        <div className="space-y-4">
          <MealPlanner showGrocery={false} />
        </div>
      </div>
    </div>
  );
}

