import { supabase } from '../../infrastructure/api/supabase';
import { useOrderStore } from '../store/useOrderStore';
import type { OrdenActiva } from '../../domain/entities/types';

export const FetchOrdenesUseCase = async () => {
  try {
    const { data, error } = await supabase
      .from('ordenes_activas')
      .select(`
        *,
        detalles:detalles_orden_activa(
          *,
          producto:productos(*)
        )
      `)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching orders:', error);
      return;
    }

    if (data) {
      useOrderStore.getState().setOrdenes(data as OrdenActiva[]);
    }
  } catch (err) {
    console.error('FetchOrdenesUseCase error:', err);
  }
};
