import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../application/store/useAuthStore';
import type { RolUsuario } from '../../domain/entities/types';

interface AuthGuardProps {
  allowedRoles?: RolUsuario[];
}

export default function AuthGuard({ allowedRoles }: AuthGuardProps) {
  const { user, perfil, loading } = useAuthStore();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500 font-medium animate-pulse">Verificando sesión...</div>
      </div>
    );
  }

  if (!user || !perfil) {
    return <Navigate to="/login" replace />;
  }

  // Si se especifican roles permitidos y el usuario no los tiene, lo mandamos a su home
  if (allowedRoles && !allowedRoles.includes(perfil.rol)) {
    if (perfil.rol === 'admin') return <Navigate to="/admin" replace />;
    if (perfil.rol === 'cocina') return <Navigate to="/cocina" replace />;
    return <Navigate to="/mesera" replace />;
  }

  return <Outlet />;
}
