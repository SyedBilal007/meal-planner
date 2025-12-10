import Pantry from '../components/Pantry';
import MealPlanner from '../components/MealPlanner';

export default function GroceryPantryPage() {
  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Grocery & Pantry</h1>
        <p className="text-sm text-gray-600">See what you have at home and what you need to buy.</p>
      </section>

      <div className="space-y-8">
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-900">Pantry</h2>
          <Pantry />
        </section>
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-900">Grocery Lists</h2>
          {/* Reuse existing MealPlanner grocery UI for now */}
          <MealPlanner showMeals={false} showGrocery />
        </section>
      </div>
    </div>
  );
}

