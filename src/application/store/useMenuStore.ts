import { create } from 'zustand';
import type { Producto } from '../../domain/entities/types';

interface MenuState {
  menu: Producto[];
  setMenu: (productos: Producto[]) => void;
  descontarStockLocal: (productoId: string, cantidad: number) => void;
  actualizarStockTotal: (productoId: string, nuevoStock: number) => void;
}

export const useMenuStore = create<MenuState>((set) => ({
  menu: [],
  
  setMenu: (productos) => set({ menu: productos }),
  
  // Optimistic UI: Descontamos visualmente antes de que la BD responda para mayor fluidez
  descontarStockLocal: (productoId, cantidad) =>
    set((state) => ({
      menu: state.menu.map((prod) =>
        prod.id === productoId
          ? { ...prod, stock_diario: Math.max(0, prod.stock_diario - cantidad) }
          : prod
      ),
    })),
    
  // Cuando recibimos un cambio de la base de datos
  actualizarStockTotal: (productoId, nuevoStock) =>
    set((state) => ({
      menu: state.menu.map((prod) =>
        prod.id === productoId
          ? { ...prod, stock_diario: nuevoStock }
          : prod
      ),
    })),
}));
