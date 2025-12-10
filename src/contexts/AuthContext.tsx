import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../api/userClient';
import type { Household } from '../api/householdClient';
import { getCurrentUser } from '../api/userClient';
import { getMyHouseholds } from '../api/householdClient';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  households: Household[];
  activeHouseholdId: number | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  setActiveHousehold: (id: number) => void;
  loadUserAndHouseholds: () => Promise<void>;
  refreshHouseholds: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [households, setHouseholds] = useState<Household[]>([]);
  const [activeHouseholdId, setActiveHouseholdId] = useState<number | null>(null);
  const hasLoadedRef = useRef(false);

  // Load auth state from localStorage on mount
  useEffect(() => {
    const storedAccessToken = localStorage.getItem('mealsync_access_token');
    const storedUser = localStorage.getItem('mealsync_user');
    const storedActiveHouseholdId = localStorage.getItem('mealsync_active_household_id');
    
    if (storedAccessToken) {
      setToken(storedAccessToken);
      
      // If we have a stored user, use it temporarily
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          console.error('Failed to parse stored user:', e);
        }
      }
      
      // Load active household ID if stored
      if (storedActiveHouseholdId) {
        setActiveHouseholdId(Number(storedActiveHouseholdId));
      }
    }
  }, []);

  // Load user and households when token is available (only once on mount)
  useEffect(() => {
    if (token && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadUserAndHouseholds().catch((error) => {
        // If loading fails (e.g., token expired), logout will be handled by httpClient interceptor
        console.error('Failed to load user and households on mount:', error);
        hasLoadedRef.current = false; // Allow retry
      });
    }
  }, [token, loadUserAndHouseholds]);

  // Listen for 401 unauthorized events from httpClient
  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
      // Redirect is handled by httpClient interceptor
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, [logout]);

  const setAuth = (userData: User, tokenData: string) => {
    setUser(userData);
    setToken(tokenData);
    // Store access token (refresh token is already stored separately in Login component)
    localStorage.setItem('mealsync_access_token', tokenData);
    localStorage.setItem('mealsync_user', JSON.stringify(userData));
  };

  const refreshHouseholds = useCallback(async () => {
    if (!token) return;

    try {
      const householdsData = await getMyHouseholds();
      setHouseholds(householdsData);

      // If no active household is set and we have households, set the first one
      const currentActiveId = activeHouseholdId ?? Number(localStorage.getItem('mealsync_active_household_id'));
      if (currentActiveId === null && householdsData.length > 0) {
        const firstHouseholdId = householdsData[0].id;
        setActiveHouseholdId(firstHouseholdId);
        localStorage.setItem('mealsync_active_household_id', String(firstHouseholdId));
      }
    } catch (error) {
      console.error('Failed to refresh households:', error);
      // Don't throw - allow the app to continue
    }
  }, [token]);

  const loadUserAndHouseholds = useCallback(async () => {
    if (!token) return;

    try {
      // Load current user
      const userData = await getCurrentUser();
      setUser(userData);
      localStorage.setItem('mealsync_user', JSON.stringify(userData));

      // Load households
      const householdsData = await getMyHouseholds();
      setHouseholds(householdsData);

      // If no active household is set and we have households, set the first one
      const currentActiveId = activeHouseholdId ?? Number(localStorage.getItem('mealsync_active_household_id'));
      if (currentActiveId === null && householdsData.length > 0) {
        const firstHouseholdId = householdsData[0].id;
        setActiveHouseholdId(firstHouseholdId);
        localStorage.setItem('mealsync_active_household_id', String(firstHouseholdId));
      }
    } catch (error) {
      console.error('Failed to load user and households:', error);
      throw error; // Re-throw so caller can handle it
    }
  }, [token, activeHouseholdId]);

  const setActiveHousehold = useCallback((id: number) => {
    setActiveHouseholdId(id);
    localStorage.setItem('mealsync_active_household_id', String(id));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    setHouseholds([]);
    setActiveHouseholdId(null);
    localStorage.removeItem('mealsync_access_token');
    localStorage.removeItem('mealsync_refresh_token');
    localStorage.removeItem('mealsync_token_type');
    localStorage.removeItem('mealsync_user');
    localStorage.removeItem('mealsync_active_household_id');
    // Also remove old token key for backward compatibility
    localStorage.removeItem('mealsync_token');
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        households,
        activeHouseholdId,
        setAuth,
        logout,
        setActiveHousehold,
        loadUserAndHouseholds,
        refreshHouseholds: refreshHouseholds,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

