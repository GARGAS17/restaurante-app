import { supabase } from '../../infrastructure/api/supabase';
import { FetchMenuUseCase } from './FetchMenuUseCase';
import type { CategoriaPlato } from '../../domain/entities/types';

export const UpdateProductoUseCase = async (id: string, nombre: string, categoria: CategoriaPlato, stock_diario?: number) => {
  try {
    const payload: any = { nombre, categoria };
    if (stock_diario !== undefined) {
      payload.stock_diario = stock_diario;
    }

    const { data, error } = await supabase
      .from('productos')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error al actualizar producto:', error);
      return { error: error.message };
    }

    // Refrescar el estado global del menú
    await FetchMenuUseCase();

    return { data, error: null };
  } catch (error: any) {
    console.error('UpdateProductoUseCase error:', error);
    return { error: error.message };
  }
};
