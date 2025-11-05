import { useAppSelector } from '../store/hooks';
import { login, logout, updateUser } from '../store/slices/authSlice';
import { useAppDispatch } from '../store/hooks';

/**
 * Хук для работы с аутентификацией через Redux
 * Заменяет старый useAuth из AuthContext
 */
export function useAuth() {
  const dispatch = useAppDispatch();
  const auth = useAppSelector((state) => state.auth);

  return {
    user: auth.user,
    token: auth.token,
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoading,
    isAdmin: auth.user?.role === 'ADMIN',
    login: (token: string) => dispatch(login(token)),
    logout: () => dispatch(logout()),
    updateUser: (user: typeof auth.user) => {
      if (user) {
        dispatch(updateUser(user));
      }
    },
  };
}

