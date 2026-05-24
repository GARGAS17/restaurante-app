import { useEffect, useState } from 'react';
import { useMenuStore } from '../../application/store/useMenuStore';
import { useOrderStore } from '../../application/store/useOrderStore';
import { FetchMenuUseCase } from '../../application/useCases/FetchMenuUseCase';
import { FetchOrdenesUseCase } from '../../application/useCases/FetchOrdenesUseCase';
import { SubscribeOrdenesUseCase } from '../../application/useCases/SubscribeOrdenesUseCase';
import { CrearOrdenUseCase } from '../../application/useCases/CrearOrdenUseCase';
import { LiberarOrdenUseCase } from '../../application/useCases/LiberarOrdenUseCase';
import type { TipoOrden } from '../../domain/entities/types';
import { Plus, Minus, Send, CheckCircle2 } from 'lucide-react';

export default function MeseraPage() {
  const menu = useMenuStore((state) => state.menu);
  const ordenesActivas = useOrderStore((state) => state.ordenesActivas);
  
  // Estado para la orden que se está creando
  const [tipoSeleccionado, setTipoSeleccionado] = useState<TipoOrden>('mesa');
  const [identificador, setIdentificador] = useState('');
  const [ticketItems, setTicketItems] = useState<{producto_id: string, cantidad: number, nombre: string}[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    FetchMenuUseCase();
    FetchOrdenesUseCase();
    
    // Suscripción en tiempo real
    const unsubscribe = SubscribeOrdenesUseCase();
    return () => {
      unsubscribe();
    };
  }, []);

  const addToTicket = (productoId: string, nombre: string) => {
    const existing = ticketItems.find(item => item.producto_id === productoId);
    if (existing) {
      setTicketItems(ticketItems.map(item => 
        item.producto_id === productoId ? { ...item, cantidad: item.cantidad + 1 } : item
      ));
    } else {
      setTicketItems([...ticketItems, { producto_id: productoId, nombre, cantidad: 1 }]);
    }
  };

  const removeFromTicket = (productoId: string) => {
    const existing = ticketItems.find(item => item.producto_id === productoId);
    if (existing && existing.cantidad > 1) {
      setTicketItems(ticketItems.map(item => 
        item.producto_id === productoId ? { ...item, cantidad: item.cantidad - 1 } : item
      ));
    } else {
      setTicketItems(ticketItems.filter(item => item.producto_id !== productoId));
    }
  };

  const handleEnviarComanda = async () => {
    if (!identificador.trim() || ticketItems.length === 0) return;
    
    setIsSubmitting(true);
    const result = await CrearOrdenUseCase(tipoSeleccionado, identificador, ticketItems);
    setIsSubmitting(false);
    
    if (result.error) {
      alert('Error al crear la orden. Intente de nuevo.');
    } else {
      // Limpiar ticket
      setIdentificador('');
      setTicketItems([]);
      // Recargar órdenes
      FetchOrdenesUseCase();
    }
  };

  const handleLiberar = async (ordenId: string) => {
    const result = await LiberarOrdenUseCase(ordenId);
    if (result.error) {
      alert('Error al liberar la orden.');
    }
  };

  const corrientes = menu.filter(p => p.categoria === 'corriente');
  const asados = menu.filter(p => p.categoria === 'asados');

  return (
    <div className="flex h-[calc(100vh-10rem)] gap-6">
      {/* PANEL IZQUIERDO: CREAR ORDEN */}
      <div className="w-2/3 flex flex-col bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100">
        <div className="p-4 border-b bg-gray-50 flex gap-4 items-center">
          <div className="flex bg-white rounded-lg shadow-sm p-1 border">
            <button
              onClick={() => setTipoSeleccionado('mesa')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                tipoSeleccionado === 'mesa' ? 'bg-purple-600 text-white shadow' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              En Mesa
            </button>
            <button
              onClick={() => setTipoSeleccionado('llevar')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                tipoSeleccionado === 'llevar' ? 'bg-purple-600 text-white shadow' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Para Llevar
            </button>
          </div>
          <input 
            type="text" 
            placeholder={tipoSeleccionado === 'mesa' ? 'Ej: Mesa 4' : 'Nombre del Cliente'} 
            className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
            value={identificador}
            onChange={(e) => setIdentificador(e.target.value)}
          />
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* MENU GRID */}
          <div className="w-2/3 p-4 overflow-y-auto bg-gray-50/50">
            <h3 className="font-semibold text-gray-700 mb-3 text-lg">Corrientes</h3>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {corrientes.map(p => (
                <button
                  key={p.id}
                  onClick={() => addToTicket(p.id, p.nombre)}
                  disabled={p.stock_diario <= 0}
                  className={`p-3 rounded-xl border text-left flex flex-col transition-all active:scale-95 ${
                    p.stock_diario > 0 
                      ? 'bg-white hover:border-purple-300 hover:shadow-md' 
                      : 'bg-gray-100 opacity-50 cursor-not-allowed grayscale'
                  }`}
                >
                  <span className="font-medium text-gray-800">{p.nombre}</span>
                  <span className={`text-xs mt-1 px-2 py-1 rounded-full w-fit ${p.stock_diario > 5 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    Stock: {p.stock_diario}
                  </span>
                </button>
              ))}
            </div>

            <h3 className="font-semibold text-gray-700 mb-3 text-lg">Asados</h3>
            <div className="grid grid-cols-2 gap-3">
              {asados.map(p => (
                <button
                  key={p.id}
                  onClick={() => addToTicket(p.id, p.nombre)}
                  disabled={p.stock_diario <= 0}
                  className={`p-3 rounded-xl border text-left flex flex-col transition-all active:scale-95 ${
                    p.stock_diario > 0 
                      ? 'bg-white hover:border-orange-300 hover:shadow-md' 
                      : 'bg-gray-100 opacity-50 cursor-not-allowed grayscale'
                  }`}
                >
                  <span className="font-medium text-gray-800">{p.nombre}</span>
                  <span className={`text-xs mt-1 px-2 py-1 rounded-full w-fit ${p.stock_diario > 5 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    Stock: {p.stock_diario}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* CURRENT TICKET */}
          <div className="w-1/3 border-l bg-white flex flex-col relative">
            <div className="p-4 bg-gray-50 border-b">
              <h3 className="font-semibold text-gray-800">Comanda Actual</h3>
            </div>
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {ticketItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                  <p className="text-sm">No hay platos seleccionados</p>
                </div>
              ) : (
                ticketItems.map(item => (
                  <div key={item.producto_id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border">
                    <span className="text-sm font-medium line-clamp-1 flex-1">{item.nombre}</span>
                    <div className="flex items-center gap-2 ml-2">
                      <button onClick={() => removeFromTicket(item.producto_id)} className="p-1 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-md">
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-4 text-center font-bold">{item.cantidad}</span>
                      <button onClick={() => addToTicket(item.producto_id, item.nombre)} className="p-1 text-gray-500 hover:text-green-500 hover:bg-green-50 rounded-md">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="p-4 border-t bg-gray-50">
              <button
                onClick={handleEnviarComanda}
                disabled={ticketItems.length === 0 || !identificador.trim() || isSubmitting}
                className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting ? 'Enviando...' : (
                  <>
                    <Send className="w-5 h-5" /> Enviar a Cocina
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* PANEL DERECHO: ORDENES ACTIVAS */}
      <div className="w-1/3 flex flex-col bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100">
        <div className="p-4 bg-gray-800 text-white flex justify-between items-center">
          <h2 className="font-semibold">Órdenes Activas</h2>
          <span className="bg-gray-700 px-2 py-1 rounded-full text-xs">{ordenesActivas.length}</span>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
          {ordenesActivas.length === 0 ? (
            <p className="text-center text-gray-500 mt-10">No hay órdenes en proceso</p>
          ) : (
            ordenesActivas.map(orden => (
              <div key={orden.id} className="bg-white border rounded-xl shadow-sm overflow-hidden flex flex-col">
                <div className={`px-4 py-2 border-b flex justify-between items-center ${orden.tipo === 'mesa' ? 'bg-blue-50 text-blue-800' : 'bg-orange-50 text-orange-800'}`}>
                  <span className="font-bold">{orden.identificador}</span>
                  <span className="text-xs uppercase font-bold tracking-wider">{orden.tipo}</span>
                </div>
                <div className="p-4">
                  <ul className="space-y-2 mb-4">
                    {orden.detalles?.map(detalle => (
                      <li key={detalle.id} className="text-sm flex items-start gap-2">
                        <span className="font-bold text-gray-700">{detalle.cantidad}x</span>
                        <span className="text-gray-600">{detalle.producto?.nombre || 'Producto'}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => handleLiberar(orden.id)}
                    className="w-full py-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-5 h-5" /> Liberar (Entregado)
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
