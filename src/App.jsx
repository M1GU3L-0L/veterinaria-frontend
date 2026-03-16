import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Categorias from './pages/Categorias';
import Productos from './pages/Productos';
import Proveedores from './pages/Proveedores';
import Clientes from './pages/Clientes';
import Empleados from './pages/Empleados';
import Ventas from './pages/Ventas';
import './App.css';

function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user, loading } = useAuth();

  // Mientras verifica la sesión, no renderizar nada
  if (loading) return null;

  return (
    <div className="app-layout">
      {/* Sidebar solo si hay sesión activa */}
      {user && (
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(prev => !prev)}
        />
      )}
      <main className={user
        ? `app-main${sidebarCollapsed ? ' sidebar-collapsed' : ''}`
        : 'app-main-login'
      }>
        <Routes>
          <Route path="/login" element={
            user ? <Navigate to="/categorias" replace /> : <Login />
          } />
          <Route path="/" element={<Navigate to={user ? "/categorias" : "/login"} replace />} />
          <Route path="/categorias"  element={<ProtectedRoute><Categorias /></ProtectedRoute>} />
          <Route path="/productos"   element={<ProtectedRoute><Productos /></ProtectedRoute>} />
          <Route path="/proveedores" element={<ProtectedRoute><Proveedores /></ProtectedRoute>} />
          <Route path="/clientes"    element={<ProtectedRoute><Clientes /></ProtectedRoute>} />
          <Route path="/empleados"   element={<ProtectedRoute adminOnly><Empleados /></ProtectedRoute>} />
          <Route path="/ventas"      element={<ProtectedRoute><Ventas /></ProtectedRoute>} />
          <Route path="*"            element={<Navigate to={user ? "/categorias" : "/login"} replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </AuthProvider>
  );
}