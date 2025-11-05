import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiService } from '../utils/services/api.service';
import type { User } from '../utils/services/user.service';
import { jwtDecode } from 'jwt-decode';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  login: (token: string) => void;
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
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      try {
        const decoded = jwtDecode<JwtPayload>(storedToken);
        setUser({
          id: decoded.id,
          email: decoded.email,
          username: decoded.username,
          role: decoded.role,
          createdAt: '',
          updatedAt: '',
        });
        apiService.setToken(storedToken);
      } catch (error) {
        console.error('Invalid token:', error);
        localStorage.removeItem('token');
        setToken(null);
      }
    }
    setIsLoading(false);
  }, []);

  const login = (newToken: string) => {
    try {
      const decoded = jwtDecode<JwtPayload>(newToken);
      setToken(newToken);
      setUser({
        id: decoded.id,
        email: decoded.email,
        username: decoded.username,
        role: decoded.role,
        createdAt: '',
        updatedAt: '',
      });
      localStorage.setItem('token', newToken);
      apiService.setToken(newToken);
    } catch (error) {
      console.error('Invalid token:', error);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
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

