import './shared.css';

export default function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" style={{ width: 380 }} onClick={e => e.stopPropagation()}>
        <div className="confirm-body">
          <div className="confirm-icon">🗑️</div>
          <div className="confirm-title">¿Eliminar registro?</div>
          <p className="confirm-msg">{message || 'Esta acción no se puede deshacer.'}</p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onCancel}>Cancelar</button>
          <button className="btn btn-danger" onClick={onConfirm}>Sí, eliminar</button>
        </div>
      </div>
    </div>
  );
}