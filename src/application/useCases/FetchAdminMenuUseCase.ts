import { supabase } from '../../infrastructure/api/supabase';
import type { Producto } from '../../domain/entities/types';

export const FetchAdminMenuUseCase = async () => {
  try {
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .order('activo', { ascending: false }) // Primero los activos
      .order('nombre');

    if (error) {
      console.error('Error fetching admin menu:', error);
      return { data: null, error };
    }

    return { data: data as Producto[], error: null };
  } catch (err: any) {
    console.error('FetchAdminMenuUseCase error:', err);
    return { data: null, error: err.message };
  }
};
