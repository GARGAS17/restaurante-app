import { useEffect } from 'react';
import { useOrderStore } from '../../application/store/useOrderStore';
import { FetchOrdenesUseCase } from '../../application/useCases/FetchOrdenesUseCase';
import { SubscribeOrdenesUseCase } from '../../application/useCases/SubscribeOrdenesUseCase';
import { Clock } from 'lucide-react';
import type { OrdenActiva } from '../../domain/entities/types';

const OrdenCard = ({ orden }: { orden: OrdenActiva }) => {
  const timeElapsed = Math.floor((new Date().getTime() - new Date(orden.creado_at).getTime()) / 60000);
  
  return (
    <div className="bg-white border rounded-xl shadow-md overflow-hidden flex flex-col mb-4 transform transition-all hover:scale-[1.02]">
      <div className={`px-4 py-3 border-b flex justify-between items-center ${orden.tipo === 'mesa' ? 'bg-blue-600 text-white' : 'bg-orange-600 text-white'}`}>
        <span className="font-bold text-lg">{orden.identificador}</span>
        <div className="flex items-center gap-1 text-sm bg-black/20 px-2 py-1 rounded-full">
          <Clock className="w-4 h-4" />
          <span>{timeElapsed} min</span>
        </div>
      </div>
      <div className="p-4 bg-gray-50 flex-1">
        <ul className="space-y-3">
          {orden.detalles?.map(detalle => (
            <li key={detalle.id} className="flex items-start gap-3">
              <span className="font-bold text-lg bg-gray-200 px-2 rounded-md">{detalle.cantidad}</span>
              <span className="text-gray-800 text-lg">{detalle.producto?.nombre || 'Producto'}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default function CocinaPage() {
  const ordenesActivas = useOrderStore((state) => state.ordenesActivas);

  useEffect(() => {
    // 1. Cargar las órdenes iniciales
    FetchOrdenesUseCase();
    // 2. Suscribirse a cambios en tiempo real
    const unsubscribe = SubscribeOrdenesUseCase();
    
    return () => {
      unsubscribe();
    };
  }, []);

  const ordenesMesa = ordenesActivas.filter(o => o.tipo === 'mesa');
  const ordenesLlevar = ordenesActivas.filter(o => o.tipo === 'llevar');

  return (
    <div className="flex flex-col gap-4 min-h-screen md:min-h-0 md:h-[calc(100vh-10rem)] pb-6 md:pb-0">
      <div className="flex justify-between items-center bg-gray-800 text-white p-4 rounded-xl shadow-md">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Panel de Cocina</h1>
          <p className="text-sm text-gray-400">Sincronización en tiempo real</p>
        </div>
        <div className="flex gap-4">
          <div className="text-center px-4 border-r border-gray-600">
            <span className="block text-2xl font-bold text-blue-400">{ordenesMesa.length}</span>
            <span className="text-xs text-gray-400">Mesas</span>
          </div>
          <div className="text-center px-4">
            <span className="block text-2xl font-bold text-orange-400">{ordenesLlevar.length}</span>
            <span className="text-xs text-gray-400">Para Llevar</span>
          </div>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col md:grid md:grid-cols-2 gap-6 md:overflow-hidden">
        {/* PANEL MESA */}
        <div className="bg-gray-100 shadow-inner rounded-xl overflow-hidden flex flex-col border border-gray-200">
          <div className="bg-blue-100 p-3 border-b border-blue-200 text-blue-800 font-bold text-center uppercase tracking-widest">
            Comedor (Mesas)
          </div>
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50">
            {ordenesMesa.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-400">Sin órdenes pendientes</div>
            ) : (
              ordenesMesa.map(orden => <OrdenCard key={orden.id} orden={orden} />)
            )}
          </div>
        </div>

        {/* PANEL LLEVAR */}
        <div className="bg-gray-100 shadow-inner rounded-xl overflow-hidden flex flex-col border border-gray-200">
          <div className="bg-orange-100 p-3 border-b border-orange-200 text-orange-800 font-bold text-center uppercase tracking-widest">
            Para Llevar / Domicilios
          </div>
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50">
            {ordenesLlevar.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-400">Sin órdenes pendientes</div>
            ) : (
              ordenesLlevar.map(orden => <OrdenCard key={orden.id} orden={orden} />)
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
