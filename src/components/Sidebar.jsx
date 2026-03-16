import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

const links = [
  { section: 'Catálogos' },
  { to: '/categorias',  icon: '🏷️', label: 'Categorías' },
  { to: '/productos',   icon: '💊', label: 'Productos' },
  { to: '/proveedores', icon: '🏭', label: 'Proveedores' },
  { section: 'Personas' },
  { to: '/clientes',    icon: '👥', label: 'Clientes' },
  { to: '/empleados',   icon: '👤', label: 'Empleados' },
  { section: 'Ventas' },
  { to: '/ventas',      icon: '🛒', label: 'Ventas' },
];

export default function Sidebar({ collapsed, onToggle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <>
      {/* Botón toggle — siempre visible */}
      <button
        className={`sidebar-toggle${collapsed ? ' collapsed' : ''}`}
        onClick={onToggle}
        title={collapsed ? 'Mostrar menú' : 'Ocultar menú'}
      >
        {collapsed ? '☰' : '✕'}
      </button>

      {/* Sidebar */}
      <aside className={`sidebar${collapsed ? ' collapsed' : ''}`}>
        <div className="sidebar-logo">
          <span className="sidebar-logo-icon">🐾</span>
          Vet<span>Pro</span>
        </div>

        <nav>
          {links.map((item, i) =>
            item.section ? (
              <div key={i} className="sidebar-section">{item.section}</div>
            ) : (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  'sidebar-link' + (isActive ? ' active' : '')
                }
              >
                <span className="sidebar-link-icon">{item.icon}</span>
                {item.label}
              </NavLink>
            )
          )}
        </nav>

        {/* Usuario y logout */}
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">
              {user?.nombre?.charAt(0).toUpperCase()}
            </div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{user?.nombre}</span>
              <span className="sidebar-user-rol">{user?.rol}</span>
            </div>
          </div>
          <button className="sidebar-logout" onClick={handleLogout}>
            <span>🚪</span> Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  );
}