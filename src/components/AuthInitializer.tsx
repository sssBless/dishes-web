import { useEffect } from 'react';
import { useAppDispatch } from '../store/hooks';
import { initializeAuth } from '../store/slices/authSlice';

/**
 * Компонент для инициализации аутентификации из localStorage
 * Вызывается один раз при монтировании приложения
 */
export default function AuthInitializer() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(initializeAuth());
  }, [dispatch]);

  return null;
}

