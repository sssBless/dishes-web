import BaseAPIService from "../api";

export interface DishIngredient {
  ingredientId: number;
  quantity: number;
  unit?: string;
}

export interface CreateDishInput {
  name: string;
  description?: string;
  recipe?: string;
  cookingTime?: number;
  authorId: number;
  ingredients?: DishIngredient[];
}

export interface UpdateDishInput {
  name?: string;
  description?: string;
  recipe?: string;
  cookingTime?: number;
  status?: 'PENDING' | 'REJECTED' | 'ACCEPTED';
}

export interface Ingredient {
  id: number;
  name: string;
  abbreviation: string;
  glycemicIndex: number;
  breadUnitsIn1g: number;
  caloriesPer100g: number;
  unit?: string;
  gramsPerPiece?: number;
  caloriesPerPiece?: number;
  densityGPerMl?: number;
}

export interface DishIngredientWithData {
  ingredientId: number;
  quantity: number;
  unit?: string;
  ingredient: Ingredient;
}

export interface Author {
  id: number;
  username: string;
  email: string;
}

export interface Dish {
  id: number;
  name: string;
  description: string | null;
  recipe: string | null;
  cookingTime: number | null;
  image: string | null;
  imageUrl: string | null;
  authorId: number;
  status: 'PENDING' | 'REJECTED' | 'ACCEPTED';
  createdAt: string;
  updatedAt: string;
  author: Author;
  ingredients: DishIngredientWithData[];
}

export interface GetAllDishesFilters {
  status?: 'PENDING' | 'REJECTED' | 'ACCEPTED';
  authorId?: number;
}

export default class DishService extends BaseAPIService {
  public async getAllDishes(filters?: GetAllDishesFilters): Promise<Dish[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.authorId) params.append('authorId', filters.authorId.toString());
    
    const query = params.toString();
    return this.get<Dish[]>(`/dishes${query ? `?${query}` : ''}`);
  }

  public async getDishById(id: number): Promise<Dish> {
    return this.get<Dish>(`/dishes/${id}`);
  }

  public async createDish(data: CreateDishInput): Promise<Dish> {
    return this.post<Dish>('/dishes', data);
  }

  public async updateDish(id: number, data: UpdateDishInput): Promise<Dish> {
    return this.patch<Dish>(`/dishes/${id}`, data);
  }

  public async deleteDish(id: number): Promise<void> {
    return this.delete<void>(`/dishes/${id}`);
  }

  public async updateDishIngredients(id: number, ingredients: DishIngredient[]): Promise<Dish> {
    return this.patch<Dish>(`/dishes/${id}/ingredients`, { ingredients });
  }

  public async changeStatus(id: number, status: 'PENDING' | 'REJECTED' | 'ACCEPTED'): Promise<Dish> {
    return this.patch<Dish>(`/dishes/${id}/status`, { status });
  }

  public async uploadImage(id: number, file: File): Promise<Dish> {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.post<Dish>(`/dishes/${id}/image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  public async addToFavorites(id: number): Promise<{ message: string }> {
    return this.post<{ message: string }>(`/dishes/${id}/favorite`, {});
  }

  public async removeFromFavorites(id: number): Promise<{ message: string }> {
    return this.delete<{ message: string }>(`/dishes/${id}/favorite`);
  }

  public async getFavoriteDishes(): Promise<Dish[]> {
    return this.get<Dish[]>('/dishes/favorites');
  }

  public async checkFavorite(id: number): Promise<{ isFavorite: boolean }> {
    return this.get<{ isFavorite: boolean }>(`/dishes/${id}/favorite`);
  }
}