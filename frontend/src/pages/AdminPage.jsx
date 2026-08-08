import { useEffect, useState } from "react";
import { api } from "../api";
import AdminLayout from "../components/AdminLayout";
import AdminEditModal, { AdminEditActions } from "../components/AdminEditModal";
import AdminFieldOptionsEditor from "../components/AdminFieldOptionsEditor";
import { useToast } from "../components/Toast";

const TABS = [
  { id: "departments", label: "Departments" },
  { id: "mills", label: "Mills" },
  { id: "fields", label: "Form fields" },
];

function RowActions({ onEdit, onToggle, onDelete, active, toggleLabels = ["Hide", "Show"] }) {
  return (
    <span className="admin-row-actions">
      <button type="button" className="btn btn-ghost btn-sm" onClick={onEdit}>
        Edit
      </button>
      <button type="button" className="btn btn-ghost btn-sm" onClick={onToggle}>
        {active ? toggleLabels[0] : toggleLabels[1]}
      </button>
      <button type="button" className="btn btn-ghost btn-sm" onClick={onDelete}>
        Delete
      </button>
    </span>
  );
}

export default function AdminPage() {
  const { showToast } = useToast();
  const [tab, setTab] = useState("departments");
  const [departments, setDepartments] = useState([]);
  const [mills, setMills] = useState([]);
  const [fields, setFields] = useState([]);
  const [millDeptSlug, setMillDeptSlug] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [deptForm, setDeptForm] = useState({ label: "", slug: "", icon: "⚙️", description: "" });
  const [millBulkForm, setMillBulkForm] = useState({ count: 9, startFrom: 1, labelPrefix: "Mill" });
  const [fieldForm, setFieldForm] = useState({
    fieldKey: "",
    label: "",
    type: "text",
    placeholder: "",
    required: true,
    options: [],
  });

  const [editKind, setEditKind] = useState(null);
  const [editDraft, setEditDraft] = useState(null);
  const [editSaving, setEditSaving] = useState(false);

  async function loadDepartments() {
    const { departments: list } = await api.adminListDepartments();
    setDepartments(list);
    if (!millDeptSlug && list[0]) setMillDeptSlug(list[0].slug);
  }

  async function loadMills(slug) {
    if (!slug) {
      setMills([]);
      return;
    }
    const { mills: list } = await api.adminListMills(slug);
    setMills(list);
  }

  async function loadFields() {
    const { fields: list } = await api.adminListFormFields();
    setFields(list);
  }

  async function reloadAll() {
    setLoading(true);
    setError("");
    try {
      await loadDepartments();
      await loadFields();
      if (millDeptSlug) await loadMills(millDeptSlug);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reloadAll();
  }, []);

  useEffect(() => {
    if (millDeptSlug) loadMills(millDeptSlug).catch(() => {});
  }, [millDeptSlug]);

  function closeEdit() {
    if (editSaving) return;
    setEditKind(null);
    setEditDraft(null);
  }

  function openEditDepartment(d) {
    setEditKind("department");
    setEditDraft({
      id: d.id,
      label: d.label,
      icon: d.icon || "⚙️",
      description: d.description || "",
      sortOrder: d.sortOrder ?? 0,
    });
  }

  function openEditMill(m) {
    setEditKind("mill");
    setEditDraft({
      id: m.id,
      label: m.label,
      slug: m.slug,
      sortOrder: m.sortOrder ?? 0,
    });
  }

  function openEditField(f) {
    setEditKind("field");
    setEditDraft({
      id: f.id,
      fieldKey: f.fieldKey,
      label: f.label,
      type: f.type,
      placeholder: f.placeholder || "",
      required: f.required,
      sortOrder: f.sortOrder ?? 0,
      options: Array.isArray(f.options) ? [...f.options] : [],
    });
  }

  async function saveEdit() {
    if (!editDraft || !editKind) return;
    setEditSaving(true);
    try {
      if (editKind === "department") {
        await api.adminUpdateDepartment(editDraft.id, {
          label: editDraft.label,
          icon: editDraft.icon,
          description: editDraft.description,
          sortOrder: editDraft.sortOrder,
        });
        await loadDepartments();
      } else if (editKind === "mill") {
        await api.adminUpdateMill(editDraft.id, {
          label: editDraft.label,
          slug: editDraft.slug,
          sortOrder: editDraft.sortOrder,
        });
        await loadMills(millDeptSlug);
      } else if (editKind === "field") {
        if (editDraft.type === "select" && !(editDraft.options?.length > 0)) {
          showToast("Add at least one dropdown option.", "error");
          return;
        }
        await api.adminUpdateFormField(editDraft.id, {
          label: editDraft.label,
          type: editDraft.type,
          placeholder: editDraft.placeholder,
          required: editDraft.required,
          sortOrder: editDraft.sortOrder,
          options: editDraft.type === "select" ? editDraft.options : [],
        });
        await loadFields();
      }
      showToast("Changes saved.", "success");
      closeEdit();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setEditSaving(false);
    }
  }

  async function addDepartment(e) {
    e.preventDefault();
    try {
      await api.adminCreateDepartment(deptForm);
      setDeptForm({ label: "", slug: "", icon: "⚙️", description: "" });
      await loadDepartments();
      showToast("Department added.", "success");
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  async function toggleDepartment(d) {
    try {
      await api.adminUpdateDepartment(d.id, { active: !d.active });
      await loadDepartments();
      showToast(d.active ? "Department hidden." : "Department activated.", "success");
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  async function removeDepartment(id) {
    if (!window.confirm("Delete this department and all its mills?")) return;
    try {
      await api.adminDeleteDepartment(id);
      await loadDepartments();
      showToast("Department deleted.", "success");
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  async function addMillsBulk(e) {
    e.preventDefault();
    if (!millDeptSlug) return;
    try {
      const { count } = await api.adminBulkCreateMills({
        departmentSlug: millDeptSlug,
        count: Number(millBulkForm.count),
        startFrom: Number(millBulkForm.startFrom) || 1,
        labelPrefix: millBulkForm.labelPrefix || "Mill",
      });
      await loadMills(millDeptSlug);
      showToast(`${count} mill(s) added.`, "success");
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  async function toggleMill(m) {
    try {
      await api.adminUpdateMill(m.id, { active: !m.active });
      await loadMills(millDeptSlug);
      showToast(m.active ? "Mill hidden." : "Mill activated.", "success");
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  async function removeMill(id) {
    if (!window.confirm("Delete this mill?")) return;
    try {
      await api.adminDeleteMill(id);
      await loadMills(millDeptSlug);
      showToast("Mill deleted.", "success");
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  async function addField(e) {
    e.preventDefault();
    if (fieldForm.type === "select" && !(fieldForm.options?.length > 0)) {
      showToast("Add at least one dropdown option.", "error");
      return;
    }
    try {
      await api.adminCreateFormField(fieldForm);
      setFieldForm({
        fieldKey: "",
        label: "",
        type: "text",
        placeholder: "",
        required: true,
        options: [],
      });
      await loadFields();
      showToast("Form field added.", "success");
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  async function toggleField(f) {
    try {
      await api.adminUpdateFormField(f.id, { active: !f.active });
      await loadFields();
      showToast(f.active ? "Field hidden." : "Field activated.", "success");
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  async function removeField(id) {
    if (!window.confirm("Delete this form field?")) return;
    try {
      await api.adminDeleteFormField(id);
      await loadFields();
      showToast("Field deleted.", "success");
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  const editTitle =
    editKind === "department"
      ? "Edit department"
      : editKind === "mill"
        ? "Edit mill"
        : editKind === "field"
          ? "Edit form field"
          : "";

  return (
    <AdminLayout title="Configuration" subtitle="Manage departments, mills, and report form fields">
      {error && <div className="error-banner">{error}</div>}

      <AdminEditModal open={Boolean(editKind && editDraft)} title={editTitle} onClose={closeEdit}>
        {editKind === "department" && editDraft && (
          <>
            <div className="admin-form-grid">
              <div className="field">
                <label>Label</label>
                <input
                  value={editDraft.label}
                  onChange={(e) => setEditDraft({ ...editDraft, label: e.target.value })}
                  required
                />
              </div>
              <div className="field">
                <label>Icon</label>
                <input value={editDraft.icon} onChange={(e) => setEditDraft({ ...editDraft, icon: e.target.value })} />
              </div>
              <div className="field admin-span-2">
                <label>Description</label>
                <input
                  value={editDraft.description}
                  onChange={(e) => setEditDraft({ ...editDraft, description: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Sort order</label>
                <input
                  type="number"
                  value={editDraft.sortOrder}
                  onChange={(e) => setEditDraft({ ...editDraft, sortOrder: e.target.value })}
                />
              </div>
            </div>
            <AdminEditActions onClose={closeEdit} onSave={saveEdit} saving={editSaving} />
          </>
        )}
        {editKind === "mill" && editDraft && (
          <>
            <div className="admin-form-grid">
              <div className="field">
                <label>Label</label>
                <input
                  value={editDraft.label}
                  onChange={(e) => setEditDraft({ ...editDraft, label: e.target.value })}
                  required
                />
              </div>
              <div className="field">
                <label>Slug (URL id)</label>
                <input
                  value={editDraft.slug}
                  onChange={(e) => setEditDraft({ ...editDraft, slug: e.target.value })}
                  required
                />
              </div>
              <div className="field">
                <label>Sort order</label>
                <input
                  type="number"
                  value={editDraft.sortOrder}
                  onChange={(e) => setEditDraft({ ...editDraft, sortOrder: e.target.value })}
                />
              </div>
            </div>
            <AdminEditActions onClose={closeEdit} onSave={saveEdit} saving={editSaving} />
          </>
        )}
        {editKind === "field" && editDraft && (
          <>
            <div className="field">
              <label>Field key</label>
              <input value={editDraft.fieldKey} readOnly disabled />
              <p className="field-hint">Key cannot be changed after creation.</p>
            </div>
            <div className="admin-form-grid">
              <div className="field">
                <label>Label</label>
                <input
                  value={editDraft.label}
                  onChange={(e) => setEditDraft({ ...editDraft, label: e.target.value })}
                  required
                />
              </div>
              <div className="field">
                <label>Type</label>
                <select
                  value={editDraft.type}
                  onChange={(e) => {
                    const next = e.target.value;
                    setEditDraft({
                      ...editDraft,
                      type: next,
                      options: next === "select" ? editDraft.options || [] : [],
                    });
                  }}
                >
                  <option value="text">Text</option>
                  <option value="textarea">Long text</option>
                  <option value="number">Number</option>
                  <option value="email">Email</option>
                  <option value="select">Dropdown</option>
                </select>
              </div>
              {editDraft.type === "select" && (
                <div className="admin-span-2">
                  <AdminFieldOptionsEditor
                    label={
                      editDraft.fieldKey === "section" ? "Section options" : "Dropdown options"
                    }
                    options={editDraft.options}
                    onChange={(options) => setEditDraft({ ...editDraft, options })}
                  />
                </div>
              )}
              <div className="field">
                <label>Placeholder</label>
                <input
                  value={editDraft.placeholder}
                  onChange={(e) => setEditDraft({ ...editDraft, placeholder: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Sort order</label>
                <input
                  type="number"
                  value={editDraft.sortOrder}
                  onChange={(e) => setEditDraft({ ...editDraft, sortOrder: e.target.value })}
                />
              </div>
            </div>
            <label className="admin-check">
              <input
                type="checkbox"
                checked={editDraft.required}
                onChange={(e) => setEditDraft({ ...editDraft, required: e.target.checked })}
              />
              Required
            </label>
            <AdminEditActions onClose={closeEdit} onSave={saveEdit} saving={editSaving} />
          </>
        )}
      </AdminEditModal>

      <div className="admin-tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={`admin-tab ${tab === t.id ? "active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading && <p className="page-subtitle">Loading…</p>}

      {!loading && tab === "departments" && (
        <div className="admin-panel">
          <form className="admin-add-form card" onSubmit={addDepartment}>
            <h3>Add department</h3>
            <div className="admin-form-grid">
              <div className="field">
                <label>Label</label>
                <input value={deptForm.label} onChange={(e) => setDeptForm({ ...deptForm, label: e.target.value })} required />
              </div>
              <div className="field">
                <label>Slug (optional)</label>
                <input value={deptForm.slug} onChange={(e) => setDeptForm({ ...deptForm, slug: e.target.value })} placeholder="electrical" />
              </div>
              <div className="field">
                <label>Icon</label>
                <input value={deptForm.icon} onChange={(e) => setDeptForm({ ...deptForm, icon: e.target.value })} />
              </div>
              <div className="field admin-span-2">
                <label>Description</label>
                <input value={deptForm.description} onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })} />
              </div>
            </div>
            <button type="submit" className="btn btn-primary admin-submit-btn">
              Add department
            </button>
          </form>
          <ul className="admin-list">
            {departments.map((d) => (
              <li key={d.id} className={d.active ? "" : "admin-row-inactive"}>
                <span>
                  {d.icon} <strong>{d.label}</strong> <code>{d.slug}</code>
                </span>
                <RowActions
                  active={d.active}
                  onEdit={() => openEditDepartment(d)}
                  onToggle={() => toggleDepartment(d)}
                  onDelete={() => removeDepartment(d.id)}
                />
              </li>
            ))}
          </ul>
        </div>
      )}

      {!loading && tab === "mills" && (
        <div className="admin-panel">
          <div className="field" style={{ maxWidth: 320 }}>
            <label htmlFor="mill-dept">Department</label>
            <select id="mill-dept" value={millDeptSlug} onChange={(e) => setMillDeptSlug(e.target.value)}>
              {departments.map((d) => (
                <option key={d.id} value={d.slug}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
          <form className="admin-add-form card" onSubmit={addMillsBulk}>
            <h3>Add mills in bulk</h3>
            <p className="card-subtitle" style={{ marginTop: 0 }}>
              Creates mills numbered from the start (e.g. count 9 from 1 → Mill 1 … Mill 9, slugs 1–9).
            </p>
            <div className="admin-form-grid">
              <div className="field">
                <label>Number of mills</label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={millBulkForm.count}
                  onChange={(e) => setMillBulkForm({ ...millBulkForm, count: e.target.value })}
                  required
                />
              </div>
              <div className="field">
                <label>Start from</label>
                <input
                  type="number"
                  min={1}
                  value={millBulkForm.startFrom}
                  onChange={(e) => setMillBulkForm({ ...millBulkForm, startFrom: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Label prefix</label>
                <input
                  value={millBulkForm.labelPrefix}
                  onChange={(e) => setMillBulkForm({ ...millBulkForm, labelPrefix: e.target.value })}
                  placeholder="Mill"
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary admin-submit-btn">
              Add mills
            </button>
          </form>
          <ul className="admin-list">
            {mills.map((m) => (
              <li key={m.id} className={m.active ? "" : "admin-row-inactive"}>
                <span>
                  <strong>{m.label}</strong> <code>{m.slug}</code>
                </span>
                <RowActions
                  active={m.active}
                  onEdit={() => openEditMill(m)}
                  onToggle={() => toggleMill(m)}
                  onDelete={() => removeMill(m.id)}
                />
              </li>
            ))}
          </ul>
        </div>
      )}

      {!loading && tab === "fields" && (
        <div className="admin-panel">
          <form className="admin-add-form card" onSubmit={addField}>
            <h3>Add form field</h3>
            <div className="admin-form-grid">
              <div className="field">
                <label>Field key</label>
                <input
                  value={fieldForm.fieldKey}
                  onChange={(e) => setFieldForm({ ...fieldForm, fieldKey: e.target.value })}
                  placeholder="equipmentId"
                  required
                />
              </div>
              <div className="field">
                <label>Label</label>
                <input value={fieldForm.label} onChange={(e) => setFieldForm({ ...fieldForm, label: e.target.value })} required />
              </div>
              <div className="field">
                <label>Type</label>
                <select
                  value={fieldForm.type}
                  onChange={(e) => {
                    const next = e.target.value;
                    setFieldForm({
                      ...fieldForm,
                      type: next,
                      options: next === "select" ? fieldForm.options : [],
                    });
                  }}
                >
                  <option value="text">Text</option>
                  <option value="textarea">Long text</option>
                  <option value="number">Number</option>
                  <option value="email">Email</option>
                  <option value="select">Dropdown</option>
                </select>
              </div>
              {fieldForm.type === "select" && (
                <div className="admin-span-2">
                  <AdminFieldOptionsEditor
                    label={
                      fieldForm.fieldKey === "section" ? "Section options" : "Dropdown options"
                    }
                    options={fieldForm.options}
                    onChange={(options) => setFieldForm({ ...fieldForm, options })}
                  />
                </div>
              )}
              <div className="field">
                <label>Placeholder</label>
                <input value={fieldForm.placeholder} onChange={(e) => setFieldForm({ ...fieldForm, placeholder: e.target.value })} />
              </div>
            </div>
            <label className="admin-check">
              <input
                type="checkbox"
                checked={fieldForm.required}
                onChange={(e) => setFieldForm({ ...fieldForm, required: e.target.checked })}
              />
              Required
            </label>
            <button type="submit" className="btn btn-primary admin-submit-btn">
              Add field
            </button>
          </form>
          <ul className="admin-list">
            {fields.map((f) => (
              <li key={f.id} className={f.active ? "" : "admin-row-inactive"}>
                <span>
                  <strong>{f.label}</strong> <code>{f.fieldKey}</code> · {f.type}
                  {f.type === "select" && f.options?.length ? ` · ${f.options.length} options` : ""}
                  {f.required ? " · required" : ""}
                </span>
                <RowActions
                  active={f.active}
                  onEdit={() => openEditField(f)}
                  onToggle={() => toggleField(f)}
                  onDelete={() => removeField(f.id)}
                />
              </li>
            ))}
          </ul>
        </div>
      )}
    </AdminLayout>
  );
}
