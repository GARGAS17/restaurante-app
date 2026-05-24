import { supabase } from '../../infrastructure/api/supabase';
import { useAuthStore } from '../store/useAuthStore';
import type { Perfil } from '../../domain/entities/types';

export const FetchProfileUseCase = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('perfiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error al obtener perfil:', error);
      return { perfil: null, error };
    }

    return { perfil: data as Perfil, error: null };
  } catch (err: any) {
    console.error('Excepción al obtener perfil:', err);
    return { perfil: null, error: err };
  }
};
