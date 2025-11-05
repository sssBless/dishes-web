import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import filtersReducer from './slices/filtersSlice';

// Создаем store в функции для безопасности
export const createStore = () => {
  return configureStore({
    reducer: {
      auth: authReducer,
      filters: filtersReducer,
    },
  });
};

// Создаем store для использования в приложении
export const store = createStore();

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

