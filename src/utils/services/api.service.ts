import DishService from './dish.service';
import UserService from './user.service';
import IngredientsService from './ingredients.service';
import NutrientsService from './nutrients.service';

export class APIService {
  public userService: UserService;
  public dishService: DishService;
  public ingredientsService: IngredientsService;
  public nutrientsService: NutrientsService;

  constructor(baseURL: string, token?: string) {
    this.userService = new UserService(baseURL, token);
    this.dishService = new DishService(baseURL, token);
    this.ingredientsService = new IngredientsService(baseURL, token);
    this.nutrientsService = new NutrientsService(baseURL, token);
  }

  public setToken(token: string): void {
    this.userService.setAuthToken(token);
    this.dishService.setAuthToken(token);
    this.ingredientsService.setAuthToken(token);
    this.nutrientsService.setAuthToken(token);
  }

  public logout(): void {
    this.userService.clearAuthToken();
    this.dishService.clearAuthToken();
    this.ingredientsService.clearAuthToken();
    this.nutrientsService.clearAuthToken();
  }
}

export const apiService = new APIService(
  'http://localhost:3000/api',
  localStorage.getItem('token') || undefined
);
