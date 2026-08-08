import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth";
import Layout from "../components/Layout";
import { useToast } from "../components/Toast";

export default function DepartmentsPage() {
  const { user, updateSupervisorEmail } = useAuth();
  const { showToast } = useToast();
  const [departments, setDepartments] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [supervisorEmail, setSupervisorEmail] = useState(user?.supervisorEmail || "");
  const [editing, setEditing] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .getDepartments()
      .then(({ departments: list }) => setDepartments(list))
      .catch((e) => setLoadError(e.message));
  }, []);

  useEffect(() => {
    setSupervisorEmail(user?.supervisorEmail || "");
    setEditing(false);
  }, [user?.supervisorEmail]);

  function startEdit(e) {
    e.preventDefault();
    setSaveError("");
    setEditing(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaveError("");
    setSaving(true);
    try {
      await updateSupervisorEmail(supervisorEmail);
      showToast("Default supervisor email saved.", "success");
      setEditing(false);
    } catch (err) {
      setSaveError(err.message);
      showToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Layout title="Dashboard" subtitle="Choose a department or manage supervisor email">
      {loadError && <div className="error-banner">{loadError}</div>}
      <div className="panel panel-accent">
        <div className="panel-header">
          <h3>Supervisor email</h3>
        </div>
        <p className="panel-desc">
          Default address for approval emails. You can still change it when submitting a report.
        </p>
        {saveError && <div className="error-banner">{saveError}</div>}
        <form onSubmit={editing ? handleSave : startEdit} className="supervisor-inline-form">
          <div className="field" style={{ marginBottom: 0, flex: 1 }}>
            <label htmlFor="homeSupervisorEmail">Supervisor email</label>
            <input
              id="homeSupervisorEmail"
              type="email"
              value={supervisorEmail}
              onChange={(e) => setSupervisorEmail(e.target.value)}
              placeholder="supervisor@company.com"
              disabled={!editing}
              required={editing}
            />
          </div>
          {editing ? (
            <button type="submit" className="btn btn-primary btn-sm-wide" disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </button>
          ) : (
            <button type="submit" className="btn btn-ghost btn-sm-wide">
              Edit
            </button>
          )}
        </form>
      </div>

      <h3 className="section-label">Departments</h3>
      {!departments.length && !loadError && <p className="page-subtitle">No departments configured yet.</p>}
      <div className="grid-2">
        {departments.map((d) => (
          <Link key={d.id} to={`/departments/${d.slug}/mills`} className="dept-card">
            <div className="dept-card-top">
              <span className="dept-icon">{d.icon}</span>
              <span className="dept-arrow">→</span>
            </div>
            <h3>{d.label}</h3>
            <p>{d.description}</p>
          </Link>
        ))}
      </div>
    </Layout>
  );
}
