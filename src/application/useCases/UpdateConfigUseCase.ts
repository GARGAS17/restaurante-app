import { supabase } from '../../infrastructure/api/supabase';
import { useConfigStore } from '../store/useConfigStore';

export const UpdateConfigUseCase = async (cantidadMesas: number) => {
  try {
    // Primero intentamos hacer update. Si no hay fila (porque es nueva BD), insertamos.
    // Una forma simple es upsert si tenemos un ID fijo, pero supabase requiere PK.
    // Haremos un select primero.
    const { data: existing } = await supabase.from('configuracion_restaurante').select('id').limit(1).single();

    let response;
    if (existing) {
      response = await supabase
        .from('configuracion_restaurante')
        .update({ cantidad_mesas: cantidadMesas })
        .eq('id', existing.id);
    } else {
      response = await supabase
        .from('configuracion_restaurante')
        .insert([{ cantidad_mesas: cantidadMesas }]);
    }

    if (response.error) {
      console.error('Error updating config:', response.error);
      return { error: response.error };
    }

    useConfigStore.getState().setConfig(cantidadMesas);
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
};
