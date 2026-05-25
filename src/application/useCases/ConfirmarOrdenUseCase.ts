import { supabase } from '../../infrastructure/api/supabase';
import { useOrderStore } from '../store/useOrderStore';

export const ConfirmarOrdenUseCase = async (ordenId: string) => {
  try {
    const { error } = await supabase
      .from('ordenes_activas')
      .update({ estado: 'confirmada' })
      .eq('id', ordenId);

    if (error) throw error;

    // Actualizar el estado local (optimistic UI update)
    useOrderStore.getState().marcarComoConfirmada(ordenId);

    return { success: true, error: null };
  } catch (error) {
    console.error('Error en ConfirmarOrdenUseCase:', error);
    return { success: false, error };
  }
};
