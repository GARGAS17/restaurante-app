import { useEffect, useState } from 'react';
import { useMenuStore } from '../../application/store/useMenuStore';
import { useOrderStore } from '../../application/store/useOrderStore';
import { FetchMenuUseCase } from '../../application/useCases/FetchMenuUseCase';
import { FetchOrdenesUseCase } from '../../application/useCases/FetchOrdenesUseCase';
import { SubscribeOrdenesUseCase } from '../../application/useCases/SubscribeOrdenesUseCase';
import { useConfigStore } from '../../application/store/useConfigStore';
import { FetchConfigUseCase } from '../../application/useCases/FetchConfigUseCase';
import { CrearOrdenUseCase } from '../../application/useCases/CrearOrdenUseCase';
import { LiberarOrdenUseCase } from '../../application/useCases/LiberarOrdenUseCase';
import { ConfirmarOrdenUseCase } from '../../application/useCases/ConfirmarOrdenUseCase';
import type { TipoOrden, OrdenActiva } from '../../domain/entities/types';
import { Plus, Minus, Send, CheckCircle2, ShoppingBag, ClipboardList, UtensilsCrossed, CheckSquare, Check } from 'lucide-react';

export default function MeseraPage() {
  const menu = useMenuStore((state) => state.menu);
  const ordenesActivas = useOrderStore((state) => state.ordenesActivas);
  const cantidadMesas = useConfigStore((state) => state.cantidadMesas);
  
  // Estado de navegación (Mobile-first tabs)
  const [activeTab, setActiveTab] = useState<'tomar_pedido' | 'pendientes' | 'confirmadas'>('tomar_pedido');

  // Estado para la orden que se está creando
  const [tipoSeleccionado, setTipoSeleccionado] = useState<TipoOrden>('mesa');
  const [identificador, setIdentificador] = useState('');
  const [ticketItems, setTicketItems] = useState<{producto_id: string, cantidad: number, nombre: string}[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    FetchConfigUseCase();
    FetchMenuUseCase();
    FetchOrdenesUseCase();
    
    // Suscripción en tiempo real
    const unsubscribe = SubscribeOrdenesUseCase();
    return () => {
      unsubscribe();
    };
  }, []);

  const handleTipoChange = (tipo: TipoOrden) => {
    setTipoSeleccionado(tipo);
    setIdentificador('');
  };

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

  const getItemCantidad = (productoId: string) => {
    return ticketItems.find(item => item.producto_id === productoId)?.cantidad || 0;
  };

  const handleEnviarComanda = async () => {
    if (!identificador.trim() || ticketItems.length === 0) return;
    
    setIsSubmitting(true);
    const result = await CrearOrdenUseCase(tipoSeleccionado, identificador, ticketItems);
    setIsSubmitting(false);
    
    if (result.error) {
      alert('Error al crear la orden. Intente de nuevo.');
    } else {
      // Limpiar ticket y volver a arriba
      setIdentificador('');
      setTicketItems([]);
      window.scrollTo(0, 0);
      // Forzar actualización de ordenes activas por si el realtime se adelantó
      FetchOrdenesUseCase();
      // Ya NO cambiamos de pestaña: setActiveTab('comandas_activas');
    }
  };

  const handleLiberar = async (ordenId: string) => {
    const result = await LiberarOrdenUseCase(ordenId);
    if (result.error) {
      alert('Error al liberar la orden.');
    }
  };

  const handleConfirmar = async (ordenId: string) => {
    // UI Update optimista ejecutado por el UseCase
    const result = await ConfirmarOrdenUseCase(ordenId);
    if (result.error) {
      alert('Error al confirmar la orden en cocina.');
    }
  };

  const corrientes = menu.filter(p => p.categoria === 'corriente');
  const asados = menu.filter(p => p.categoria === 'asados');
  const totalItems = ticketItems.reduce((acc, curr) => acc + curr.cantidad, 0);

  const pendientes = ordenesActivas.filter(o => o.estado === 'pendiente');
  const confirmadas = ordenesActivas.filter(o => o.estado === 'confirmada');

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-24 md:pb-6">
      
      {/* TABS DE NAVEGACION */}
      <div className="bg-white shadow-sm sticky top-0 z-20 md:static border-b">
        <div className="flex w-full">
          <button
            onClick={() => setActiveTab('tomar_pedido')}
            className={`flex-1 py-3 px-1 md:py-4 text-center font-medium flex flex-col md:flex-row items-center justify-center gap-1 transition-colors ${
              activeTab === 'tomar_pedido' 
                ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50/30' 
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <ShoppingBag className="w-5 h-5" />
            <span className="text-xs md:text-base">Tomar Pedido</span>
          </button>
          <button
            onClick={() => setActiveTab('pendientes')}
            className={`flex-1 py-3 px-1 md:py-4 text-center font-medium flex flex-col md:flex-row items-center justify-center gap-1 transition-colors relative ${
              activeTab === 'pendientes' 
                ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50/30' 
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <ClipboardList className="w-5 h-5" />
            <span className="text-xs md:text-base">Pendientes</span>
            {pendientes.length > 0 && (
              <span className="absolute top-1 right-2 md:right-4 bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {pendientes.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('confirmadas')}
            className={`flex-1 py-3 px-1 md:py-4 text-center font-medium flex flex-col md:flex-row items-center justify-center gap-1 transition-colors relative ${
              activeTab === 'confirmadas' 
                ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50/30' 
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <CheckSquare className="w-5 h-5" />
            <span className="text-xs md:text-base">Confirmadas</span>
            {confirmadas.length > 0 && (
              <span className="absolute top-1 right-2 md:right-4 bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {confirmadas.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <div className="flex-1 w-full max-w-3xl mx-auto md:p-4">
        
        {/* VISTA 1: TOMAR PEDIDO */}
        {activeTab === 'tomar_pedido' && (
          <div className="flex flex-col space-y-6 p-4">
            
            {/* Opciones de Envío e Identificador */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 space-y-4">
              <div className="flex p-1 bg-gray-100 rounded-xl">
                <button
                  onClick={() => handleTipoChange('mesa')}
                  className={`flex-1 py-3 text-base font-semibold rounded-lg transition-all ${
                    tipoSeleccionado === 'mesa' ? 'bg-white text-purple-700 shadow' : 'text-gray-500'
                  }`}
                >
                  Para Mesa
                </button>
                <button
                  onClick={() => handleTipoChange('llevar')}
                  className={`flex-1 py-3 text-base font-semibold rounded-lg transition-all ${
                    tipoSeleccionado === 'llevar' ? 'bg-white text-purple-700 shadow' : 'text-gray-500'
                  }`}
                >
                  Para Llevar
                </button>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {tipoSeleccionado === 'mesa' ? 'Número de Mesa' : 'Nombre del Cliente'}
                </label>
                {tipoSeleccionado === 'mesa' ? (
                  <select
                    className="w-full px-4 py-4 text-lg border rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none bg-gray-50"
                    value={identificador}
                    onChange={(e) => {
                      setIdentificador(e.target.value);
                      e.target.blur(); // Cierra el menú en móviles
                    }}
                  >
                    <option value="" disabled>Seleccione una mesa</option>
                    {Array.from({ length: cantidadMesas }, (_, i) => i + 1).map(num => (
                      <option key={num} value={`Mesa ${num}`}>Mesa {num}</option>
                    ))}
                  </select>
                ) : (
                  <input 
                    type="text" 
                    placeholder="Ej: Juan Pérez" 
                    className="w-full px-4 py-4 text-lg border rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none bg-gray-50"
                    value={identificador}
                    onChange={(e) => setIdentificador(e.target.value)}
                  />
                )}
              </div>
            </div>

            {/* Menú de Platos */}
            <div className="space-y-6 pb-6">
              
              <section>
                <h3 className="font-bold text-gray-800 text-xl mb-4 flex items-center gap-2">
                  <UtensilsCrossed className="w-5 h-5 text-purple-500" /> Corrientes
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {corrientes.map(p => {
                    const cant = getItemCantidad(p.id);
                    return (
                      <div 
                        key={p.id}
                        className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                          p.stock_diario > 0 
                            ? cant > 0 ? 'border-purple-400 bg-purple-50' : 'bg-white border-gray-200'
                            : 'bg-gray-100 opacity-60 grayscale cursor-not-allowed'
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-800 text-lg">{p.nombre}</span>
                          <span className={`text-xs font-medium mt-1 w-fit px-2 py-0.5 rounded-full ${p.stock_diario > 5 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            Stock: {p.stock_diario}
                          </span>
                        </div>
                        
                        {p.stock_diario > 0 ? (
                          <div className="flex items-center gap-3">
                            <button 
                              onClick={() => removeFromTicket(p.id)}
                              disabled={cant === 0}
                              className={`p-3 rounded-full ${cant > 0 ? 'bg-white border text-red-500 hover:bg-red-50' : 'text-gray-300'}`}
                            >
                              <Minus className="w-5 h-5" />
                            </button>
                            <span className="w-6 text-center font-bold text-lg">{cant}</span>
                            <button 
                              onClick={() => addToTicket(p.id, p.nombre)}
                              disabled={cant >= p.stock_diario}
                              className="p-3 rounded-full bg-purple-600 text-white hover:bg-purple-700 active:scale-95 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Plus className="w-5 h-5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-sm font-bold text-gray-500 px-4">Agotado</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>

              <section>
                <h3 className="font-bold text-gray-800 text-xl mb-4 flex items-center gap-2">
                  <UtensilsCrossed className="w-5 h-5 text-orange-500" /> Asados
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {asados.map(p => {
                    const cant = getItemCantidad(p.id);
                    return (
                      <div 
                        key={p.id}
                        className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                          p.stock_diario > 0 
                            ? cant > 0 ? 'border-orange-400 bg-orange-50' : 'bg-white border-gray-200'
                            : 'bg-gray-100 opacity-60 grayscale cursor-not-allowed'
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-800 text-lg">{p.nombre}</span>
                          <span className={`text-xs font-medium mt-1 w-fit px-2 py-0.5 rounded-full ${p.stock_diario > 5 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            Stock: {p.stock_diario}
                          </span>
                        </div>
                        
                        {p.stock_diario > 0 ? (
                          <div className="flex items-center gap-3">
                            <button 
                              onClick={() => removeFromTicket(p.id)}
                              disabled={cant === 0}
                              className={`p-3 rounded-full ${cant > 0 ? 'bg-white border text-red-500 hover:bg-red-50' : 'text-gray-300'}`}
                            >
                              <Minus className="w-5 h-5" />
                            </button>
                            <span className="w-6 text-center font-bold text-lg">{cant}</span>
                            <button 
                              onClick={() => addToTicket(p.id, p.nombre)}
                              disabled={cant >= p.stock_diario}
                              className="p-3 rounded-full bg-orange-500 text-white hover:bg-orange-600 active:scale-95 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Plus className="w-5 h-5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-sm font-bold text-gray-500 px-4">Agotado</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>

            </div>

            {/* Sticky Bottom Bar for Submit */}
            {totalItems > 0 && (
              <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)] z-30 md:static md:bg-transparent md:border-0 md:shadow-none md:p-0">
                <button
                  onClick={handleEnviarComanda}
                  disabled={!identificador.trim() || isSubmitting}
                  className="w-full py-4 px-6 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 disabled:cursor-not-allowed text-white font-bold text-lg rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-between"
                >
                  <span className="bg-white/20 px-3 py-1 rounded-lg text-sm">{totalItems} ítems</span>
                  <div className="flex items-center gap-2">
                    {isSubmitting ? 'Enviando...' : 'Enviar a Cocina'}
                    {!isSubmitting && <Send className="w-5 h-5" />}
                  </div>
                </button>
              </div>
            )}
          </div>
        )}

        {/* VISTA 2: PENDIENTES (A dictar a cocina) */}
        {activeTab === 'pendientes' && (
          <div className="p-4 space-y-4">
            {pendientes.length === 0 ? (
              <div className="text-center py-20 flex flex-col items-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <ClipboardList className="w-10 h-10 text-orange-300" />
                </div>
                <h3 className="text-xl font-bold text-gray-800">Sin comandas nuevas</h3>
                <p className="text-gray-500 mt-2">No hay platos pendientes por dictarle a cocina.</p>
              </div>
            ) : (
              pendientes.map((orden: OrdenActiva) => (
                <div key={orden.id} className="bg-white rounded-2xl shadow-sm border border-orange-100 overflow-hidden ring-1 ring-orange-50">
                  <div className={`px-4 py-3 flex justify-between items-center ${orden.tipo === 'mesa' ? 'bg-blue-50/50 border-b border-blue-100' : 'bg-orange-50/50 border-b border-orange-100'}`}>
                    <div className="flex items-center gap-3">
                      <span className={`w-3 h-3 rounded-full animate-pulse ${orden.tipo === 'mesa' ? 'bg-blue-500' : 'bg-orange-500'}`}></span>
                      <span className="font-bold text-lg text-gray-800">{orden.identificador}</span>
                    </div>
                    <span className={`text-xs uppercase font-bold px-2 py-1 rounded-md ${orden.tipo === 'mesa' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                      {orden.tipo}
                    </span>
                  </div>
                  
                  <div className="p-4">
                    <ul className="space-y-3 mb-5">
                      {orden.detalles?.map(detalle => (
                        <li key={detalle.id} className="flex items-start gap-3">
                          <span className="font-bold text-gray-700 bg-orange-100 px-2 py-0.5 rounded text-sm">{detalle.cantidad}x</span>
                          <span className="text-gray-800 font-medium">{detalle.producto?.nombre || 'Producto'}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <button
                      onClick={() => handleConfirmar(orden.id)}
                      className="w-full py-4 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-bold rounded-xl shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2 text-lg"
                    >
                      <Check className="w-6 h-6" /> Ya dictado a Cocina
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* VISTA 3: CONFIRMADAS (A liberar) */}
        {activeTab === 'confirmadas' && (
          <div className="p-4 space-y-4">
            {confirmadas.length === 0 ? (
              <div className="text-center py-20 flex flex-col items-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-10 h-10 text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-800">Todo entregado</h3>
                <p className="text-gray-500 mt-2">No hay comandas esperando salir de cocina.</p>
              </div>
            ) : (
              confirmadas.map((orden: OrdenActiva) => (
                <div key={orden.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className={`px-4 py-3 flex justify-between items-center ${orden.tipo === 'mesa' ? 'bg-blue-50/50 border-b border-blue-100' : 'bg-orange-50/50 border-b border-orange-100'}`}>
                    <div className="flex items-center gap-3">
                      <span className={`w-3 h-3 rounded-full ${orden.tipo === 'mesa' ? 'bg-blue-500' : 'bg-orange-500'}`}></span>
                      <span className="font-bold text-lg text-gray-800">{orden.identificador}</span>
                    </div>
                    <span className={`text-xs uppercase font-bold px-2 py-1 rounded-md ${orden.tipo === 'mesa' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                      {orden.tipo}
                    </span>
                  </div>
                  
                  <div className="p-4">
                    <ul className="space-y-3 mb-5">
                      {orden.detalles?.map(detalle => (
                        <li key={detalle.id} className="flex items-start gap-3 opacity-60">
                          <span className="font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded text-sm">{detalle.cantidad}x</span>
                          <span className="text-gray-800 font-medium line-through decoration-gray-300">{detalle.producto?.nombre || 'Producto'}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <button
                      onClick={() => handleLiberar(orden.id)}
                      className="w-full py-4 bg-gray-800 hover:bg-black active:bg-black text-white font-bold rounded-xl shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2 text-lg"
                    >
                      <CheckCircle2 className="w-6 h-6" /> Liberar (Entregada)
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
