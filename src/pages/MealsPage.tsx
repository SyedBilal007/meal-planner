import MealPlanner from '../components/MealPlanner';

export default function MealsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-gray-900">Meals</h1>
      <p className="text-sm text-gray-600">Plan your meals and keep your week organised.</p>
      <MealPlanner showGrocery={false} />
    </div>
  );
}

