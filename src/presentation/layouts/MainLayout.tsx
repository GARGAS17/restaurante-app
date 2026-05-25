import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { ChefHat, ClipboardList, BarChart3, LogOut } from 'lucide-react';
import { useAuthStore } from '../../application/store/useAuthStore';
import { LogoutUseCase } from '../../application/useCases/LogoutUseCase';

export default function MainLayout() {
  const { perfil } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await LogoutUseCase();
    navigate('/login');
  };

  if (!perfil) return null; // Previene render en milisegundos sin perfil

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 w-full">
            <div className="flex w-full overflow-hidden items-center justify-between gap-2">
              
              <div className="flex items-center flex-1 min-w-0">
                <div className="flex-shrink-0 flex items-center mr-2 md:mr-8">
                  <span className="text-lg md:text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                    RestoMoney
                  </span>
                </div>
                
                <nav className="flex space-x-4 md:space-x-8 overflow-x-auto whitespace-nowrap items-center flex-1 min-w-0 pb-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                  {(perfil.rol === 'admin' || perfil.rol === 'mesera') && (
                    <NavLink
                      to="/mesera"
                      className={({ isActive }) =>
                        `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium h-16 ${
                          isActive
                            ? 'border-purple-500 text-gray-900'
                            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                        }`
                      }
                    >
                      <ClipboardList className="w-4 h-4 mr-2" />
                      Meseras
                    </NavLink>
                  )}
                  
                  {(perfil.rol === 'admin' || perfil.rol === 'cocina') && (
                    <NavLink
                      to="/cocina"
                      className={({ isActive }) =>
                        `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium h-16 ${
                          isActive
                            ? 'border-purple-500 text-gray-900'
                            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                        }`
                      }
                    >
                      <ChefHat className="w-4 h-4 mr-2" />
                      Cocina
                    </NavLink>
                  )}
                  
                  {perfil.rol === 'admin' && (
                    <NavLink
                      to="/admin"
                      className={({ isActive }) =>
                        `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium h-16 ${
                          isActive
                            ? 'border-purple-500 text-gray-900'
                            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                        }`
                      }
                    >
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Administrador
                    </NavLink>
                  )}
                </nav>
              </div>

              {/* Botón de Logout y Nombre de usuario */}
              <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                <div className="hidden md:flex flex-col items-end">
                  <span className="text-sm font-bold text-gray-700">{perfil.nombre}</span>
                  <span className="text-xs text-purple-600 uppercase font-bold bg-purple-50 px-2 rounded">{perfil.rol}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>

            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-2 sm:px-6 lg:px-8 py-4 md:py-8 overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
}
