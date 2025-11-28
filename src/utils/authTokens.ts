import { API_BASE_URL } from '../config';

type Listener = (token: string | null) => void;

let accessToken: string | null = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
let refreshToken: string | null = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;

const listeners = new Set<Listener>();
let refreshPromise: Promise<string | null> | null = null;

export function getAccessToken() {
  return accessToken;
}

export function getRefreshToken() {
  return refreshToken;
}

export function setTokens(newAccessToken: string, newRefreshToken?: string) {
  accessToken = newAccessToken;
  localStorage.setItem('token', newAccessToken);
  if (newRefreshToken) {
    refreshToken = newRefreshToken;
    localStorage.setItem('refreshToken', newRefreshToken);
  }
  notify(accessToken);
}

export function clearStoredTokens() {
  accessToken = null;
  refreshToken = null;
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  notify(null);
}

export function subscribeToAccessToken(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify(token: string | null) {
  listeners.forEach((listener) => listener(token));
}

export async function refreshAccessToken(): Promise<string | null> {
  if (!refreshToken) {
    return null;
  }

  if (!refreshPromise) {
    refreshPromise = (async () => {
      const response = await fetch(`${API_BASE_URL}/users/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        clearStoredTokens();
        return null;
      }

      const data = await response.json();
      setTokens(data.accessToken, data.refreshToken);
      return data.accessToken as string;
    })().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

