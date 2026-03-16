import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();

  console.log('ProtectedRoute →', { user, loading, adminOnly });

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.rol?.toUpperCase() !== 'ADMIN') return <Navigate to="/categorias" replace />;

  return children;
}