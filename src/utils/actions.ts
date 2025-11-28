import { redirect } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { apiService } from './services/api.service';
import { setTokens } from './authTokens';
import type { CreateDishInput, UpdateDishInput, DishIngredient } from './services/dish.service';

// Action для логина
export async function loginAction({ request }: { request: Request }) {
  const formData = await request.formData();
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Email и пароль обязательны' };
  }

  try {
    const response = await apiService.userService.login({ email, password });
    setTokens(response.accessToken, response.refreshToken);
    
    const redirectTo = new URL(request.url).searchParams.get('redirect') || '/';
    throw redirect(redirectTo);
  } catch (error: any) {
    if (error instanceof Response && error.status === 302) {
      throw error; // Re-throw redirects
    }
    return { error: error.message || 'Ошибка входа' };
  }
}

// Action для регистрации
export async function registerAction({ request }: { request: Request }) {
  const formData = await request.formData();
  const email = formData.get('email') as string;
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (!email || !username || !password || !confirmPassword) {
    return { error: 'Все поля обязательны' };
  }

  if (password !== confirmPassword) {
    return { error: 'Пароли не совпадают' };
  }

  if (password.length < 6) {
    return { error: 'Пароль должен быть не менее 6 символов' };
  }

  if (username.length < 3) {
    return { error: 'Имя пользователя должно быть не менее 3 символов' };
  }

  try {
    await apiService.userService.register({ email, username, password });
    const response = await apiService.userService.login({ email, password });
    setTokens(response.accessToken, response.refreshToken);
    
    throw redirect('/');
  } catch (error: any) {
    if (error instanceof Response && error.status === 302) {
      throw error; // Re-throw redirects
    }
    return { error: error.message || 'Ошибка регистрации' };
  }
}

// Action для создания блюда
export async function createDishAction({ request }: { request: Request }) {
  await requireAuth();
  
  const formData = await request.formData();
  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const authorId = formData.get('authorId') as string;
  const image = formData.get('image') as File | null;

  if (!name || !authorId) {
    return { error: 'Название блюда обязательно' };
  }

  // Парсинг ингредиентов из FormData
  const ingredients: DishIngredient[] = [];
  // FormData передает ингредиенты как ingredients[0].ingredientId, ingredients[0].quantity, ingredients[0].unit и т.д.
  const entries = Array.from(formData.entries());
  const ingredientMap = new Map<number, { ingredientId: number; quantity: number; unit?: string }>();
  
  entries.forEach(([key, value]) => {
    const match = key.match(/^ingredients\[(\d+)\]\.(ingredientId|quantity|unit)$/);
    if (match) {
      const index = Number(match[1]);
      const field = match[2];
      
      if (!ingredientMap.has(index)) {
        ingredientMap.set(index, { ingredientId: 0, quantity: 0, unit: 'г' });
      }
      
      const ingredient = ingredientMap.get(index)!;
      if (field === 'ingredientId') {
        ingredient.ingredientId = Number(value);
      } else if (field === 'quantity') {
        ingredient.quantity = Number(value);
      } else if (field === 'unit') {
        ingredient.unit = value as string;
      }
    }
  });
  
  Array.from(ingredientMap.values()).forEach((ing) => {
    if (ing.ingredientId > 0 && ing.quantity > 0) {
      ingredients.push({ 
        ingredientId: ing.ingredientId, 
        quantity: ing.quantity,
        unit: ing.unit || 'г'
      });
    }
  });

  const recipe = formData.get('recipe') as string;
  const cookingTime = formData.get('cookingTime') as string;

  try {
    const dishData: CreateDishInput = {
      name,
      description: description || undefined,
      recipe: recipe || undefined,
      cookingTime: cookingTime ? Number(cookingTime) : undefined,
      authorId: Number(authorId),
      ingredients: ingredients.length > 0 ? ingredients : undefined,
    };

    const dish = await apiService.dishService.createDish(dishData);

    // Загрузка изображения если есть
    if (image && image.size > 0 && dish.id) {
      await apiService.dishService.uploadImage(dish.id, image);
    }

    throw redirect(`/dishes/${dish.id}`);
  } catch (error: any) {
    if (error instanceof Response && error.status === 302) {
      throw error;
    }
    return { error: error.message || 'Ошибка создания блюда' };
  }
}

// Action для обновления блюда
export async function updateDishAction({
  request,
  params,
}: {
  request: Request;
  params: { id?: string };
}) {
  await requireAuth();
  
  // Проверка прав: админ или владелец блюда со статусом PENDING
  const token = localStorage.getItem('token');
  if (token) {
    const decoded = jwtDecode<{ id: number; role: string }>(token);
    const dish = await apiService.dishService.getDishById(Number(params.id));
    if (!dish) {
      return { error: 'Блюдо не найдено' };
    }
    
    const isOwner = decoded.id === dish.authorId;
    if (decoded.role !== 'ADMIN' && (!isOwner || dish.status !== 'PENDING')) {
      return { error: 'У вас нет прав для редактирования этого блюда' };
    }
  }

  if (!params.id) {
    return { error: 'ID блюда не указан' };
  }

  const formData = await request.formData();
  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const recipe = formData.get('recipe') as string;
  const cookingTime = formData.get('cookingTime') as string;
  const image = formData.get('image') as File | null;

  if (!name) {
    return { error: 'Название блюда обязательно' };
  }

  // Парсинг ингредиентов из FormData
  const ingredients: DishIngredient[] = [];
  // FormData передает ингредиенты как ingredients[0].ingredientId, ingredients[0].quantity, ingredients[0].unit и т.д.
  const entries = Array.from(formData.entries());
  const ingredientMap = new Map<number, { ingredientId: number; quantity: number; unit?: string }>();
  
  entries.forEach(([key, value]) => {
    const match = key.match(/^ingredients\[(\d+)\]\.(ingredientId|quantity|unit)$/);
    if (match) {
      const index = Number(match[1]);
      const field = match[2];
      
      if (!ingredientMap.has(index)) {
        ingredientMap.set(index, { ingredientId: 0, quantity: 0, unit: 'г' });
      }
      
      const ingredient = ingredientMap.get(index)!;
      if (field === 'ingredientId') {
        ingredient.ingredientId = Number(value);
      } else if (field === 'quantity') {
        ingredient.quantity = Number(value);
      } else if (field === 'unit') {
        ingredient.unit = value as string;
      }
    }
  });
  
  Array.from(ingredientMap.values()).forEach((ing) => {
    if (ing.ingredientId > 0 && ing.quantity > 0) {
      ingredients.push({ 
        ingredientId: ing.ingredientId, 
        quantity: ing.quantity,
        unit: ing.unit || 'г'
      });
    }
  });

  try {
    const updateData: UpdateDishInput = {
      name,
      description: description || undefined,
      recipe: recipe || undefined,
      cookingTime: cookingTime ? Number(cookingTime) : undefined,
    };

    await apiService.dishService.updateDish(Number(params.id), updateData);

    // Обновление ингредиентов если есть
    if (ingredients.length > 0) {
      await apiService.dishService.updateDishIngredients(Number(params.id), ingredients);
    }

    // Загрузка изображения если есть
    if (image && image.size > 0) {
      await apiService.dishService.uploadImage(Number(params.id), image);
    }

    throw redirect(`/dishes/${params.id}`);
  } catch (error: any) {
    if (error instanceof Response && error.status === 302) {
      throw error;
    }
    return { error: error.message || 'Ошибка обновления блюда' };
  }
}

// Action для обновления владельцем одобренного блюда (меняет статус на PENDING и перенаправляет на форму редактирования)
export async function updateDishForOwnerAction({
  params,
}: {
  request?: Request;
  params: { id?: string };
}) {
  await requireAuth();

  if (!params.id) {
    return { error: 'ID блюда не указан' };
  }

  const token = localStorage.getItem('token');
  if (!token) {
    throw redirect('/login');
  }

  try {
    const decoded = jwtDecode<{ id: number }>(token);
    const userId = decoded.id;
    
    // Получаем блюдо
    const dish = await apiService.dishService.getDishById(Number(params.id));
    if (!dish) {
      throw new Response('Not Found', { status: 404 });
    }

    // Проверяем, что пользователь - владелец и блюдо одобрено
    if (dish.authorId !== userId) {
      return { error: 'У вас нет прав для обновления этого блюда' };
    }

    if (dish.status !== 'ACCEPTED') {
      return { error: 'Можно обновить только одобренные блюда' };
    }

    // Меняем статус на PENDING
    await apiService.dishService.changeStatus(Number(params.id), 'PENDING');

    // Перенаправляем на форму редактирования
    throw redirect(`/dishes/${params.id}/edit`);
  } catch (error: any) {
    if (error instanceof Response && error.status === 302) {
      throw error;
    }
    if (error.status === 404) {
      throw error;
    }
    return { error: error.message || 'Ошибка обновления блюда' };
  }
}

// Action для удаления блюда
export async function deleteDishAction({
  params,
}: {
  request?: Request;
  params: { id?: string };
}) {
  await requireAuth();

  if (!params.id) {
    return { error: 'ID блюда не указан' };
  }

  try {
    await apiService.dishService.deleteDish(Number(params.id));
    throw redirect('/');
  } catch (error: any) {
    if (error instanceof Response && error.status === 302) {
      throw error;
    }
    return { error: error.message || 'Ошибка удаления блюда' };
  }
}

// Action для изменения статуса блюда
export async function changeDishStatusAction({
  request,
  params,
}: {
  request: Request;
  params: { id?: string };
}) {
  await requireAuth();

  if (!params.id) {
    return { error: 'ID блюда не указан' };
  }

  const formData = await request.formData();
  const status = formData.get('status') as 'PENDING' | 'REJECTED' | 'ACCEPTED';

  if (!status) {
    return { error: 'Статус не указан' };
  }

  try {
    await apiService.dishService.changeStatus(Number(params.id), status);
    throw redirect('/admin');
  } catch (error: any) {
    if (error instanceof Response && error.status === 302) {
      throw error;
    }
    return { error: error.message || 'Ошибка изменения статуса' };
  }
}

// Action для изменения роли пользователя
export async function changeUserRoleAction({
  request,
  params,
}: {
  request: Request;
  params: { id?: string };
}) {
  await requireAuth();

  if (!params.id) {
    return { error: 'ID пользователя не указан' };
  }

  const formData = await request.formData();
  const role = formData.get('role') as 'ADMIN' | 'USER';

  if (!role) {
    return { error: 'Роль не указана' };
  }

  try {
    await apiService.userService.changeRole(Number(params.id), role);
    throw redirect('/admin');
  } catch (error: any) {
    if (error instanceof Response && error.status === 302) {
      throw error;
    }
    return { error: error.message || 'Ошибка изменения роли' };
  }
}

// Helper для проверки авторизации
function requireAuth() {
  const token = localStorage.getItem('token');
  if (!token) {
    throw redirect('/login');
  }
  apiService.setToken(token);
}

