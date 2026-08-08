export default function AdminEditModal({ open, title, onClose, onSave, saving, children }) {
  if (!open) return null;

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal card admin-edit-modal"
        role="dialog"
        aria-labelledby="admin-edit-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="admin-edit-title" style={{ margin: "0 0 16px" }}>
          {title}
        </h3>
        {children}
      </div>
    </div>
  );
}

export function AdminEditActions({ onClose, onSave, saving, saveLabel = "Save changes" }) {
  return (
    <div className="modal-actions">
      <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>
        Cancel
      </button>
      <button type="button" className="btn btn-primary" onClick={onSave} disabled={saving}>
        {saving ? "Saving…" : saveLabel}
      </button>
    </div>
  );
}
