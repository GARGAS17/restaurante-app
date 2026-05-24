import { supabase } from '../../infrastructure/api/supabase';
import { useMenuStore } from '../store/useMenuStore';

export const UpdateMenuStockUseCase = async (productoId: string, nuevoStock: number) => {
  try {
    const { error } = await supabase
      .from('productos')
      .update({ stock_diario: nuevoStock })
      .eq('id', productoId);

    if (error) {
      console.error('Error updating stock:', error);
      return { success: false, error };
    }

    // Actualizar el store local
    useMenuStore.getState().actualizarStockTotal(productoId, nuevoStock);

    return { success: true, error: null };
  } catch (error) {
    console.error('UpdateMenuStockUseCase error:', error);
    return { success: false, error };
  }
};
