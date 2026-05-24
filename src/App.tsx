import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MeseraPage from './presentation/pages/MeseraPage';
import CocinaPage from './presentation/pages/CocinaPage';
import AdminPage from './presentation/pages/AdminPage';
import MainLayout from './presentation/layouts/MainLayout';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/mesera" replace />} />
          <Route path="mesera" element={<MeseraPage />} />
          <Route path="cocina" element={<CocinaPage />} />
          <Route path="admin" element={<AdminPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
