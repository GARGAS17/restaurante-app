import { useEffect, useState } from 'react';
import { useMenuStore } from '../../application/store/useMenuStore';
import { FetchMenuUseCase } from '../../application/useCases/FetchMenuUseCase';
import { UpdateMenuStockUseCase } from '../../application/useCases/UpdateMenuStockUseCase';
import { FetchMetricasUseCase } from '../../application/useCases/FetchMetricasUseCase';
import { BarChart3, PackagePlus, ArrowRightLeft } from 'lucide-react';

export default function AdminPage() {
  const menu = useMenuStore((state) => state.menu);
  const [metricas, setMetricas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados locales para la recarga de stock (UI)
  const [stockEdits, setStockEdits] = useState<{ [id: string]: number }>({});

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await FetchMenuUseCase();
      const res = await FetchMetricasUseCase();
      if (res.data) setMetricas(res.data);
      setLoading(false);
    };
    loadData();
  }, []);

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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Panel de Administración</h1>
        <p className="text-sm text-gray-500">Gestión de inventario y estadísticas</p>
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

        {/* METRICAS RECIENTES */}
        <div className="bg-white shadow-sm rounded-xl border flex flex-col overflow-hidden max-h-[600px]">
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
                {metricas.map((m) => (
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
  );
}
