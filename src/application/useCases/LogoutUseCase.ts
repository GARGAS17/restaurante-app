import { supabase } from '../../infrastructure/api/supabase';
import { useAuthStore } from '../store/useAuthStore';

export const LogoutUseCase = async () => {
  try {
    await supabase.auth.signOut();
    useAuthStore.getState().clearAuth();
    return { success: true };
  } catch (err: any) {
    console.error('Error al cerrar sesión:', err);
    return { success: false, error: err.message };
  }
};
