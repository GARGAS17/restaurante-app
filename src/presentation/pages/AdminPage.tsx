import { useEffect, useState } from 'react';
import { useMenuStore } from '../../application/store/useMenuStore';
import { FetchMenuUseCase } from '../../application/useCases/FetchMenuUseCase';
import { UpdateMenuStockUseCase } from '../../application/useCases/UpdateMenuStockUseCase';
import { FetchMetricasUseCase } from '../../application/useCases/FetchMetricasUseCase';
import type { FiltroTiempo } from '../../application/useCases/FetchMetricasUseCase';
import { useConfigStore } from '../../application/store/useConfigStore';
import { FetchConfigUseCase } from '../../application/useCases/FetchConfigUseCase';
import { UpdateConfigUseCase } from '../../application/useCases/UpdateConfigUseCase';
import { BarChart3, PackagePlus, ArrowRightLeft, Settings, Trophy, TrendingDown } from 'lucide-react';

export default function AdminPage() {
  const menu = useMenuStore((state) => state.menu);
  const [metricas, setMetricas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rangoTiempo, setRangoTiempo] = useState<FiltroTiempo>('hoy');

  // Configuración
  const cantidadMesas = useConfigStore((state) => state.cantidadMesas);
  const [editMesas, setEditMesas] = useState(cantidadMesas.toString());
  const [savingConfig, setSavingConfig] = useState(false);

  // Estados locales para la recarga de stock (UI)
  const [stockEdits, setStockEdits] = useState<{ [id: string]: number }>({});

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await FetchConfigUseCase();
      await FetchMenuUseCase();
      const res = await FetchMetricasUseCase(rangoTiempo);
      if (res.data) setMetricas(res.data);
      setLoading(false);
    };
    loadData();
  }, [rangoTiempo]);

  useEffect(() => {
    setEditMesas(cantidadMesas.toString());
  }, [cantidadMesas]);

  const handleSaveConfig = async () => {
    const num = parseInt(editMesas, 10);
    if (!isNaN(num) && num > 0) {
      setSavingConfig(true);
      await UpdateConfigUseCase(num);
      setSavingConfig(false);
      alert('Configuración guardada correctamente.');
    }
  };

  const handleStockChange = (id: string, value: string) => {
    const num = parseInt(value, 10);
    if (!isNaN(num) && num >= 0) {
      setStockEdits((prev) => ({ ...prev, [id]: num }));
    }
  };

  const handleSaveStock = async (id: string) => {
    const nuevoStock = stockEdits[id];
    if (nuevoStock !== undefined) {
      const res = await UpdateMenuStockUseCase(id, nuevoStock);
      if (res.success) {
        // Remove from edits once saved
        setStockEdits((prev) => {
          const updated = { ...prev };
          delete updated[id];
          return updated;
        });
      } else {
        alert('Error al actualizar el stock');
      }
    }
  };

  // Cálculos de métricas rápidos
  const totalPlatosVendidos = metricas.reduce((acc, curr) => acc + curr.cantidad, 0);
  const ventasMesa = metricas.filter(m => m.tipo_venta === 'mesa').reduce((acc, curr) => acc + curr.cantidad, 0);
  const ventasLlevar = metricas.filter(m => m.tipo_venta === 'llevar').reduce((acc, curr) => acc + curr.cantidad, 0);

  // Ranking de platos
  const rankingPlatos = [...metricas].reduce((acc: {nombre: string, cantidad: number}[], curr) => {
    const nombre = curr.producto?.nombre || 'Desconocido';
    const existing = acc.find(item => item.nombre === nombre);
    if (existing) existing.cantidad += curr.cantidad;
    else acc.push({ nombre, cantidad: curr.cantidad });
    return acc;
  }, []).sort((a, b) => b.cantidad - a.cantidad);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Panel de Administración</h1>
          <p className="text-sm text-gray-500">Gestión de inventario y estadísticas</p>
        </div>
        
        {/* Selector de Rango de Tiempo */}
        <div className="flex items-center bg-white border rounded-lg p-1 shadow-sm">
          <button 
            onClick={() => setRangoTiempo('hoy')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${rangoTiempo === 'hoy' ? 'bg-purple-100 text-purple-700' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            Hoy
          </button>
          <button 
            onClick={() => setRangoTiempo('mes')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${rangoTiempo === 'mes' ? 'bg-purple-100 text-purple-700' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            Este Mes
          </button>
          <button 
            onClick={() => setRangoTiempo('siempre')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${rangoTiempo === 'siempre' ? 'bg-purple-100 text-purple-700' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            Histórico
          </button>
        </div>
      </div>
      
      {/* DASHBOARD WIDGETS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border flex items-center gap-4">
          <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
            <BarChart3 className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Platos Vendidos</p>
            <p className="text-3xl font-bold text-gray-900">{totalPlatosVendidos}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
            <ArrowRightLeft className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">En Mesa</p>
            <p className="text-3xl font-bold text-gray-900">{ventasMesa} platos</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border flex items-center gap-4">
          <div className="p-3 bg-orange-100 text-orange-600 rounded-lg">
            <PackagePlus className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Para Llevar</p>
            <p className="text-3xl font-bold text-gray-900">{ventasLlevar} platos</p>
          </div>
        </div>
      </div>

      {/* PANEL DE CONFIGURACIÓN */}
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <div className="flex items-center gap-2 mb-4 text-gray-800">
          <Settings className="w-5 h-5" />
          <h2 className="text-lg font-semibold">Configuración del Restaurante</h2>
        </div>
        <div className="flex items-end gap-4 max-w-sm">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad Total de Mesas</label>
            <input 
              type="number" 
              min="1"
              value={editMesas}
              onChange={(e) => setEditMesas(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>
          <button 
            onClick={handleSaveConfig}
            disabled={savingConfig || parseInt(editMesas) === cantidadMesas}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white font-medium rounded-lg transition-colors"
          >
            {savingConfig ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* INVENTARIO */}
        <div className="bg-white shadow-sm rounded-xl border flex flex-col overflow-hidden max-h-[600px]">
          <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800">Control de Inventario Diario</h2>
          </div>
          <div className="p-0 overflow-x-auto overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plato</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Actual</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acción</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {menu.map(p => {
                  const isEditing = stockEdits[p.id] !== undefined;
                  const currentEditValue = stockEdits[p.id] ?? p.stock_diario;
                  
                  return (
                    <tr key={p.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{p.nombre}</div>
                        <div className="text-sm text-gray-500">{p.categoria}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="number"
                          min="0"
                          value={currentEditValue}
                          onChange={(e) => handleStockChange(p.id, e.target.value)}
                          className="w-20 px-2 py-1 border rounded focus:ring-purple-500 focus:border-purple-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {isEditing && currentEditValue !== p.stock_diario && (
                          <button
                            onClick={() => handleSaveStock(p.id)}
                            className="bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700 transition-colors"
                          >
                            Guardar
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col gap-8">
          {/* RANKING DE PLATOS */}
          <div className="bg-white shadow-sm rounded-xl border flex flex-col overflow-hidden">
            <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" /> Ranking de Ventas
              </h2>
            </div>
            <div className="flex-1 p-4 overflow-y-auto max-h-[300px]">
              {loading ? (
                <p className="text-center text-gray-500 py-4">Calculando...</p>
              ) : rankingPlatos.length === 0 ? (
                <p className="text-center text-gray-500 py-4">No hay datos para este período.</p>
              ) : (
                <div className="space-y-4">
                  {/* Top 3 (Los más vendidos) */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Más Vendidos</h3>
                    {rankingPlatos.slice(0, 3).map((item, i) => (
                      <div key={item.nombre} className="flex justify-between items-center p-3 bg-gradient-to-r from-purple-50 to-white rounded-lg border border-purple-100">
                        <div className="flex items-center gap-3">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-yellow-400 text-white' : i === 1 ? 'bg-gray-300 text-white' : 'bg-orange-300 text-white'}`}>{i + 1}</span>
                          <span className="font-medium text-gray-800">{item.nombre}</span>
                        </div>
                        <span className="font-bold text-purple-700">{item.cantidad}</span>
                      </div>
                    ))}
                  </div>

                  {/* El menos vendido (Si hay más de 3 platos en el ranking) */}
                  {rankingPlatos.length > 3 && (
                    <div className="pt-4 border-t border-gray-100">
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                        <TrendingDown className="w-3 h-3" /> Menos Vendido
                      </h3>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <span className="text-gray-600">{rankingPlatos[rankingPlatos.length - 1].nombre}</span>
                        <span className="font-bold text-gray-500">{rankingPlatos[rankingPlatos.length - 1].cantidad}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* METRICAS RECIENTES */}
          <div className="bg-white shadow-sm rounded-xl border flex flex-col overflow-hidden max-h-[300px]">
            <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-800">Últimas Ventas Registradas</h2>
            </div>
            <div className="flex-1 p-4 overflow-y-auto">
              {loading ? (
                <p className="text-center text-gray-500">Cargando métricas...</p>
              ) : metricas.length === 0 ? (
                <p className="text-center text-gray-500">No hay ventas registradas aún.</p>
              ) : (
                <ul className="space-y-3">
                  {metricas.slice(0, 15).map((m) => (
                    <li key={m.id} className="flex justify-between items-center border-b pb-2">
                      <div>
                        <p className="font-medium text-gray-800">{m.producto?.nombre} <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600 ml-2">{m.tipo_venta}</span></p>
                        <p className="text-xs text-gray-500">{new Date(m.entregado_at).toLocaleString()}</p>
                      </div>
                      <div className="text-lg font-bold">
                        {m.cantidad}x
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
