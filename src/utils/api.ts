import type {AxiosInstance} from 'axios';
import axios from 'axios';

export interface RequestConfig {
  timeout?: number;
  headers?: Record<string, string>;
}

export default class BaseAPIService {
  protected axiosInstance: AxiosInstance;

  constructor(baseURL: string, token?: string) {
    this.axiosInstance = axios.create({
      baseURL,
      timeout: 30_000,
    });

    if (token) {
      this.setAuthToken(token);
    }

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.axiosInstance.interceptors.response.use(
      response => response.data,
      error => {
        if (error.response?.status === 401) {
          // Unauthorized - token might be expired
          localStorage.removeItem('token');
          this.clearAuthToken();
          if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
            window.location.href = '/login';
          }
        }
        const message = error.response?.data?.message || error.message;
        throw new Error(message);
      }
    );
  }

  public setAuthToken(token: string): void {
    this.axiosInstance.defaults.headers.common[
      'Authorization'
    ] = `Bearer ${token}`;
  }

  public clearAuthToken(): void {
    delete this.axiosInstance.defaults.headers.common['Authorization'];
  }

  protected async get<T>(url: string, config?: RequestConfig): Promise<T> {
    return this.axiosInstance.get(url, config);
  }

  protected async post<T>(
    url: string,
    data?: any,
    config?: RequestConfig
  ): Promise<T> {
    return this.axiosInstance.post(url, data, config);
  }

  protected async put<T>(
    url: string,
    data?: any,
    config?: RequestConfig
  ): Promise<T> {
    return this.axiosInstance.put(url, data, config);
  }

  protected async patch<T>(
    url: string,
    data?: any,
    config?: RequestConfig
  ): Promise<T> {
    return this.axiosInstance.patch(url, data, config);
  }

  protected async delete<T>(url: string, config?: RequestConfig): Promise<T> {
    return this.axiosInstance.delete(url, config);
  }
}
