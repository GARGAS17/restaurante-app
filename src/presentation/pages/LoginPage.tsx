import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginUseCase } from '../../application/useCases/LoginUseCase';
import { ChefHat, Lock, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    // Si el usuario escribe el correo completo por costumbre, lo aceptamos. Si solo pone "admin", le agregamos el dominio.
    const fakeEmail = username.includes('@') 
      ? username.trim().toLowerCase() 
      : `${username.trim().toLowerCase()}@restomoney.com`;
      
    const { success, error, perfil } = await LoginUseCase(fakeEmail, password);
    setLoading(false);

    if (success && perfil) {
      // Redirigir según el rol
      if (perfil.rol === 'admin') navigate('/admin');
      else if (perfil.rol === 'cocina') navigate('/cocina');
      else navigate('/mesera');
    } else {
      setErrorMsg(error || 'Credenciales incorrectas');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg transform -rotate-6">
            <ChefHat className="w-8 h-8 text-white transform rotate-6" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          RestoMoney
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Acceso exclusivo para personal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100">
          <form className="space-y-6" onSubmit={handleLogin}>
            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm font-medium border border-red-100">
                {errorMsg}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Usuario
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm transition-colors"
                  placeholder="Ej: admin, mesera, cocina"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <div className="mt-1 relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm transition-colors pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <Eye className="h-5 w-5" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors disabled:opacity-50"
              >
                {loading ? 'Verificando...' : (
                  <span className="flex items-center gap-2">
                    <Lock className="w-4 h-4" /> Ingresar al Sistema
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
