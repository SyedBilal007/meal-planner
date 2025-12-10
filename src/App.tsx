import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { HouseholdProvider } from './contexts/HouseholdContext';
import Login from './components/Login';
import Register from './components/Register';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/AppLayout';
import OverviewPage from './pages/OverviewPage';
import GroceryPantryPage from './pages/GroceryPantryPage';
import MealsPage from './pages/MealsPage';
import RecipesPage from './pages/RecipesPage';
import AiMealsPage from './pages/AiMealsPage';
import ProfilePage from './pages/ProfilePage';

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<ProtectedRoute />}>
        <Route
          path="/app"
          element={
            <HouseholdProvider>
              <AppLayout />
            </HouseholdProvider>
          }
        >
          <Route index element={<OverviewPage />} />
          <Route path="grocery-pantry" element={<GroceryPantryPage />} />
          <Route path="meals" element={<MealsPage />} />
          <Route path="ai-meals" element={<AiMealsPage />} />
          <Route path="recipes" element={<RecipesPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Route>
      <Route path="/" element={<Navigate to={isAuthenticated ? '/app' : '/login'} replace />} />
      <Route path="*" element={<Navigate to={isAuthenticated ? '/app' : '/login'} replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
