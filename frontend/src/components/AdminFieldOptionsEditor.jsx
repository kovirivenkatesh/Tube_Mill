import { useState } from "react";

export default function AdminFieldOptionsEditor({ options, onChange, label = "Dropdown options" }) {
  const list = Array.isArray(options) ? options : [];
  const [draft, setDraft] = useState("");

  function addOption(e) {
    e.preventDefault();
    const value = draft.trim();
    if (!value) return;
    const exists = list.some((o) => o.toLowerCase() === value.toLowerCase());
    if (exists) {
      setDraft("");
      return;
    }
    onChange([...list, value]);
    setDraft("");
  }

  function removeOption(index) {
    onChange(list.filter((_, i) => i !== index));
  }

  return (
    <div className="admin-field-options">
      <label>{label}</label>
      <p className="field-hint">Used when field type is Dropdown (select). At least one option required.</p>
      <ul className="admin-options-list">
        {list.map((opt, index) => (
          <li key={`${opt}-${index}`}>
            <span>{opt}</span>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => removeOption(index)}>
              Delete
            </button>
          </li>
        ))}
        {!list.length && <li className="admin-options-empty">No options yet.</li>}
      </ul>
      <form className="admin-option-add" onSubmit={addOption}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="New option label"
        />
        <button type="submit" className="btn btn-ghost btn-sm">
          Add option
        </button>
      </form>
    </div>
  );
}
