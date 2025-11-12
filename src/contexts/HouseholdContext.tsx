import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { householdAPI } from '../utils/api';
import { connectSocket, joinHousehold, leaveHousehold } from '../utils/socket';
import { useAuth } from './AuthContext';

interface Household {
  id: string;
  name: string;
  inviteCode: string;
  members: Array<{
    id: string;
    userId: string;
    role: string;
    user: {
      id: string;
      email: string;
      name: string | null;
    };
  }>;
}

interface HouseholdContextType {
  households: Household[];
  currentHousehold: Household | null;
  setCurrentHousehold: (household: Household | null) => void;
  createHousehold: (name: string) => Promise<Household>;
  joinHousehold: (inviteCode: string) => Promise<Household>;
  leaveHousehold: (id: string) => Promise<void>;
  refreshHouseholds: () => Promise<void>;
  loading: boolean;
}

const HouseholdContext = createContext<HouseholdContextType | undefined>(undefined);

export const HouseholdProvider = ({ children }: { children: ReactNode }) => {
  const { token } = useAuth();
  const [households, setHouseholds] = useState<Household[]>([]);
  const [currentHousehold, setCurrentHousehold] = useState<Household | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      connectSocket(token);
      refreshHouseholds();
    }
  }, [token]);

  useEffect(() => {
    // Join/leave household room for real-time updates
    if (currentHousehold) {
      joinHousehold(currentHousehold.id);
      return () => {
        leaveHousehold(currentHousehold.id);
      };
    }
  }, [currentHousehold]);

  const refreshHouseholds = async () => {
    try {
      const res = await householdAPI.getAll();
      setHouseholds(res.data);
      
      // Set first household as current if none selected
      if (!currentHousehold && res.data.length > 0) {
        setCurrentHousehold(res.data[0]);
      }
    } catch (error) {
      console.error('Failed to fetch households:', error);
    } finally {
      setLoading(false);
    }
  };

  const createHousehold = async (name: string): Promise<Household> => {
    const res = await householdAPI.create({ name });
    const newHousehold = res.data;
    setHouseholds((prev) => [...prev, newHousehold]);
    setCurrentHousehold(newHousehold);
    return newHousehold;
  };

  const joinHouseholdByCode = async (inviteCode: string): Promise<Household> => {
    const res = await householdAPI.join({ inviteCode });
    const household = res.data;
    setHouseholds((prev) => {
      const exists = prev.find((h) => h.id === household.id);
      if (exists) return prev;
      return [...prev, household];
    });
    setCurrentHousehold(household);
    return household;
  };

  const leaveHouseholdById = async (id: string): Promise<void> => {
    await householdAPI.leave(id);
    setHouseholds((prev) => prev.filter((h) => h.id !== id));
    if (currentHousehold?.id === id) {
      const remaining = households.filter((h) => h.id !== id);
      setCurrentHousehold(remaining.length > 0 ? remaining[0] : null);
    }
  };

  return (
    <HouseholdContext.Provider
      value={{
        households,
        currentHousehold,
        setCurrentHousehold,
        createHousehold,
        joinHousehold: joinHouseholdByCode,
        leaveHousehold: leaveHouseholdById,
        refreshHouseholds,
        loading,
      }}
    >
      {children}
    </HouseholdContext.Provider>
  );
};

export const useHousehold = () => {
  const context = useContext(HouseholdContext);
  if (context === undefined) {
    throw new Error('useHousehold must be used within a HouseholdProvider');
  }
  return context;
};

