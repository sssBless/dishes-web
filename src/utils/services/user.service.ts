import BaseAPIService from "../api";

export interface RegisterInput {
  email: string;
  username: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  role: 'ADMIN' | 'USER';
  createdAt: string;
  updatedAt: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}

export interface UpdateUserInput {
  email?: string;
  username?: string;
  password?: string;
}

export default class UserService extends BaseAPIService {
  public async register(data: RegisterInput): Promise<User> {
    return this.post<User>('/users', data);
  }

  public async login(data: LoginInput): Promise<LoginResponse> {
    return this.post<LoginResponse>('/users/login', data);
  }

  public async getAllUsers(): Promise<User[]> {
    return this.get<User[]>('/users');
  }

  public async getUserById(id: number): Promise<User> {
    return this.get<User>(`/users/${id}`);
  }

  public async updateUser(id: number, data: UpdateUserInput): Promise<User> {
    return this.patch<User>(`/users/${id}`, data);
  }

  public async deleteUser(id: number): Promise<void> {
    return this.delete<void>(`/users/${id}`);
  }

  public async changeRole(id: number, role: 'ADMIN' | 'USER'): Promise<User> {
    return this.patch<User>(`/users/${id}/role`, { role });
  }
}