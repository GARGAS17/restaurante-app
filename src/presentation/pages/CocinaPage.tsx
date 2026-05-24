export default function CocinaPage() {
  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Cocina (Tiempo Real)</h1>
      </div>
      
      <div className="flex-1 grid grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg p-6 border-t-4 border-blue-500">
          <h2 className="text-xl font-semibold mb-4 text-blue-700">MESA</h2>
          <p className="text-gray-500 text-sm">Comandas de mesa aparecerán aquí.</p>
        </div>
        <div className="bg-white shadow rounded-lg p-6 border-t-4 border-orange-500">
          <h2 className="text-xl font-semibold mb-4 text-orange-700">PARA LLEVAR</h2>
          <p className="text-gray-500 text-sm">Comandas para llevar aparecerán aquí.</p>
        </div>
      </div>
    </div>
  );
}
