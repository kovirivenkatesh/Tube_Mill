import { Router } from "express";
import { randomUUID } from "crypto";
import {
  listDepartments,
  getDepartmentBySlug,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  listMills,
  createMill,
  updateMill,
  deleteMill,
  listFormFields,
  createFormField,
  updateFormField,
  deleteFormField,
} from "../data/configStore.js";
import { FORM_FIELD_TYPES, normalizeFieldOptions } from "../lib/formFieldOptions.js";

function slugify(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function createConfigRouter(authMiddleware) {
  const router = Router();

  router.get("/departments", authMiddleware, async (req, res) => {
    const departments = await listDepartments({ activeOnly: true });
    res.json({ departments });
  });

  router.get("/departments/:slug/mills", authMiddleware, async (req, res) => {
    const dept = await getDepartmentBySlug(req.params.slug);
    if (!dept || !dept.active) {
      return res.status(404).json({ error: "Department not found" });
    }
    const mills = await listMills(dept.slug, { activeOnly: true });
    res.json({ department: dept, mills });
  });

  router.get("/form-fields", authMiddleware, async (req, res) => {
    const fields = await listFormFields({ activeOnly: true });
    res.json({ fields });
  });

  return router;
}

export function createAdminConfigRouter(authMiddleware, adminMiddleware) {
  const router = Router();
  router.use(authMiddleware, adminMiddleware);

  router.get("/departments", async (req, res) => {
    res.json({ departments: await listDepartments() });
  });

  router.post("/departments", async (req, res) => {
    const { label, slug, icon, description, sortOrder, active } = req.body;
    if (!label?.trim()) {
      return res.status(400).json({ error: "Label is required" });
    }
    const finalSlug = slugify(slug || label);
    if (!finalSlug) return res.status(400).json({ error: "Invalid slug" });
    if (await getDepartmentBySlug(finalSlug)) {
      return res.status(409).json({ error: "Department slug already exists" });
    }
    const department = await createDepartment({
      id: randomUUID(),
      slug: finalSlug,
      label: label.trim(),
      icon: icon?.trim() || "⚙️",
      description: description?.trim() || "",
      sortOrder: Number(sortOrder) || 0,
      active: active !== false,
    });
    res.status(201).json({ department });
  });

  router.patch("/departments/:id", async (req, res) => {
    const { label, icon, description, sortOrder, active } = req.body;
    const patch = {};
    if (label !== undefined) patch.label = String(label).trim();
    if (icon !== undefined) patch.icon = String(icon).trim();
    if (description !== undefined) patch.description = String(description).trim();
    if (sortOrder !== undefined) patch.sortOrder = Number(sortOrder) || 0;
    if (active !== undefined) patch.active = Boolean(active);
    const department = await updateDepartment(req.params.id, patch);
    if (!department) return res.status(404).json({ error: "Not found" });
    res.json({ department });
  });

  router.delete("/departments/:id", async (req, res) => {
    const department = await deleteDepartment(req.params.id);
    if (!department) return res.status(404).json({ error: "Not found" });
    res.json({ success: true });
  });

  router.get("/mills", async (req, res) => {
    const departmentSlug = req.query.departmentSlug;
    if (!departmentSlug) {
      return res.status(400).json({ error: "departmentSlug query is required" });
    }
    res.json({ mills: await listMills(departmentSlug) });
  });

  router.post("/mills", async (req, res) => {
    const { departmentSlug, label, slug, sortOrder, active } = req.body;
    if (!departmentSlug?.trim() || !label?.trim()) {
      return res.status(400).json({ error: "departmentSlug and label are required" });
    }
    const dept = await getDepartmentBySlug(departmentSlug);
    if (!dept) return res.status(404).json({ error: "Department not found" });
    const finalSlug = (slug && String(slug).trim()) || slugify(label) || String(Date.now());
    const mill = await createMill({
      id: randomUUID(),
      departmentSlug: dept.slug,
      slug: finalSlug,
      label: label.trim(),
      sortOrder: Number(sortOrder) || 0,
      active: active !== false,
    });
    res.status(201).json({ mill });
  });

  router.post("/mills/bulk", async (req, res) => {
    const { departmentSlug, count, startFrom, labelPrefix } = req.body;
    if (!departmentSlug?.trim()) {
      return res.status(400).json({ error: "departmentSlug is required" });
    }
    const total = Number(count);
    if (!Number.isFinite(total) || total < 1 || total > 50) {
      return res.status(400).json({ error: "count must be between 1 and 50" });
    }
    const start = Number(startFrom) || 1;
    const prefix = (labelPrefix && String(labelPrefix).trim()) || "Mill";
    const dept = await getDepartmentBySlug(departmentSlug);
    if (!dept) return res.status(404).json({ error: "Department not found" });

    const existing = await listMills(dept.slug);
    const usedSlugs = new Set(existing.map((m) => m.slug));
    const created = [];

    for (let i = 0; i < total; i++) {
      const num = start + i;
      const slug = String(num);
      if (usedSlugs.has(slug)) {
        return res.status(409).json({
          error: `Mill slug "${slug}" already exists. Delete or adjust start number.`,
        });
      }
      const mill = await createMill({
        id: randomUUID(),
        departmentSlug: dept.slug,
        slug,
        label: `${prefix} ${num}`,
        sortOrder: num,
        active: true,
      });
      usedSlugs.add(slug);
      created.push(mill);
    }

    res.status(201).json({ mills: created, count: created.length });
  });

  router.patch("/mills/:id", async (req, res) => {
    const { label, slug, sortOrder, active } = req.body;
    const patch = {};
    if (label !== undefined) patch.label = String(label).trim();
    if (slug !== undefined) patch.slug = String(slug).trim();
    if (sortOrder !== undefined) patch.sortOrder = Number(sortOrder) || 0;
    if (active !== undefined) patch.active = Boolean(active);
    const mill = await updateMill(req.params.id, patch);
    if (!mill) return res.status(404).json({ error: "Not found" });
    res.json({ mill });
  });

  router.delete("/mills/:id", async (req, res) => {
    const mill = await deleteMill(req.params.id);
    if (!mill) return res.status(404).json({ error: "Not found" });
    res.json({ success: true });
  });

  router.get("/form-fields", async (req, res) => {
    res.json({ fields: await listFormFields() });
  });

  router.post("/form-fields", async (req, res) => {
    const { fieldKey, label, type, placeholder, required, sortOrder, active, options } = req.body;
    if (!fieldKey?.trim() || !label?.trim()) {
      return res.status(400).json({ error: "fieldKey and label are required" });
    }
    const key = fieldKey.trim().replace(/\s+/g, "_");
    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(key)) {
      return res.status(400).json({ error: "fieldKey must start with a letter and use letters, numbers, underscore" });
    }
    const fieldType = FORM_FIELD_TYPES.includes(type) ? type : "text";
    const normalizedOptions = normalizeFieldOptions(options);
    if (fieldType === "select" && !normalizedOptions.length) {
      return res.status(400).json({ error: "Select fields need at least one option." });
    }
    const field = await createFormField({
      id: randomUUID(),
      fieldKey: key,
      label: label.trim(),
      type: fieldType,
      options: fieldType === "select" ? normalizedOptions : [],
      placeholder: placeholder?.trim() || "",
      required: required !== false,
      sortOrder: Number(sortOrder) || 0,
      active: active !== false,
    });
    res.status(201).json({ field });
  });

  router.patch("/form-fields/:id", async (req, res) => {
    const { label, type, placeholder, required, sortOrder, active, options } = req.body;
    const patch = {};
    if (label !== undefined) patch.label = String(label).trim();
    if (type !== undefined) {
      if (!FORM_FIELD_TYPES.includes(type)) {
        return res.status(400).json({ error: "Invalid field type" });
      }
      patch.type = type;
    }
    if (options !== undefined) {
      patch.options = normalizeFieldOptions(options);
    }
    if (patch.type === "select" || (options !== undefined && patch.options)) {
      const nextType = patch.type;
      const existing = await listFormFields();
      const current = existing.find((f) => f.id === req.params.id);
      const effectiveType = nextType || current?.type;
      const effectiveOptions =
        patch.options !== undefined ? patch.options : normalizeFieldOptions(current?.options);
      if (effectiveType === "select" && !effectiveOptions.length) {
        return res.status(400).json({ error: "Select fields need at least one option." });
      }
      if (effectiveType === "select") patch.options = effectiveOptions;
    }
    if (type !== undefined && type !== "select") {
      patch.options = [];
    }
    if (placeholder !== undefined) patch.placeholder = String(placeholder).trim();
    if (required !== undefined) patch.required = Boolean(required);
    if (sortOrder !== undefined) patch.sortOrder = Number(sortOrder) || 0;
    if (active !== undefined) patch.active = Boolean(active);
    const field = await updateFormField(req.params.id, patch);
    if (!field) return res.status(404).json({ error: "Not found" });
    res.json({ field });
  });

  router.delete("/form-fields/:id", async (req, res) => {
    const field = await deleteFormField(req.params.id);
    if (!field) return res.status(404).json({ error: "Not found" });
    res.json({ success: true });
  });

  return router;
}
