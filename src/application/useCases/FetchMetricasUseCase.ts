import { supabase } from '../../infrastructure/api/supabase';

export type FiltroTiempo = 'hoy' | 'mes' | 'siempre';

export const FetchMetricasUseCase = async (filtro: FiltroTiempo = 'hoy') => {
  try {
    let query = supabase
      .from('metricas_ventas')
      .select(`
        id,
        cantidad,
        tipo_venta,
        entregado_at,
        producto:productos(nombre, categoria)
      `)
      .order('entregado_at', { ascending: false });

    // Aplicar filtros de fecha
    const hoy = new Date();
    
    if (filtro === 'hoy') {
      const inicioDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()).toISOString();
      query = query.gte('entregado_at', inicioDia);
    } else if (filtro === 'mes') {
      const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString();
      query = query.gte('entregado_at', inicioMes);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching metrics:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('FetchMetricasUseCase error:', error);
    return { data: null, error };
  }
};
