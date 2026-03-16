import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import './Login.css';

export default function Login() {
  const [form, setForm]       = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const { login }             = useAuth();
  const navigate              = useNavigate();

  function handleChange(e) {
    setError('');
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.username.trim() || !form.password.trim()) {
      return setError('Ingresa tu usuario y contraseña');
    }
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/login', form);
      login(data);
      navigate('/categorias', { replace: true });
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('Usuario o contraseña incorrectos');
      } else {
        setError('No se pudo conectar con el servidor');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      {/* Fondo decorativo */}
      <div className="login-bg">
        <div className="login-bg-circle"></div>
        <div className="login-bg-circle"></div>
        <div className="login-bg-circle"></div>
      </div>

      {/* Card */}
      <div className="login-card">
        {/* Logo */}
        <div className="login-logo">
          <span className="login-logo-icon">🐾</span>
          <div className="login-logo-title">Vet<span>Pro</span></div>
          <p className="login-logo-subtitle">Sistema de Gestión Veterinaria</p>
        </div>

        {/* Formulario */}
        <form className="login-form" onSubmit={handleSubmit}>

          {error && (
            <div className="login-error">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <div className="login-form-group">
            <label className="login-label">Usuario</label>
            <div className="login-input-wrap">
              <span className="login-input-icon">👤</span>
              <input
                className="login-input"
                name="username"
                type="text"
                placeholder="Ingresa tu usuario"
                value={form.username}
                onChange={handleChange}
                autoFocus
                autoComplete="username"
              />
            </div>
          </div>

          <div className="login-form-group">
            <label className="login-label">Contraseña</label>
            <div className="login-input-wrap">
              <span className="login-input-icon">🔒</span>
              <input
                className="login-input"
                name="password"
                type="password"
                placeholder="Ingresa tu contraseña"
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
              />
            </div>
          </div>

          <button className="login-btn" type="submit" disabled={loading}>
            {loading
              ? <><span className="spinner spinner-sm"></span> Ingresando...</>
              : <>Ingresar →</>
            }
          </button>
        </form>

        {/* Footer */}
        <div className="login-footer">
          <p>Solo personal autorizado puede acceder</p>
          <p style={{ marginTop: 6 }}>¿Problemas para ingresar? Contacta al <strong>administrador</strong></p>
        </div>
      </div>
    </div>
  );
}