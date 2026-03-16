import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

// Cambia localStorage por sessionStorage
// sessionStorage se borra al cerrar la pestaña/navegador
const storage = sessionStorage;

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token  = storage.getItem('token');
    const nombre = storage.getItem('nombre');
    const rol    = storage.getItem('rol');
    const id     = storage.getItem('idEmpleado');
    if (token) {
      setUser({ token, nombre, rol, idEmpleado: parseInt(id) });
    }
    setLoading(false);
  }, []);

  function login(data) {
    storage.setItem('token',      data.token);
    storage.setItem('nombre',     data.nombre);
    storage.setItem('rol',        data.rol);
    storage.setItem('idEmpleado', String(data.idEmpleado));
    setUser(data);
  }

  function logout() {
    storage.clear();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}