import { AuthProvider } from './contexts/AuthContext';
import { HouseholdProvider } from './contexts/HouseholdContext';
import MealPlanner from './components/MealPlanner';

function App() {
  return (
    <AuthProvider>
      <HouseholdProvider>
        <MealPlanner />
      </HouseholdProvider>
    </AuthProvider>
  );
}

export default App;
