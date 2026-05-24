import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './infrastructure/api/supabase';
import { useAuthStore } from './application/store/useAuthStore';
import { FetchProfileUseCase } from './application/useCases/FetchProfileUseCase';

import MeseraPage from './presentation/pages/MeseraPage';
import CocinaPage from './presentation/pages/CocinaPage';
import AdminPage from './presentation/pages/AdminPage';
import LoginPage from './presentation/pages/LoginPage';
import MainLayout from './presentation/layouts/MainLayout';
import AuthGuard from './presentation/components/AuthGuard';

function App() {
  const { setAuth, clearAuth } = useAuthStore();

  useEffect(() => {
    // 1. Revisar sesión inicial
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const { perfil } = await FetchProfileUseCase(session.user.id);
        if (perfil) setAuth(session.user, perfil);
        else clearAuth();
      } else {
        clearAuth();
      }
    });

    // 2. Escuchar cambios (login, logout, token refresh)
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session?.user) {
        clearAuth();
      } else if (event === 'SIGNED_IN' && session?.user) {
        // En SIGNED_IN usualmente LoginUseCase ya hizo setAuth, pero por si acaso.
        // Evitamos doble fetch si ya tenemos el perfil en estado
        const currentPerfil = useAuthStore.getState().perfil;
        if (!currentPerfil) {
          const { perfil } = await FetchProfileUseCase(session.user.id);
          if (perfil) setAuth(session.user, perfil);
          else clearAuth();
        }
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        {/* Rutas Protegidas */}
        <Route path="/" element={<AuthGuard />}>
          <Route element={<MainLayout />}>
            
            {/* Root redirige según el rol (manejado en MainLayout o aquí) */}
            <Route index element={<Navigate to="/mesera" replace />} />

            {/* Admin ve Admin */}
            <Route element={<AuthGuard allowedRoles={['admin']} />}>
              <Route path="admin" element={<AdminPage />} />
            </Route>

            {/* Mesera y Admin ven Mesera */}
            <Route element={<AuthGuard allowedRoles={['admin', 'mesera']} />}>
              <Route path="mesera" element={<MeseraPage />} />
            </Route>

            {/* Cocina y Admin ven Cocina */}
            <Route element={<AuthGuard allowedRoles={['admin', 'cocina']} />}>
              <Route path="cocina" element={<CocinaPage />} />
            </Route>

          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
