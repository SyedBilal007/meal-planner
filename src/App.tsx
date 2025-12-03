import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HouseholdProvider } from './contexts/HouseholdContext';
import MealPlanner from './components/MealPlanner';
import Pantry from './components/Pantry';
import RecipeLibrary from './components/RecipeLibrary';

function App() {
  return (
    <BrowserRouter>
      <Routes>
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
  );
}

export default App;
