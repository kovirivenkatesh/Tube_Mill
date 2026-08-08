import { randomUUID } from "crypto";
import { Department } from "../models/Department.js";
import { Mill } from "../models/Mill.js";
import { FormField } from "../models/FormField.js";

export const DEFAULT_SECTION_OPTIONS = [
  "Entry",
  "Exit",
  "Forming",
  "Welding",
  "Sizing",
  "Cut-off",
];

const DEFAULT_DEPARTMENTS = [
  {
    slug: "electrical",
    label: "Electrical",
    icon: "⚡",
    description: "Motors, drives, control panels",
    sortOrder: 0,
  },
  {
    slug: "mechanical",
    label: "Mechanical",
    icon: "⚙️",
    description: "Rollers, bearings, alignment",
    sortOrder: 1,
  },
];

const DEFAULT_FIELDS = [
  { fieldKey: "empName", label: "Employee name", type: "text", sortOrder: 0 },
  { fieldKey: "empId", label: "Employee ID", type: "text", sortOrder: 1 },
  { fieldKey: "section", label: "Section", type: "select", options: DEFAULT_SECTION_OPTIONS, sortOrder: 2 },
  {
    fieldKey: "description",
    label: "Description",
    type: "textarea",
    sortOrder: 3,
  },
];

export async function seedAppConfigIfEmpty() {
  const deptCount = await Department.countDocuments();
  if (deptCount === 0) {
    for (const d of DEFAULT_DEPARTMENTS) {
      await Department.create({ id: randomUUID(), ...d, active: true });
    }
    console.log("[seed] Default departments created");
  }

  const millCount = await Mill.countDocuments();
  if (millCount === 0) {
    for (const dept of DEFAULT_DEPARTMENTS) {
      for (let n = 1; n <= 9; n++) {
        await Mill.create({
          id: randomUUID(),
          departmentSlug: dept.slug,
          slug: String(n),
          label: `Mill ${n}`,
          sortOrder: n,
          active: true,
        });
      }
    }
    console.log("[seed] Default mills created (9 per department)");
  }

  const fieldCount = await FormField.countDocuments();
  if (fieldCount === 0) {
    for (const f of DEFAULT_FIELDS) {
      await FormField.create({
        id: randomUUID(),
        ...f,
        required: true,
        active: true,
      });
    }
    console.log("[seed] Default form fields created");
  }

  await migrateSectionFieldToSelect();
}

/** Existing DBs: turn Section into a dropdown with default choices if still plain text. */
async function migrateSectionFieldToSelect() {
  const doc = await FormField.findOne({ fieldKey: "section" });
  if (!doc) return;
  const patch = {};
  if (doc.type !== "select") patch.type = "select";
  if (!Array.isArray(doc.options) || doc.options.length === 0) {
    patch.options = DEFAULT_SECTION_OPTIONS;
  }
  if (Object.keys(patch).length === 0) return;
  await FormField.updateOne({ id: doc.id }, { $set: patch });
  console.log("[seed] Section field updated to dropdown with options");
}
