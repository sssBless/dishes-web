import BaseAPIService from "../api";

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

export interface CreateIngredientInput {
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

export interface UpdateIngredientInput {
  name?: string;
  abbreviation?: string;
  glycemicIndex?: number;
  breadUnitsIn1g?: number;
  caloriesPer100g?: number;
  unit?: string;
  gramsPerPiece?: number;
  caloriesPerPiece?: number;
  densityGPerMl?: number;
}

export default class IngredientsService extends BaseAPIService {
  public async getAllIngredients(): Promise<Ingredient[]> {
    return this.get<Ingredient[]>('/ingredients');
  }

  public async getIngredientById(id: number): Promise<Ingredient> {
    return this.get<Ingredient>(`/ingredients/${id}`);
  }

  public async createIngredient(data: CreateIngredientInput): Promise<Ingredient> {
    return this.post<Ingredient>('/ingredients', data);
  }

  public async updateIngredient(id: number, data: UpdateIngredientInput): Promise<Ingredient> {
    return this.patch<Ingredient>(`/ingredients/${id}`, data);
  }

  public async deleteIngredient(id: number): Promise<void> {
    return this.delete<void>(`/ingredients/${id}`);
  }
}