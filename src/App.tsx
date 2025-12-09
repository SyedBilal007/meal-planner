import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { HouseholdProvider } from './contexts/HouseholdContext';
import Login from './components/Login';
import MealPlanner from './components/MealPlanner';
import Pantry from './components/Pantry';
import RecipeLibrary from './components/RecipeLibrary';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <HouseholdProvider>
                <MealPlanner />
              </HouseholdProvider>
            }
          />
          <Route
            path="/pantry"
            element={<Pantry />}
          />
          <Route
            path="/recipes"
            element={<RecipeLibrary />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
