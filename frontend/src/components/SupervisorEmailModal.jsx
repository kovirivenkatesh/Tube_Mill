import { useEffect, useState } from "react";

const MAX_SUPERVISORS = 10;

function normalizeList(emails) {
  return emails.map((e) => e.trim()).filter(Boolean);
}

export default function SupervisorEmailModal({ open, initialEmail, onClose, onConfirm, loading, error }) {
  const [emails, setEmails] = useState([""]);
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    if (open) {
      setLocalError("");
      setEmails(initialEmail?.trim() ? [initialEmail.trim()] : [""]);
    }
  }, [open, initialEmail]);

  if (!open) return null;

  function updateAt(index, value) {
    setEmails((prev) => prev.map((e, i) => (i === index ? value : e)));
  }

  function addRow() {
    setEmails((prev) => {
      if (prev.length >= MAX_SUPERVISORS) return prev;
      return [...prev, ""];
    });
  }

  function removeAt(index) {
    setEmails((prev) => {
      if (prev.length <= 1) return [""];
      return prev.filter((_, i) => i !== index);
    });
  }

  function handleSubmit(e) {
    e.preventDefault();
    setLocalError("");
    const list = normalizeList(emails);
    if (!list.length) {
      setLocalError("Add at least one supervisor email.");
      return;
    }
    const seen = new Set();
    for (const addr of list) {
      const lower = addr.toLowerCase();
      if (seen.has(lower)) {
        setLocalError("Remove duplicate email addresses.");
        return;
      }
      seen.add(lower);
    }
    onConfirm(list);
  }

  const displayError = localError || error;

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal card supervisor-email-modal"
        role="dialog"
        aria-labelledby="supervisor-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="supervisor-modal-title" style={{ margin: "0 0 8px" }}>
          Send to supervisor(s)
        </h3>
        <p className="card-subtitle" style={{ marginBottom: 20 }}>
          Approval email goes to every address below at the same time. Reply-To is your login email.
        </p>
        {displayError && <div className="error-banner">{displayError}</div>}
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Supervisor emails</label>
            <ul className="supervisor-email-rows">
              {emails.map((email, index) => (
                <li key={index}>
                  <input
                    type="email"
                    value={email}
                    onChange={(ev) => updateAt(index, ev.target.value)}
                    placeholder="supervisor@company.com"
                    required={index === 0}
                    aria-label={`Supervisor email ${index + 1}`}
                    autoFocus={index === 0}
                  />
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm supervisor-email-remove"
                    onClick={() => removeAt(index)}
                    disabled={emails.length <= 1 || loading}
                    aria-label="Remove email"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="btn btn-ghost btn-sm supervisor-email-add"
              onClick={addRow}
              disabled={emails.length >= MAX_SUPERVISORS || loading}
            >
              + Add another supervisor
            </button>
            <p className="field-hint">Up to {MAX_SUPERVISORS} addresses.</p>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Sending…" : "Send email & submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
