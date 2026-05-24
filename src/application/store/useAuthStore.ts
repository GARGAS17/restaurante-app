import { create } from 'zustand';
import type { Perfil } from '../../domain/entities/types';
import type { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  perfil: Perfil | null;
  loading: boolean;
  setAuth: (user: User | null, perfil: Perfil | null) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  perfil: null,
  loading: true, // Empieza cargando para revisar sesión al inicio
  setAuth: (user, perfil) => set({ user, perfil, loading: false }),
  clearAuth: () => set({ user: null, perfil: null, loading: false }),
  setLoading: (loading) => set({ loading }),
}));
