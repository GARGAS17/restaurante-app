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
    let mounted = true;

    // Failsafe DEFINITIVO: Si en 3 segundos la sesión no se resuelve, forzamos reinicio.
    const failsafeTimeout = setTimeout(() => {
      if (useAuthStore.getState().loading) {
        console.warn('Failsafe Timeout: Supabase se colgó buscando el perfil o la sesión. Destrabando...');
        clearAuth();
      }
    }, 3000);

    // Función asíncrona NO BLOQUEANTE para no colgar el lock interno de Supabase
    const handleSessionWithoutBlocking = (session: any) => {
      if (!session?.user) {
        clearTimeout(failsafeTimeout);
        clearAuth();
        return;
      }
      
      // Usamos .then() en lugar de await para liberar el proceso principal de Supabase
      FetchProfileUseCase(session.user.id).then(({ perfil }) => {
        if (!mounted) return;
        clearTimeout(failsafeTimeout);
        if (perfil) setAuth(session.user, perfil);
        else clearAuth();
      }).catch(() => {
        clearTimeout(failsafeTimeout);
        clearAuth();
      });
    };

    // 1. Revisar sesión inicial al recargar la página
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!mounted) return;
      if (error) {
        clearTimeout(failsafeTimeout);
        clearAuth();
      } else {
        handleSessionWithoutBlocking(session);
      }
    });

    // 2. Escuchar cambios (NO DEBE SER ASYNC para no bloquear el lock de Supabase)
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      
      if (event === 'SIGNED_OUT') {
        clearAuth();
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        const currentPerfil = useAuthStore.getState().perfil;
        if (!currentPerfil) {
          handleSessionWithoutBlocking(session);
        } else if (session?.user) {
          clearTimeout(failsafeTimeout);
          setAuth(session.user, currentPerfil);
        }
      }
    });

    return () => {
      mounted = false;
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
