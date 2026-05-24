import { supabase } from '../../infrastructure/api/supabase';

export const FetchMetricasUseCase = async () => {
  try {
    const { data, error } = await supabase
      .from('metricas_ventas')
      .select(`
        id,
        cantidad,
        tipo_venta,
        entregado_at,
        producto:productos(nombre, categoria)
      `)
      .order('entregado_at', { ascending: false })
      .limit(100);

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
