import { create } from 'zustand';

interface ConfigState {
  cantidadMesas: number;
  setConfig: (cantidad: number) => void;
}

export const useConfigStore = create<ConfigState>((set) => ({
  cantidadMesas: 15, // Valor por defecto
  setConfig: (cantidad) => set({ cantidadMesas: cantidad }),
}));
