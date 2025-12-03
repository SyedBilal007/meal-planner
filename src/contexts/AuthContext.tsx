import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authAPI } from '../utils/api';

interface User {
  id: string;
  email: string;
  name?: string;
  full_name?: string;
  dietaryPreferences?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, full_name?: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'mealsync_token';
const USER_KEY = 'mealsync_user';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem(TOKEN_KEY) || localStorage.getItem('token');
        const storedUser = localStorage.getItem(USER_KEY) || localStorage.getItem('user');

        if (storedToken && storedUser) {
          // Set initial state
          setToken(storedToken);
          try {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
          } catch {
            // Invalid JSON, clear it
            localStorage.removeItem(USER_KEY);
            localStorage.removeItem('user');
          }

          // Verify token is still valid by calling /me endpoint
          try {
            const response = await authAPI.getMe();
            const userData = response.data;
            setUser(userData);
            localStorage.setItem(USER_KEY, JSON.stringify(userData));
            localStorage.setItem('user', JSON.stringify(userData)); // Keep for backward compatibility
          } catch (error: any) {
            // Token invalid or expired
            console.warn('Token validation failed:', error);
            clearAuth();
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        clearAuth();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const clearAuth = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem('token'); // Clear old key for backward compatibility
    localStorage.removeItem('user'); // Clear old key for backward compatibility
    localStorage.removeItem('token_type');
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await authAPI.login({ email, password });
      const data = response.data;

      // Extract token (could be access_token, token, or accessToken)
      const tokenData = data.access_token || data.token || data.accessToken;
      
      if (!tokenData) {
        throw new Error('No token received from server');
      }

      // Extract user data
      const userData = data.user || data;

      // Store in state
      setToken(tokenData);
      setUser(userData);

      // Persist to localStorage
      localStorage.setItem(TOKEN_KEY, tokenData);
      localStorage.setItem('token', tokenData); // Keep for backward compatibility
      localStorage.setItem(USER_KEY, JSON.stringify(userData));
      localStorage.setItem('user', JSON.stringify(userData)); // Keep for backward compatibility

      // Store token type if provided
      if (data.token_type) {
        localStorage.setItem('token_type', data.token_type);
      }
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Clear any partial auth state
      clearAuth();
      
      // Re-throw with user-friendly message
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new Error('Incorrect email or password');
      } else if (error.response?.status === 422) {
        throw new Error('Invalid input. Please check your email and password.');
      } else if (error.code === 'ERR_NETWORK' || error.message?.includes('Network')) {
        throw new Error('Unable to connect to the server. Please check your internet connection.');
      } else {
        throw new Error(error.response?.data?.detail || error.response?.data?.message || 'Login failed. Please try again.');
      }
    }
  };

  const register = async (email: string, password: string, full_name?: string) => {
    try {
      const response = await authAPI.register({ email, password, full_name });
      const data = response.data;
      
      // Handle FastAPI response format (could be access_token or token)
      const tokenData = data.access_token || data.token;
      const userData = data.user || data;
      
      if (tokenData) {
        setToken(tokenData);
        localStorage.setItem(TOKEN_KEY, tokenData);
        localStorage.setItem('token', tokenData); // Keep for backward compatibility
      }
      
      if (userData) {
        setUser(userData);
        localStorage.setItem(USER_KEY, JSON.stringify(userData));
        localStorage.setItem('user', JSON.stringify(userData)); // Keep for backward compatibility
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      clearAuth();
      throw error;
    }
  };

  const logout = () => {
    clearAuth();
    // Redirect to login page
    window.location.href = '/login';
  };

  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        token, 
        isAuthenticated,
        login, 
        register, 
        logout, 
        loading 
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
