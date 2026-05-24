import { supabase } from '../../infrastructure/api/supabase';
import { FetchMenuUseCase } from './FetchMenuUseCase';
import type { CategoriaPlato } from '../../domain/entities/types';

export const AddProductoUseCase = async (nombre: string, categoria: CategoriaPlato, stock_diario: number = 0) => {
  try {
    const { data, error } = await supabase
      .from('productos')
      .insert([
        {
          nombre,
          categoria,
          stock_diario,
          activo: true
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error al agregar producto:', error);
      return { error: error.message };
    }

    // Refrescar el estado global del menú
    await FetchMenuUseCase();

    return { data, error: null };
  } catch (error: any) {
    console.error('AddProductoUseCase error:', error);
    return { error: error.message };
  }
};
