import RecipeLibrary from '../components/RecipeLibrary';

export default function RecipesPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-gray-900">Recipes</h1>
      <p className="text-sm text-gray-600">Browse, create, and organise your recipes.</p>
      <RecipeLibrary />
    </div>
  );
}

