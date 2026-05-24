import { supabase } from '../../infrastructure/api/supabase';
import { FetchProfileUseCase } from './FetchProfileUseCase';
import { useAuthStore } from '../store/useAuthStore';

export const LoginUseCase = async (email: string, password: string) => {
  try {
    // 1. Autenticar con Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      return { success: false, error: authError?.message || 'Error de autenticación' };
    }

    // 2. Traer el perfil (Rol y Nombre)
    const { perfil, error: profileError } = await FetchProfileUseCase(authData.user.id);
    
    if (profileError || !perfil) {
      // Si el usuario existe pero no tiene perfil en la tabla, lo bloqueamos o cerramos sesión
      await supabase.auth.signOut();
      return { success: false, error: 'Usuario sin rol asignado o perfil no encontrado.' };
    }

    // 3. Guardar en estado global
    useAuthStore.getState().setAuth(authData.user, perfil);

    return { success: true, perfil, error: null };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
};
