import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import Toast from '../components/Toast';
import ConfirmDialog from '../components/ConfirmDialog';
import '../components/shared.css';
import './Ventas.css';

const ITEMS_PER_PAGE = 8;

const emptyForm = { fecha: new Date().toISOString().split('T')[0], cliente: '', empleado: '' };

export default function Ventas() {
  const [items, setItems]         = useState([]);
  const [clientes, setClientes]   = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm]           = useState(emptyForm);
  const [detalles, setDetalles]   = useState([]);
  const [editId, setEditId]       = useState(null);
  const [buscar, setBuscar]       = useState('');
  const [page, setPage]           = useState(1);
  const [toast, setToast]         = useState(null);
  const [confirm, setConfirm]     = useState(null);

  const showToast = (message, type = 'success') => setToast({ message, type });

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [ventas, cli, emp, prod] = await Promise.all([
        api.get('/ventas'),
        api.get('/clientes'),
        api.get('/empleados'),
        api.get('/productos'),
      ]);
      setItems(ventas.data);
      setClientes(cli.data);
      setEmpleados(emp.data);
      setProductos(prod.data);
    } catch {
      showToast('Error al cargar ventas', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  // ── Detalles ──────────────────────────────────────
  function addDetalle() {
    setDetalles(prev => [...prev, { idProducto: '', cantidad: 1, precio: 0 }]);
  }

  function removeDetalle(i) {
    setDetalles(prev => prev.filter((_, idx) => idx !== i));
  }

  function updateDetalle(i, field, value) {
    setDetalles(prev => prev.map((d, idx) => {
      if (idx !== i) return d;
      if (field === 'idProducto') {
        const prod = productos.find(p => p.idProducto === parseInt(value));
        return { ...d, idProducto: value, precio: prod ? prod.precio : 0 };
      }
      return { ...d, [field]: value };
    }));
  }

  const total = detalles.reduce((s, d) => s + (d.cantidad || 0) * (d.precio || 0), 0);
  const fmt = n => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n || 0);

  // ── Submit ────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.fecha) return showToast('La fecha es requerida', 'error');
    setSaving(true);
    const data = {
      fecha: form.fecha,
      cliente:  form.cliente  ? { idCliente:  parseInt(form.cliente) }  : null,
      empleado: form.empleado ? { idEmpleado: parseInt(form.empleado) } : null,
      detalles: detalles.filter(d => d.idProducto).map(d => ({
        producto: { idProducto: parseInt(d.idProducto) },
        cantidad: parseInt(d.cantidad),
        precio: parseFloat(d.precio),
      })),
    };
    try {
      if (editId) {
        await api.put(`/ventas/${editId}`, data);
        showToast('Venta actualizada');
      } else {
        await api.post('/ventas', data);
        showToast('Venta registrada');
      }
      setModalOpen(false);
      setForm(emptyForm);
      setDetalles([]);
      setEditId(null);
      fetchAll();
    } catch {
      showToast('Error al guardar', 'error');
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(item) {
    setEditId(item.idVenta);
    setForm({
      fecha: item.fecha,
      cliente:  item.cliente?.idCliente   || '',
      empleado: item.empleado?.idEmpleado || '',
    });
    setDetalles((item.detalles || []).map(d => ({
      idProducto: d.producto?.idProducto || '',
      cantidad: d.cantidad,
      precio: d.precio,
    })));
    setModalOpen(true);
  }

  function openNueva() {
    setEditId(null);
    setForm({ ...emptyForm, fecha: new Date().toISOString().split('T')[0] });
    setDetalles([]);
    setModalOpen(true);
  }

  async function handleDeleteConfirm() {
    try {
      await api.delete(`/ventas/${confirm.id}`);
      showToast('Venta eliminada');
      fetchAll();
    } catch {
      showToast('Error al eliminar', 'error');
    } finally {
      setConfirm(null);
    }
  }

  const getVentaTotal = v => (v.detalles || []).reduce((s, d) => s + d.cantidad * d.precio, 0);

  const filtrados  = items.filter(v =>
    (v.cliente?.nombre || '').toLowerCase().includes(buscar.toLowerCase()) ||
    (v.empleado?.nombre || '').toLowerCase().includes(buscar.toLowerCase()) ||
    v.fecha.includes(buscar)
  );
  const totalPages = Math.ceil(filtrados.length / ITEMS_PER_PAGE);
  const paginados  = filtrados.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const totalRevenue = items.reduce((s, v) => s + getVentaTotal(v), 0);
  const hoy          = new Date().toISOString().split('T')[0];
  const ventasHoy    = items.filter(v => v.fecha === hoy).length;

  return (
    <div className="ventas-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Ventas</h1>
          <p className="page-subtitle">Registro de transacciones</p>
        </div>
        <button className="btn btn-primary" onClick={openNueva}>+ Nueva Venta</button>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total ventas</div>
          <div className="stat-value accent">{items.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Ingresos totales</div>
          <div className="stat-value small">{fmt(totalRevenue)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Ventas hoy</div>
          <div className="stat-value green">{ventasHoy}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Clientes</div>
          <div className="stat-value yellow">{clientes.length}</div>
        </div>
      </div>

      {/* Tabla */}
      <div className="table-card">
        <div className="table-toolbar">
          <input className="search-input" placeholder="🔍  Buscar por cliente, empleado o fecha..." value={buscar}
            onChange={e => { setBuscar(e.target.value); setPage(1); }} />
          <span className="table-count">{filtrados.length} registros</span>
        </div>
        <table>
          <thead><tr><th>ID</th><th>Fecha</th><th>Cliente</th><th>Empleado</th><th>Total</th><th>Acciones</th></tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6}><div className="loading-state"><div className="spinner"></div><p>Cargando...</p></div></td></tr>
            ) : paginados.length === 0 ? (
              <tr><td colSpan={6}><div className="empty-state"><div className="empty-state-icon">🛒</div><p>Sin ventas registradas</p></div></td></tr>
            ) : paginados.map(v => (
              <tr key={v.idVenta}>
                <td><span className="badge badge-blue">#{v.idVenta}</span></td>
                <td>{v.fecha}</td>
                <td>{v.cliente?.nombre || '—'}</td>
                <td>{v.empleado?.nombre || '—'}</td>
                <td className="td-total">{fmt(getVentaTotal(v))}</td>
                <td><div className="td-actions">
                  <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(v)}>✏️ Ver</button>
                  <button className="btn btn-danger btn-sm" onClick={() => setConfirm({ id: v.idVenta, msg: '¿Eliminar esta venta?' })}>🗑️</button>
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

      {/* Modal Venta */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{editId ? 'Editar Venta' : 'Nueva Venta'}</span>
              <button className="modal-close" onClick={() => setModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Fecha *</label>
                    <input className="form-input" name="fecha" type="date" value={form.fecha} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Cliente</label>
                    <select className="form-select" name="cliente" value={form.cliente} onChange={handleChange}>
                      <option value="">Seleccionar...</option>
                      {clientes.map(c => <option key={c.idCliente} value={c.idCliente}>{c.nombre}</option>)}
                    </select>
                  </div>
                  <div className="form-group full">
                    <label className="form-label">Empleado</label>
                    <select className="form-select" name="empleado" value={form.empleado} onChange={handleChange}>
                      <option value="">Seleccionar...</option>
                      {empleados.map(e => <option key={e.idEmpleado} value={e.idEmpleado}>{e.nombre}</option>)}
                    </select>
                  </div>
                </div>

                {/* Detalles */}
                <div className="detalles-section">
                  <div className="detalles-header">
                    <label className="form-label">Productos de la venta</label>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={addDetalle}>+ Agregar producto</button>
                  </div>

                  {detalles.length === 0 ? (
                    <div className="detalle-empty">Sin productos — haz clic en "+ Agregar producto"</div>
                  ) : (
                    <>
                      <div className="detalle-row detalle-row-header">
                        <span className="detalle-col-label">Producto</span>
                        <span className="detalle-col-label">Cant.</span>
                        <span className="detalle-col-label">Precio</span>
                        <span></span>
                      </div>
                      {detalles.map((d, i) => (
                        <div className="detalle-row" key={i}>
                          <select className="form-select" value={d.idProducto}
                            onChange={e => updateDetalle(i, 'idProducto', e.target.value)}>
                            <option value="">Seleccionar...</option>
                            {productos.map(p => <option key={p.idProducto} value={p.idProducto}>{p.nombre}</option>)}
                          </select>
                          <input className="form-input" type="number" min="1" value={d.cantidad}
                            onChange={e => updateDetalle(i, 'cantidad', parseInt(e.target.value) || 1)} />
                          <input className="form-input" type="number" min="0" step="0.01" value={d.precio}
                            onChange={e => updateDetalle(i, 'precio', parseFloat(e.target.value) || 0)} />
                          <button type="button" className="btn btn-danger btn-sm" onClick={() => removeDetalle(i)}>✕</button>
                        </div>
                      ))}
                    </>
                  )}

                  <div className="venta-total">
                    Total: <span>{fmt(total)}</span>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <><span className="spinner spinner-sm"></span> Guardando...</> : 'Guardar Venta'}
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