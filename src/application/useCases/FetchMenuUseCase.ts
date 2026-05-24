import { supabase } from '../../infrastructure/api/supabase';
import { useMenuStore } from '../store/useMenuStore';
import type { Producto } from '../../domain/entities/types';

export const FetchMenuUseCase = async () => {
  try {
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .eq('activo', true)
      .order('nombre');

    if (error) {
      console.error('Error fetching menu:', error);
      return;
    }

    if (data) {
      useMenuStore.getState().setMenu(data as Producto[]);
    }
  } catch (err) {
    console.error('FetchMenuUseCase error:', err);
  }
};
