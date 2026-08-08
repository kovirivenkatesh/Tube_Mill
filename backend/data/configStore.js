import { Department } from "../models/Department.js";
import { Mill } from "../models/Mill.js";
import { FormField } from "../models/FormField.js";

function toPlain(doc) {
  if (!doc) return null;
  const o = doc.toObject ? doc.toObject() : doc;
  const { _id, __v, ...rest } = o;
  return rest;
}

export async function listDepartments({ activeOnly = false } = {}) {
  const q = activeOnly ? { active: true } : {};
  const docs = await Department.find(q).sort({ sortOrder: 1, label: 1 });
  return docs.map(toPlain);
}

export async function getDepartmentBySlug(slug) {
  const doc = await Department.findOne({ slug: slug.toLowerCase().trim() });
  return toPlain(doc);
}

export async function createDepartment(data) {
  const doc = await Department.create(data);
  return toPlain(doc);
}

export async function updateDepartment(id, patch) {
  const doc = await Department.findOneAndUpdate({ id }, { $set: patch }, { new: true });
  return toPlain(doc);
}

export async function deleteDepartment(id) {
  const doc = await Department.findOneAndDelete({ id });
  if (doc) {
    await Mill.deleteMany({ departmentSlug: doc.slug });
  }
  return toPlain(doc);
}

export async function listMills(departmentSlug, { activeOnly = false } = {}) {
  const q = { departmentSlug: departmentSlug.toLowerCase().trim() };
  if (activeOnly) q.active = true;
  const docs = await Mill.find(q).sort({ sortOrder: 1, label: 1 });
  return docs.map(toPlain);
}

export async function getMill(departmentSlug, millSlug) {
  const doc = await Mill.findOne({
    departmentSlug: departmentSlug.toLowerCase().trim(),
    slug: String(millSlug).trim(),
  });
  return toPlain(doc);
}

export async function createMill(data) {
  const doc = await Mill.create(data);
  return toPlain(doc);
}

export async function updateMill(id, patch) {
  const doc = await Mill.findOneAndUpdate({ id }, { $set: patch }, { new: true });
  return toPlain(doc);
}

export async function deleteMill(id) {
  const doc = await Mill.findOneAndDelete({ id });
  return toPlain(doc);
}

export async function listFormFields({ activeOnly = false } = {}) {
  const q = activeOnly ? { active: true } : {};
  const docs = await FormField.find(q).sort({ sortOrder: 1, label: 1 });
  return docs.map(toPlain);
}

export async function getFormFieldByKey(fieldKey) {
  const doc = await FormField.findOne({ fieldKey: fieldKey.trim() });
  return toPlain(doc);
}

export async function createFormField(data) {
  const doc = await FormField.create(data);
  return toPlain(doc);
}

export async function updateFormField(id, patch) {
  const doc = await FormField.findOneAndUpdate({ id }, { $set: patch }, { new: true });
  return toPlain(doc);
}

export async function deleteFormField(id) {
  const doc = await FormField.findOneAndDelete({ id });
  return toPlain(doc);
}
