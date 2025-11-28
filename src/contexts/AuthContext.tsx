import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { apiService } from '../utils/services/api.service';
import type { User } from '../utils/services/user.service';
import { jwtDecode } from 'jwt-decode';
import { getAccessToken, subscribeToAccessToken, setTokens as persistTokens, clearStoredTokens } from '../utils/authTokens';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  login: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

interface JwtPayload {
  id: number;
  email: string;
  username: string;
  role: 'ADMIN' | 'USER';
  iat?: number;
  exp?: number;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [token, setToken] = useState<string | null>(getAccessToken());
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const applyToken = (value: string | null) => {
      if (value) {
        try {
          const decoded = jwtDecode<JwtPayload>(value);
          setUser({
            id: decoded.id,
            email: decoded.email,
            username: decoded.username,
            role: decoded.role,
            createdAt: '',
            updatedAt: '',
          });
          apiService.setToken(value);
        } catch (error) {
          console.error('Invalid token:', error);
          clearStoredTokens();
          setToken(null);
          setUser(null);
        }
      } else {
        setUser(null);
        apiService.logout();
      }
    };

    const initialToken = getAccessToken();
    setToken(initialToken);
    applyToken(initialToken);
    setIsLoading(false);

    const unsubscribe = subscribeToAccessToken((updatedToken) => {
      setToken(updatedToken);
      applyToken(updatedToken);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const login = (accessToken: string, refreshToken: string) => {
    persistTokens(accessToken, refreshToken);
  };

  const logout = () => {
    clearStoredTokens();
    setToken(null);
    setUser(null);
    apiService.logout();
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    isAdmin: user?.role === 'ADMIN',
    login,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

