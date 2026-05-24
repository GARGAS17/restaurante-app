import { supabase } from '../../infrastructure/api/supabase';
import { useOrderStore } from '../store/useOrderStore';

export const LiberarOrdenUseCase = async (ordenId: string, meseraId?: string) => {
  try {
    // 1. Obtener la orden completa con sus detalles antes de borrarla
    const { data: orden, error: fetchError } = await supabase
      .from('ordenes_activas')
      .select('*, detalles:detalles_orden_activa(*)')
      .eq('id', ordenId)
      .single();

    if (fetchError || !orden) throw fetchError || new Error('Orden no encontrada');

    // 2. Preparar los registros para las métricas
    const metricasToInsert = orden.detalles.map((detalle: any) => ({
      // mesera_id: meseraId, // temporalmente omitido si no hay auth
      producto_id: detalle.producto_id,
      cantidad: detalle.cantidad,
      tipo_venta: orden.tipo,
    }));

    // 3. Insertar en métricas
    if (metricasToInsert.length > 0) {
      const { error: metricasError } = await supabase
        .from('metricas_ventas')
        .insert(metricasToInsert);
        
      if (metricasError) throw metricasError;
    }

    // 4. Eliminar la orden activa (esto eliminará los detalles en cascada por el ON DELETE CASCADE de la BD)
    const { error: deleteError } = await supabase
      .from('ordenes_activas')
      .delete()
      .eq('id', ordenId);

    if (deleteError) throw deleteError;

    // 5. Actualizar el estado local (optimistic UI deletion)
    useOrderStore.getState().removerOrden(ordenId);

    return { success: true, error: null };
  } catch (error) {
    console.error('Error en LiberarOrdenUseCase:', error);
    return { success: false, error };
  }
};
