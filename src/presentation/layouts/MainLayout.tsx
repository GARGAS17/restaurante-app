import { Outlet, NavLink } from 'react-router-dom';
import { ChefHat, ClipboardList, BarChart3 } from 'lucide-react';

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 w-full">
            <div className="flex w-full overflow-hidden">
              <div className="flex-shrink-0 flex items-center">
                <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  RestoMoney
                </span>
              </div>
              <nav className="ml-4 md:ml-8 flex space-x-4 md:space-x-8 overflow-x-auto whitespace-nowrap items-center flex-1 pb-1">
                <NavLink
                  to="/mesera"
                  className={({ isActive }) =>
                    `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      isActive
                        ? 'border-purple-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`
                  }
                >
                  <ClipboardList className="w-4 h-4 mr-2" />
                  Meseras
                </NavLink>
                <NavLink
                  to="/cocina"
                  className={({ isActive }) =>
                    `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      isActive
                        ? 'border-purple-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`
                  }
                >
                  <ChefHat className="w-4 h-4 mr-2" />
                  Cocina
                </NavLink>
                <NavLink
                  to="/admin"
                  className={({ isActive }) =>
                    `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      isActive
                        ? 'border-purple-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`
                  }
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Administrador
                </NavLink>
              </nav>
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
