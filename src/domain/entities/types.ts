export type RolUsuario = 'admin' | 'mesera' | 'cocina';
export type CategoriaPlato = 'corriente' | 'asados';
export type TipoOrden = 'mesa' | 'llevar';

export interface Perfil {
  id: string;
  nombre: string;
  rol: RolUsuario;
}

export interface Producto {
  id: string;
  nombre: string;
  categoria: CategoriaPlato;
  stock_diario: number;
  activo: boolean;
}

export interface DetalleOrdenActiva {
  id: string;
  orden_id: string;
  producto_id: string;
  cantidad: number;
  // Opcional: Para UI, traer info del producto unido
  producto?: Producto;
}

export interface OrdenActiva {
  id: string;
  tipo: TipoOrden;
  identificador: string;
  estado: 'pendiente' | 'confirmada';
  created_at: string;
  detalles?: DetalleOrdenActiva[];
}

export interface MetricaVenta {
  id: string;
  mesera_id: string;
  producto_id: string;
  cantidad: number;
  tipo_venta: TipoOrden;
  entregado_at: string;
}
