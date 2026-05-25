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

  // 0. Guardar Snapshot para posible Rollback (Declarado fuera del try para ser accesible en el catch)
  const menuStore = useMenuStore.getState();
  const snapshot = menuStore.menu;

  try {

    // 1. Descontar stock localmente (Optimistic UI)
    items.forEach((item) => {
      menuStore.descontarStockLocal(item.producto_id, item.cantidad);
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

    // 4. Actualizar el stock en la base de datos de manera ATÓMICA vía RPC
    for (const item of items) {
      const { error: rpcError } = await supabase.rpc('decrementar_stock', {
        p_producto_id: item.producto_id,
        p_cantidad: item.cantidad
      });

      if (rpcError) {
        console.error(`Error atómico decrementando stock de ${item.producto_id}:`, rpcError);
        // Si falla la BD, lanzamos error para que el catch revierta todo
        throw rpcError;
      }
    }

    return { data: ordenData, error: null };
  } catch (error) {
    console.error('Error en CrearOrdenUseCase:', error);
    // ROLLBACK: Revertimos la UI si algo falló en la BD usando la copia de seguridad
    useMenuStore.getState().revertirStockLocal(snapshot); 
    return { data: null, error };
  }
};
