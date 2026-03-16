import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import Toast from '../components/Toast';
import ConfirmDialog from '../components/ConfirmDialog';
import '../components/shared.css';
import './Categorias.css';

const ITEMS_PER_PAGE = 8;

export default function Categorias() {
  const [items, setItems]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm]           = useState({ nombre: '' });
  const [editId, setEditId]       = useState(null);
  const [buscar, setBuscar]       = useState('');
  const [page, setPage]           = useState(1);
  const [toast, setToast]         = useState(null);
  const [confirm, setConfirm]     = useState(null);

  const showToast = (message, type = 'success') => setToast({ message, type });

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/categorias');
      setItems(data);
    } catch {
      showToast('Error al cargar categorías', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.nombre.trim()) return showToast('El nombre es requerido', 'error');
    setSaving(true);
    try {
      if (editId) {
        await api.put(`/categorias/${editId}`, form);
        showToast('Categoría actualizada');
      } else {
        await api.post('/categorias', form);
        showToast('Categoría creada');
      }
      setModalOpen(false);
      setForm({ nombre: '' });
      setEditId(null);
      fetchAll();
    } catch {
      showToast('Error al guardar', 'error');
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(item) {
    setEditId(item.idCategoria);
    setForm({ nombre: item.nombre });
    setModalOpen(true);
  }

  function handleDeleteClick(id) {
    setConfirm({ id, msg: '¿Eliminar esta categoría?' });
  }

  async function handleDeleteConfirm() {
    try {
      await api.delete(`/categorias/${confirm.id}`);
      showToast('Categoría eliminada');
      fetchAll();
    } catch {
      showToast('Error al eliminar', 'error');
    } finally {
      setConfirm(null);
    }
  }

  const filtrados = items.filter(c =>
    c.nombre.toLowerCase().includes(buscar.toLowerCase())
  );
  const totalPages = Math.ceil(filtrados.length / ITEMS_PER_PAGE);
  const paginados  = filtrados.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <div className="categorias-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Categorías</h1>
          <p className="page-subtitle">Gestión de categorías de productos</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditId(null); setForm({ nombre: '' }); setModalOpen(true); }}>
          + Nueva Categoría
        </button>
      </div>

      {/* Tabla */}
      <div className="table-card">
        <div className="table-toolbar">
          <input
            className="search-input"
            placeholder="🔍  Buscar categoría..."
            value={buscar}
            onChange={e => { setBuscar(e.target.value); setPage(1); }}
          />
          <span className="table-count">{filtrados.length} registros</span>
        </div>

        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={3}>
                <div className="loading-state">
                  <div className="spinner"></div>
                  <p>Cargando...</p>
                </div>
              </td></tr>
            ) : paginados.length === 0 ? (
              <tr><td colSpan={3}>
                <div className="empty-state">
                  <div className="empty-state-icon">🏷️</div>
                  <p>Sin categorías registradas</p>
                </div>
              </td></tr>
            ) : paginados.map(c => (
              <tr key={c.idCategoria}>
                <td><span className="badge badge-blue">#{c.idCategoria}</span></td>
                <td><strong>{c.nombre}</strong></td>
                <td>
                  <div className="td-actions">
                    <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(c)}>✏️ Editar</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDeleteClick(c.idCategoria)}>🗑️</button>
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
              <span className="modal-title">{editId ? 'Editar Categoría' : 'Nueva Categoría'}</span>
              <button className="modal-close" onClick={() => setModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nombre *</label>
                  <input
                    className="form-input"
                    value={form.nombre}
                    onChange={e => setForm({ nombre: e.target.value })}
                    placeholder="Ej: Medicamentos, Alimentos, Accesorios..."
                    autoFocus
                  />
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

      {confirm && (
        <ConfirmDialog
          message={confirm.msg}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}