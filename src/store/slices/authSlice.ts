import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { User } from '../../utils/services/user.service';
import { jwtDecode } from 'jwt-decode';
import { apiService } from '../../utils/services/api.service';
import { getAccessToken, setTokens, clearStoredTokens } from '../../utils/authTokens';

interface JwtPayload {
  id: number;
  email: string;
  username: string;
  role: 'ADMIN' | 'USER';
  iat?: number;
  exp?: number;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Начальное состояние (без доступа к localStorage на верхнем уровне)
const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true, // Устанавливаем в true, чтобы инициализировать после монтирования
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Инициализация из localStorage (вызывается после монтирования приложения)
    initializeAuth: (state) => {
      const token = getAccessToken();
      if (token) {
        try {
          const decoded = jwtDecode<JwtPayload>(token);
          state.user = {
            id: decoded.id,
            email: decoded.email,
            username: decoded.username,
            role: decoded.role,
            createdAt: '',
            updatedAt: '',
          };
          state.token = token;
          state.isAuthenticated = true;
          apiService.setToken(token);
        } catch (error) {
          console.error('Invalid token:', error);
          clearStoredTokens();
          state.token = null;
          state.user = null;
          state.isAuthenticated = false;
        }
      }
      state.isLoading = false;
    },
    login: (state, action: PayloadAction<{accessToken: string; refreshToken: string}>) => {
      const { accessToken, refreshToken } = action.payload;
      try {
        const decoded = jwtDecode<JwtPayload>(accessToken);
        
        const user: User = {
          id: decoded.id,
          email: decoded.email,
          username: decoded.username,
          role: decoded.role,
          createdAt: '',
          updatedAt: '',
        };

        state.token = accessToken;
        state.user = user;
        state.isAuthenticated = true;

        setTokens(accessToken, refreshToken);
        apiService.setToken(accessToken);
      } catch (error) {
        console.error('Invalid token:', error);
        state.token = null;
        state.user = null;
        state.isAuthenticated = false;
      }
    },
    logout: (state) => {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
      clearStoredTokens();
      apiService.logout();
    },
    updateUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});

export const { initializeAuth, login, logout, updateUser, setLoading } = authSlice.actions;
export default authSlice.reducer;

