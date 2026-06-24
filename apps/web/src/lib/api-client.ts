import axios, { AxiosError } from 'axios';
import { useAuthStore } from '@/store/auth.store';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export const api = axios.create({ baseURL: API_URL });

// Attach access token + active organization header to every request.
api.interceptors.request.use((config) => {
  const { accessToken, activeOrganization } = useAuthStore.getState();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  if (activeOrganization) {
    config.headers['x-organization-id'] = activeOrganization.id;
  }
  return config;
});

let refreshPromise: Promise<string> | null = null;

// On a 401, attempt exactly one silent refresh-and-retry per request.
// Concurrent 401s share the same in-flight refresh call instead of each
// firing their own /auth/refresh request.
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (typeof error.config & { _retried?: boolean }) | undefined;

    if (error.response?.status !== 401 || !original || original._retried) {
      throw error;
    }
    original._retried = true;

    const { refreshToken, setAccessToken, clear } = useAuthStore.getState();
    if (!refreshToken) {
      clear();
      throw error;
    }

    try {
      if (!refreshPromise) {
        refreshPromise = axios
          .post(`${API_URL}/auth/refresh`, { refreshToken })
          .then((res) => {
            setAccessToken(res.data.accessToken);
            return res.data.accessToken as string;
          })
          .finally(() => {
            refreshPromise = null;
          });
      }
      const newToken = await refreshPromise;
      original.headers = original.headers ?? {};
      original.headers.Authorization = `Bearer ${newToken}`;
      return api.request(original);
    } catch (refreshError) {
      clear();
      throw refreshError;
    }
  },
);
