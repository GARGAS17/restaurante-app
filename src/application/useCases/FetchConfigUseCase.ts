import { supabase } from '../../infrastructure/api/supabase';
import { useConfigStore } from '../store/useConfigStore';

export const FetchConfigUseCase = async () => {
  try {
    const { data, error } = await supabase
      .from('configuracion_restaurante')
      .select('cantidad_mesas')
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching config:', error);
      return { error };
    }

    if (data && data.cantidad_mesas) {
      useConfigStore.getState().setConfig(data.cantidad_mesas);
    }
    
    return { data };
  } catch (err: any) {
    return { error: err.message };
  }
};
