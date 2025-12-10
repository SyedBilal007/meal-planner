import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const cards = [
  {
    title: 'Grocery & Pantry',
    description: 'See what you have at home and what you need to buy.',
    to: '/app/grocery-pantry',
  },
  {
    title: 'Meals',
    description: 'Plan your meals for the week and keep everyone on the same page.',
    to: '/app/meals',
  },
  {
    title: 'Recipes',
    description: 'Browse, create, and organize your recipes.',
    to: '/app/recipes',
  },
];

export default function OverviewPage() {
  const { user } = useAuth();
  const displayName = user?.username || user?.email || 'there';

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm text-gray-500">Home</p>
        <h1 className="text-3xl font-bold text-gray-900">Welcome back, {displayName}</h1>
        <p className="text-gray-600 max-w-2xl">
          MealSync keeps your pantry, recipes, weekly planner, and grocery lists together. Choose where to go
          next.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.title}
            to={card.to}
            className="block rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{card.title}</h2>
            <p className="text-gray-600">{card.description}</p>
            <span className="mt-3 inline-block text-sm font-medium text-indigo-600">Open</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

