import { create } from 'zustand';
import API from '../services/api';

export const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('user')) || null,
  token: localStorage.getItem('token') || null,
  loading: false,
  error: null,

  signup: async (name, email, password) => {
    set({ loading: true, error: null });
    try {
      const { data } = await API.post('/auth/signup', { name, email, password });
      localStorage.setItem('user', JSON.stringify({ _id: data._id, name: data.name, email: data.email }));
      localStorage.setItem('token', data.accessToken);
      if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
      set({ user: { _id: data._id, name: data.name, email: data.email }, token: data.accessToken, loading: false });
      return true;
    } catch (err) {
      set({ error: err.response?.data?.message || 'Registration failed', loading: false });
      return false;
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { data } = await API.post('/auth/login', { email, password });
      localStorage.setItem('user', JSON.stringify({ _id: data._id, name: data.name, email: data.email }));
      localStorage.setItem('token', data.accessToken);
      if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
      set({ user: { _id: data._id, name: data.name, email: data.email }, token: data.accessToken, loading: false });
      return true;
    } catch (err) {
      set({ error: err.response?.data?.message || 'Login failed', loading: false });
      return false;
    }
  },

  logout: () => {
    const currentToken = get().token;
    
    // Fire and forget API call so it doesn't block the UI
    if (currentToken) {
      API.post('/auth/logout', {}, {
        headers: {
          Authorization: `Bearer ${currentToken}`
        }
      }).catch(() => {
        // Silently fail if already logged out or token expired
      });
    }

    // Clear state instantly
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    set({ user: null, token: null });
  },

  setToken: (token) => {
    localStorage.setItem('token', token);
    set({ token });
  },

  clearError: () => set({ error: null }),
}));
