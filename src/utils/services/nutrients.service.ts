import BaseAPIService from "../api";

export interface Nutrient {
  id: number;
  name: string;
  unit: string;
}

export interface CreateNutrientInput {
  name: string;
  unit?: string;
}

export interface UpdateNutrientInput {
  name?: string;
  unit?: string;
}

export default class NutrientsService extends BaseAPIService {
  public async getAllNutrients(): Promise<Nutrient[]> {
    return this.get<Nutrient[]>('/nutrients');
  }

  public async getNutrientById(id: number): Promise<Nutrient> {
    return this.get<Nutrient>(`/nutrients/${id}`);
  }

  public async createNutrient(data: CreateNutrientInput): Promise<Nutrient> {
    return this.post<Nutrient>('/nutrients', data);
  }

  public async updateNutrient(id: number, data: UpdateNutrientInput): Promise<Nutrient> {
    return this.patch<Nutrient>(`/nutrients/${id}`, data);
  }

  public async deleteNutrient(id: number): Promise<void> {
    return this.delete<void>(`/nutrients/${id}`);
  }
}