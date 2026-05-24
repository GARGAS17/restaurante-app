import { supabase } from '../../infrastructure/api/supabase';
import { FetchOrdenesUseCase } from './FetchOrdenesUseCase';
import { useOrderStore } from '../store/useOrderStore';

export const SubscribeOrdenesUseCase = () => {
  // Suscribirse a cambios en la tabla ordenes_activas
  const subscription = supabase
    .channel('ordenes_activas_channel')
    .on(
      'postgres_changes',
      {
        event: '*', // Escuchar INSERT, UPDATE, DELETE
        schema: 'public',
        table: 'ordenes_activas',
      },
      (payload) => {
        console.log('Cambio detectado en ordenes_activas:', payload);
        
        if (payload.eventType === 'DELETE') {
          // Si se eliminó (ej: se liberó), lo quitamos del store local
          useOrderStore.getState().removerOrden(payload.old.id);
        } else if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          // Si se insertó o actualizó, volvemos a hacer fetch para traer los detalles anidados
          // (Es más seguro que intentar reconstruir los detalles anidados manualmente)
          FetchOrdenesUseCase();
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(subscription);
  };
};
