import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import Toast from '../components/Toast';
import ConfirmDialog from '../components/ConfirmDialog';
import '../components/shared.css';

const ITEMS_PER_PAGE = 8;
const emptyForm = { nombre: '', telefono: '', correoElectronico: '' };

export default function Clientes() {
  const [items, setItems]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm]           = useState(emptyForm);
  const [editId, setEditId]       = useState(null);
  const [buscar, setBuscar]       = useState('');
  const [page, setPage]           = useState(1);
  const [toast, setToast]         = useState(null);
  const [confirm, setConfirm]     = useState(null);

  const showToast = (message, type = 'success') => setToast({ message, type });

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/clientes');
      setItems(data);
    } catch {
      showToast('Error al cargar clientes', 'error');
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
    if (!form.nombre.trim()) return showToast('El nombre es requerido', 'error');
    setSaving(true);
    try {
      if (editId) {
        await api.put(`/clientes/${editId}`, form);
        showToast('Cliente actualizado');
      } else {
        await api.post('/clientes', form);
        showToast('Cliente creado');
      }
      setModalOpen(false); setForm(emptyForm); setEditId(null);
      fetchAll();
    } catch {
      showToast('Error al guardar', 'error');
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(item) {
    setEditId(item.idCliente);
    setForm({ nombre: item.nombre, telefono: item.telefono || '', correoElectronico: item.correoElectronico || '' });
    setModalOpen(true);
  }

  async function handleDeleteConfirm() {
    try {
      await api.delete(`/clientes/${confirm.id}`);
      showToast('Cliente eliminado');
      fetchAll();
    } catch {
      showToast('Error al eliminar', 'error');
    } finally {
      setConfirm(null);
    }
  }

  const filtrados  = items.filter(c =>
    c.nombre.toLowerCase().includes(buscar.toLowerCase()) ||
    (c.correoElectronico || '').toLowerCase().includes(buscar.toLowerCase())
  );
  const totalPages = Math.ceil(filtrados.length / ITEMS_PER_PAGE);
  const paginados  = filtrados.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <div style={{ animation: 'fadeUp 0.3s ease' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Clientes</h1>
          <p className="page-subtitle">Base de clientes de la veterinaria</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditId(null); setForm(emptyForm); setModalOpen(true); }}>
          + Nuevo Cliente
        </button>
      </div>

      <div className="table-card">
        <div className="table-toolbar">
          <input className="search-input" placeholder="🔍  Buscar cliente..." value={buscar}
            onChange={e => { setBuscar(e.target.value); setPage(1); }} />
          <span className="table-count">{filtrados.length} registros</span>
        </div>
        <table>
          <thead><tr><th>ID</th><th>Nombre</th><th>Teléfono</th><th>Correo</th><th>Acciones</th></tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5}><div className="loading-state"><div className="spinner"></div><p>Cargando...</p></div></td></tr>
            ) : paginados.length === 0 ? (
              <tr><td colSpan={5}><div className="empty-state"><div className="empty-state-icon">👥</div><p>Sin clientes registrados</p></div></td></tr>
            ) : paginados.map(c => (
              <tr key={c.idCliente}>
                <td><span className="badge badge-blue">#{c.idCliente}</span></td>
                <td><strong>{c.nombre}</strong></td>
                <td>{c.telefono || '—'}</td>
                <td>{c.correoElectronico || '—'}</td>
                <td><div className="td-actions">
                  <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(c)}>✏️ Editar</button>
                  <button className="btn btn-danger btn-sm" onClick={() => setConfirm({ id: c.idCliente, msg: '¿Eliminar este cliente?' })}>🗑️</button>
                </div></td>
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

      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{editId ? 'Editar Cliente' : 'Nuevo Cliente'}</span>
              <button className="modal-close" onClick={() => setModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group full">
                    <label className="form-label">Nombre *</label>
                    <input className="form-input" name="nombre" value={form.nombre} onChange={handleChange} placeholder="Nombre completo" autoFocus />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Teléfono</label>
                    <input className="form-input" name="telefono" value={form.telefono} onChange={handleChange} placeholder="300 000 0000" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Correo Electrónico</label>
                    <input className="form-input" name="correoElectronico" type="email" value={form.correoElectronico} onChange={handleChange} placeholder="correo@ejemplo.com" />
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