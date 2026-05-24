import { supabase } from '../../infrastructure/api/supabase';
import { useMenuStore } from '../store/useMenuStore';
import type { TipoOrden } from '../../domain/entities/types';
import { OrderFactory } from '../../domain/entities/OrderFactory';

export interface OrdenItemInput {
  producto_id: string;
  cantidad: number;
}

export const CrearOrdenUseCase = async (
  tipo: TipoOrden,
  identificador: string,
  items: OrdenItemInput[]
) => {
  if (items.length === 0) return { error: 'La orden no tiene productos' };

  try {
    // 1. Descontar stock localmente (Optimistic UI)
    const { descontarStockLocal } = useMenuStore.getState();
    items.forEach((item) => {
      descontarStockLocal(item.producto_id, item.cantidad);
    });

    // 2. Crear la cabecera de la orden usando el Factory
    const ordenPayload = OrderFactory.createOrder(tipo, identificador);
    
    const { data: ordenData, error: ordenError } = await supabase
      .from('ordenes_activas')
      .insert(ordenPayload)
      .select()
      .single();

    if (ordenError) throw ordenError;

    // 3. Crear los detalles de la orden
    const detallesToInsert = items.map((item) => ({
      orden_id: ordenData.id,
      producto_id: item.producto_id,
      cantidad: item.cantidad,
    }));

    const { error: detallesError } = await supabase
      .from('detalles_orden_activa')
      .insert(detallesToInsert);

    if (detallesError) throw detallesError;

    // 4. Actualizar el stock en la base de datos (simplificado)
    // En un entorno real se recomienda un RPC (Stored Procedure) para evitar race conditions
    const menuActual = useMenuStore.getState().menu;
    for (const item of items) {
      const producto = menuActual.find((p) => p.id === item.producto_id);
      if (producto) {
        await supabase
          .from('productos')
          .update({ stock_diario: producto.stock_diario }) // usa el stock ya descontado optimisticamente
          .eq('id', item.producto_id);
      }
    }

    return { data: ordenData, error: null };
  } catch (error) {
    console.error('Error en CrearOrdenUseCase:', error);
    return { data: null, error };
  }
};
