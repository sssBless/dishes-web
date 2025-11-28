import type {AxiosInstance, AxiosRequestConfig} from 'axios';
import axios from 'axios';
import {refreshAccessToken, clearStoredTokens} from './authTokens';

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
      async error => {
        const originalRequest = error.config as AxiosRequestConfig & {_retry?: boolean};

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          const newToken = await refreshAccessToken();

          if (newToken) {
            this.setAuthToken(newToken);
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
            return this.axiosInstance(originalRequest);
          }

          this.handleUnauthorized();
        }

        const message = error.response?.data?.message || error.message;
        throw new Error(message);
      }
    );
  }

  private handleUnauthorized() {
    clearStoredTokens();
    this.clearAuthToken();
    if (typeof window !== 'undefined' && window.location.pathname !== '/login' && window.location.pathname !== '/register') {
      window.location.href = '/login';
    }
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
