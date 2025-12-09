import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../api/authClient';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Load auth state from localStorage on mount
  useEffect(() => {
    const storedAccessToken = localStorage.getItem('mealsync_access_token');
    const storedUser = localStorage.getItem('mealsync_user');
    
    if (storedAccessToken && storedUser) {
      setToken(storedAccessToken);
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const setAuth = (userData: User, tokenData: string) => {
    setUser(userData);
    setToken(tokenData);
    // Store access token (refresh token is already stored separately in Login component)
    localStorage.setItem('mealsync_access_token', tokenData);
    localStorage.setItem('mealsync_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('mealsync_access_token');
    localStorage.removeItem('mealsync_refresh_token');
    localStorage.removeItem('mealsync_token_type');
    localStorage.removeItem('mealsync_user');
    // Also remove old token key for backward compatibility
    localStorage.removeItem('mealsync_token');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        setAuth,
        logout,
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

