import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Inject JWT token from Zustand store
API.interceptors.request.use(
  (config) => {
    const { token } = useAuthStore.getState();
    console.log('Axios Interceptor: Sending request to', config.url, 'with token:', token ? `${token.slice(0, 10)}...` : 'NONE');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Automatically refresh expired Access Token
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isAuthRequest = originalRequest && originalRequest.url && (originalRequest.url.includes('/auth/refresh') || originalRequest.url.includes('/auth/logout'));
    
    // If access token expired (401), we haven't retried yet, and this is not a auth refresh/logout request
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRequest) {
      originalRequest._retry = true;
      try {
        const localRefreshToken = localStorage.getItem('refreshToken');
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/auth/refresh`,
          { refreshToken: localRefreshToken },
          { withCredentials: true }
        );

        if (data.accessToken) {
          useAuthStore.getState().setToken(data.accessToken);
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
          return API(originalRequest);
        }
      } catch (refreshError) {
        // Refresh token expired too -> Log user out
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default API;
