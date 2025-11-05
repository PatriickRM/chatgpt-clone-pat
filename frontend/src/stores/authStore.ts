import { create } from 'zustand';
import type { User } from '../types';
import { authService } from '../services/authService';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.login({ email, password });
      set({ user: response.user, isLoading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.error || 'Error al iniciar sesión',
        isLoading: false 
      });
      throw error;
    }
  },

  register: async (email, password, name) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.register({ email, password, name });
      set({ user: response.user, isLoading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.error || 'Error al registrar',
        isLoading: false 
      });
      throw error;
    }
  },

  logout: () => {
    authService.logout();
    set({ user: null });
  },

  checkAuth: async () => {
    if (!authService.isAuthenticated()) {
      set({ user: null });
      return;
    }

    set({ isLoading: true });
    try {
      const user = await authService.getMe();
      set({ user, isLoading: false });
    } catch (error) {
      authService.logout();
      set({ user: null, isLoading: false });
    }
  },

  clearError: () => set({ error: null })
}));

