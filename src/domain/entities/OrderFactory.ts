import type { TipoOrden, OrdenActiva } from './types';

// Patrón Factory para la creación de entidades de orden
export class OrderFactory {
  static createOrder(
    tipo: TipoOrden, 
    identificador: string
  ): Partial<OrdenActiva> {
    
    const baseOrder = {
      tipo,
      identificador: identificador.trim(),
    };

    // Aquí podríamos aplicar un patrón Decorator futuro o extender la lógica
    // Ejemplo: Si es para llevar, podríamos agregar un cargo extra o embalaje
    if (tipo === 'llevar') {
      return {
        ...baseOrder,
        // logica especifica de "para llevar"
      };
    }

    if (tipo === 'mesa') {
      return {
        ...baseOrder,
        // logica especifica de "mesa"
      };
    }

    return baseOrder;
  }
}
