import { redirect } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { apiService } from './services/api.service';
import type { User } from './services/user.service';

// Проверка авторизации
export function requireAuth() {
  const token = localStorage.getItem('token');
  if (!token) {
    throw redirect('/login');
  }
  apiService.setToken(token);
  return null;
}

// Проверка прав администратора
export function requireAdmin(user: User | null) {
  if (!user || user.role !== 'ADMIN') {
    throw redirect('/');
  }
  return null;
}

// Loader для списка блюд
export async function dishesLoader() {
  try {
    await requireAuth();
    
    // Проверяем, является ли пользователь админом
    const token = localStorage.getItem('token');
    if (token) {
      const decoded = jwtDecode<{ id: number; role: string }>(token);
      if (decoded.role === 'ADMIN') {
        // Редиректим админов на админ-панель
        throw redirect('/admin');
      }
    }
    
    const [dishes, ingredients] = await Promise.all([
      apiService.dishService.getAllDishes(),
      apiService.ingredientsService.getAllIngredients(),
    ]);
    return { dishes, ingredients };
  } catch (error: any) {
    if (error.status === 401 || error.message?.includes('401')) {
      throw redirect('/login');
    }
    if (error.status === 302 || error.redirect) {
      throw error; // Redirect
    }
    throw error;
  }
}

// Loader для детального просмотра блюда
export async function dishLoader({ params }: { params: { id?: string } }) {
  try {
    await requireAuth();
    if (!params.id) {
      throw new Response('Not Found', { status: 404 });
    }
    const dish = await apiService.dishService.getDishById(Number(params.id));
    if (!dish) {
      throw new Response('Not Found', { status: 404 });
    }
    return { dish };
  } catch (error: any) {
    if (error.status === 401 || error.message?.includes('401')) {
      throw redirect('/login');
    }
    if (error.status === 404) {
      throw error;
    }
    throw new Response('Error loading dish', { status: 500 });
  }
}

// Loader для формы блюда (создание/редактирование)
export async function dishFormLoader({ params }: { params: { id?: string } }) {
  try {
    await requireAuth();
    const token = localStorage.getItem('token');
    if (!token) {
      throw redirect('/login');
    }
    
    // Получаем информацию о пользователе из токена
    const decoded = jwtDecode<{ id: number; role: string }>(token);
    const user = await apiService.userService.getUserById(decoded.id);
    
    const ingredients = await apiService.ingredientsService.getAllIngredients();
    
    if (params.id) {
      const dish = await apiService.dishService.getDishById(Number(params.id));
      if (!dish) {
        throw new Response('Not Found', { status: 404 });
      }
      
      // Админы могут редактировать любые блюда
      // Владельцы могут редактировать свои блюда со статусом PENDING (после обновления одобренного блюда)
      const isOwner = user.id === dish.authorId;
      if (user.role !== 'ADMIN' && (!isOwner || dish.status !== 'PENDING')) {
        throw redirect(`/dishes/${params.id}`);
      }
      
      return { dish, ingredients, isEdit: true };
    }
    
    return { dish: null, ingredients, isEdit: false };
  } catch (error: any) {
    if (error.status === 401 || error.message?.includes('401')) {
      throw redirect('/login');
    }
    if (error.status === 404 || error.status === 403) {
      throw error;
    }
    if (error.status === 302 || error.redirect) {
      throw error; // Redirect
    }
    throw new Response('Error loading form data', { status: 500 });
  }
}

// Loader для админ-панели
export async function adminLoader() {
  try {
    await requireAuth();
    const [dishes, users] = await Promise.all([
      apiService.dishService.getAllDishes(),
      apiService.userService.getAllUsers(),
    ]);
    return { dishes, users };
  } catch (error: any) {
    if (error.status === 401 || error.message?.includes('401')) {
      throw redirect('/login');
    }
    throw error;
  }
}

// Loader для страницы "Мои блюда"
export async function myDishesLoader() {
  try {
    await requireAuth();
    const token = localStorage.getItem('token');
    if (!token) {
      throw redirect('/login');
    }
    
    // Получаем информацию о пользователе из токена
    const decoded = jwtDecode<{ id: number }>(token);
    const userId = decoded.id;
    
    // Загружаем блюда пользователя
    const dishes = await apiService.dishService.getAllDishes({ authorId: userId });
    
    return { dishes };
  } catch (error: any) {
    if (error.status === 401 || error.message?.includes('401')) {
      throw redirect('/login');
    }
    throw error;
  }
}

