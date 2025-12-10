import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const navClasses = ({ isActive }: { isActive: boolean }) =>
  [
    'px-3 py-2 rounded-md text-sm font-medium transition-colors',
    isActive ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:text-indigo-700',
  ].join(' ');

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const displayName = user?.username || user?.email || 'User';

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="text-xl font-semibold text-indigo-600">MealSync</div>
            <nav className="flex flex-wrap gap-2">
              <NavLink to="/app" end className={navClasses}>
                Home
              </NavLink>
              <NavLink to="/app/grocery-pantry" className={navClasses}>
                Grocery & Pantry
              </NavLink>
              <NavLink to="/app/meals" className={navClasses}>
                Meals
              </NavLink>
              <NavLink to="/app/ai-meals" className={navClasses}>
                AI Meals
              </NavLink>
              <NavLink to="/app/recipes" className={navClasses}>
                Recipes
              </NavLink>
              <NavLink to="/app/profile" className={navClasses}>
                Profile
              </NavLink>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-600">Hi, {displayName}</div>
            <button
              onClick={handleLogout}
              className="px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}

