import { supabase } from '../../infrastructure/api/supabase';
import { FetchMenuUseCase } from './FetchMenuUseCase';

export const ToggleProductoActivoUseCase = async (id: string, activo: boolean) => {
  try {
    const { data, error } = await supabase
      .from('productos')
      .update({ activo })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error al cambiar estado del producto:', error);
      return { error: error.message };
    }

    // Refrescar el estado global del menú
    await FetchMenuUseCase();

    return { data, error: null };
  } catch (error: any) {
    console.error('ToggleProductoActivoUseCase error:', error);
    return { error: error.message };
  }
};
