import { create } from 'zustand';
import type { OrdenActiva } from '../../domain/entities/types';

interface OrderState {
  ordenesActivas: OrdenActiva[];
  setOrdenes: (ordenes: OrdenActiva[]) => void;
  agregarOrden: (orden: OrdenActiva) => void;
  removerOrden: (id: string) => void;
}

export const useOrderStore = create<OrderState>((set) => ({
  ordenesActivas: [],
  
  // Carga inicial de datos
  setOrdenes: (ordenes) => set({ ordenesActivas: ordenes }),
  
  // Cuando ingresa un nuevo ticket (suscripción en tiempo real)
  agregarOrden: (orden) => 
    set((state) => {
      // Evitar duplicados
      if (state.ordenesActivas.some(o => o.id === orden.id)) {
        return state;
      }
      return { ordenesActivas: [...state.ordenesActivas, orden] };
    }),
    
  // Cuando una mesera "Libera" un pedido
  removerOrden: (id) => 
    set((state) => ({ 
      ordenesActivas: state.ordenesActivas.filter((o) => o.id !== id) 
    })),
}));
