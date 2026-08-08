import { useEffect, useState } from "react";
import { useAuth } from "../auth";
import { useToast } from "./Toast";

export default function ProfileNameEditor() {
  const { user, updateUserName } = useAuth();
  const { showToast } = useToast();
  const [name, setName] = useState(user?.name || "");
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setName(user?.name || "");
    setEditing(false);
  }, [user?.name]);

  function startEdit(e) {
    e.preventDefault();
    setEditing(true);
  }

  async function saveName(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      showToast("Name cannot be empty.", "error");
      return;
    }
    setBusy(true);
    try {
      await updateUserName(trimmed);
      showToast("Name updated.", "success");
      setEditing(false);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="profile-name-form" onSubmit={editing ? saveName : startEdit}>
      <div className="field" style={{ marginBottom: 0, flex: 1 }}>
        <label htmlFor="profileDisplayName">Display name</label>
        <input
          id="profileDisplayName"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={!editing}
          required={editing}
          autoComplete="name"
        />
      </div>
      {editing ? (
        <button type="submit" className="btn btn-primary btn-sm" disabled={busy}>
          {busy ? "Saving…" : "Save"}
        </button>
      ) : (
        <button type="submit" className="btn btn-ghost btn-sm">
          Edit
        </button>
      )}
    </form>
  );
}
