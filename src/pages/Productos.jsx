import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import Toast from '../components/Toast';
import ConfirmDialog from '../components/ConfirmDialog';
import '../components/shared.css';
import './Productos.css';

const ITEMS_PER_PAGE = 8;

const emptyForm = { nombre: '', precio: '', existencias: '', categoria: '' };

export default function Productos() {
  const [items, setItems]           = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [modalOpen, setModalOpen]   = useState(false);
  const [form, setForm]             = useState(emptyForm);
  const [editId, setEditId]         = useState(null);
  const [buscar, setBuscar]         = useState('');
  const [page, setPage]             = useState(1);
  const [toast, setToast]           = useState(null);
  const [confirm, setConfirm]       = useState(null);

  const showToast = (message, type = 'success') => setToast({ message, type });

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [prod, cats] = await Promise.all([api.get('/productos'), api.get('/categorias')]);
      setItems(prod.data);
      setCategorias(cats.data);
    } catch {
      showToast('Error al cargar productos', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.nombre.trim() || !form.precio || !form.existencias)
      return showToast('Completa los campos requeridos', 'error');
    setSaving(true);
    const data = {
      nombre: form.nombre,
      precio: parseFloat(form.precio),
      existencias: parseInt(form.existencias),
      categoria: form.categoria ? { idCategoria: parseInt(form.categoria) } : null,
    };
    try {
      if (editId) {
        await api.put(`/productos/${editId}`, data);
        showToast('Producto actualizado');
      } else {
        await api.post('/productos', data);
        showToast('Producto creado');
      }
      setModalOpen(false);
      setForm(emptyForm);
      setEditId(null);
      fetchAll();
    } catch {
      showToast('Error al guardar', 'error');
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(item) {
    setEditId(item.idProducto);
    setForm({
      nombre: item.nombre,
      precio: item.precio,
      existencias: item.existencias,
      categoria: item.categoria?.idCategoria || '',
    });
    setModalOpen(true);
  }

  async function handleDeleteConfirm() {
    try {
      await api.delete(`/productos/${confirm.id}`);
      showToast('Producto eliminado');
      fetchAll();
    } catch {
      showToast('Error al eliminar', 'error');
    } finally {
      setConfirm(null);
    }
  }

  const fmt = n => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n || 0);

  // Stats
  const totalStock = items.reduce((s, p) => s + p.existencias, 0);
  const totalVal   = items.reduce((s, p) => s + p.precio * p.existencias, 0);
  const sinStock   = items.filter(p => p.existencias === 0).length;

  const filtrados  = items.filter(p =>
    p.nombre.toLowerCase().includes(buscar.toLowerCase()) ||
    (p.categoria?.nombre || '').toLowerCase().includes(buscar.toLowerCase())
  );
  const totalPages = Math.ceil(filtrados.length / ITEMS_PER_PAGE);
  const paginados  = filtrados.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <div className="productos-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Productos</h1>
          <p className="page-subtitle">Inventario y existencias</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditId(null); setForm(emptyForm); setModalOpen(true); }}>
          + Nuevo Producto
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total productos</div>
          <div className="stat-value accent">{items.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Unidades en stock</div>
          <div className="stat-value green">{totalStock}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Valor inventario</div>
          <div className="stat-value small">{fmt(totalVal)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Sin stock</div>
          <div className="stat-value red">{sinStock}</div>
        </div>
      </div>

      {/* Tabla */}
      <div className="table-card">
        <div className="table-toolbar">
          <input
            className="search-input"
            placeholder="🔍  Buscar producto o categoría..."
            value={buscar}
            onChange={e => { setBuscar(e.target.value); setPage(1); }}
          />
          <span className="table-count">{filtrados.length} registros</span>
        </div>
        <table>
          <thead>
            <tr>
              <th>ID</th><th>Nombre</th><th>Precio</th><th>Existencias</th><th>Categoría</th><th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6}><div className="loading-state"><div className="spinner"></div><p>Cargando...</p></div></td></tr>
            ) : paginados.length === 0 ? (
              <tr><td colSpan={6}><div className="empty-state"><div className="empty-state-icon">💊</div><p>Sin productos registrados</p></div></td></tr>
            ) : paginados.map(p => (
              <tr key={p.idProducto}>
                <td><span className="badge badge-blue">#{p.idProducto}</span></td>
                <td><strong>{p.nombre}</strong></td>
                <td className="td-precio">{fmt(p.precio)}</td>
                <td>
                  <span className={`badge ${p.existencias === 0 ? 'badge-red' : p.existencias < 10 ? 'badge-yellow' : 'badge-green'}`}>
                    {p.existencias}
                  </span>
                </td>
                <td>
                  {p.categoria
                    ? <span className="badge badge-blue">{p.categoria.nombre}</span>
                    : <span className="muted">—</span>}
                </td>
                <td>
                  <div className="td-actions">
                    <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(p)}>✏️ Editar</button>
                    <button className="btn btn-danger btn-sm" onClick={() => setConfirm({ id: p.idProducto, msg: '¿Eliminar este producto?' })}>🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {totalPages > 1 && (
          <div className="pagination">
            <span className="page-info">{filtrados.length} registros</span>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} className={`page-btn${p === page ? ' active' : ''}`} onClick={() => setPage(p)}>{p}</button>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{editId ? 'Editar Producto' : 'Nuevo Producto'}</span>
              <button className="modal-close" onClick={() => setModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group full">
                    <label className="form-label">Nombre *</label>
                    <input className="form-input" name="nombre" value={form.nombre} onChange={handleChange} placeholder="Ej: Vacuna Antirrábica" autoFocus />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Precio *</label>
                    <input className="form-input" name="precio" type="number" min="0" step="0.01" value={form.precio} onChange={handleChange} placeholder="0.00" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Existencias *</label>
                    <input className="form-input" name="existencias" type="number" min="0" value={form.existencias} onChange={handleChange} placeholder="0" />
                  </div>
                  <div className="form-group full">
                    <label className="form-label">Categoría</label>
                    <select className="form-select" name="categoria" value={form.categoria} onChange={handleChange}>
                      <option value="">Sin categoría</option>
                      {categorias.map(c => (
                        <option key={c.idCategoria} value={c.idCategoria}>{c.nombre}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <><span className="spinner spinner-sm"></span> Guardando...</> : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirm && <ConfirmDialog message={confirm.msg} onConfirm={handleDeleteConfirm} onCancel={() => setConfirm(null)} />}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}