import {
  getDepartmentBySlug,
  getMill,
  listFormFields,
} from "../data/configStore.js";

export function resolveUserRole(email, existingRole) {
  if (existingRole === "admin") return "admin";
  const admins = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (admins.includes(String(email).toLowerCase())) return "admin";
  return "user";
}

export function normalizeSupervisorEmails(supervisorEmail, supervisorEmails) {
  const raw = [];
  if (Array.isArray(supervisorEmails)) {
    raw.push(...supervisorEmails);
  } else if (typeof supervisorEmails === "string" && supervisorEmails.trim()) {
    raw.push(
      ...supervisorEmails.split(/[,;]+/).map((e) => e.trim())
    );
  }
  if (supervisorEmail?.trim()) {
    raw.unshift(supervisorEmail.trim());
  }

  const seen = new Set();
  const out = [];
  for (const item of raw) {
    const e = String(item).trim().toLowerCase();
    if (!e) continue;
    if (seen.has(e)) continue;
    seen.add(e);
    out.push(e);
  }

  if (out.length > 10) {
    return { error: "You can add up to 10 supervisor emails." };
  }
  for (const e of out) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
      return { error: `Invalid email: ${e}` };
    }
  }
  if (!out.length) {
    return { error: "At least one supervisor email is required." };
  }
  return { emails: out };
}

export async function validateAndNormalizeSubmissionInput(body) {
  const {
    departmentSlug,
    millSlug,
    formData,
    supervisorEmail,
    supervisorEmails,
    images,
    // legacy fallback
    empName,
    empId,
    dept,
    section,
    description,
    tubeMill,
  } = body;

  const deptSlug = (departmentSlug || dept || "").toString().toLowerCase().trim();
  const mSlug = (millSlug || tubeMill || "").toString().trim();

  if (!deptSlug || !mSlug) {
    return { error: "Department and mill are required" };
  }

  const department = await getDepartmentBySlug(deptSlug);
  if (!department || !department.active) {
    return { error: "Department not found" };
  }

  const mill = await getMill(deptSlug, mSlug);
  if (!mill || !mill.active) {
    return { error: "Mill not found" };
  }

  const fields = await listFormFields({ activeOnly: true });
  const rawForm =
    formData && typeof formData === "object"
      ? formData
      : {
          empName,
          empId,
          section,
          description,
        };

  const normalizedForm = {};
  const formSnapshot = [];

  for (const field of fields) {
    const val = rawForm[field.fieldKey];
    const str = val === undefined || val === null ? "" : String(val).trim();
    if (field.required && !str) {
      return { error: `${field.label} is required` };
    }
    if (field.type === "select" && str && Array.isArray(field.options) && field.options.length) {
      if (!field.options.includes(str)) {
        return { error: `Please choose a valid ${field.label}` };
      }
    }
    normalizedForm[field.fieldKey] = str;
    formSnapshot.push({
      key: field.fieldKey,
      label: field.label,
      type: field.type,
      options: Array.isArray(field.options) ? field.options : [],
    });
  }

  const legacy = {
    empName: normalizedForm.empName || "",
    empId: normalizedForm.empId || "",
    section: normalizedForm.section || "",
    description: normalizedForm.description || "",
    dept: department.label,
    tubeMill: mill.label,
  };

  const emailResult = normalizeSupervisorEmails(supervisorEmail, supervisorEmails);
  if (emailResult.error) {
    return { error: emailResult.error };
  }

  return {
    department,
    mill,
    formData: normalizedForm,
    formSnapshot,
    legacy,
    supervisorEmails: emailResult.emails,
    images,
  };
}

export function submissionDetailRows(submission) {
  if (submission.formSnapshot?.length) {
    return submission.formSnapshot.map((f) => ({
      label: f.label,
      value: submission.formData?.[f.key] ?? "",
    }));
  }
  return [
    { label: "Employee name", value: submission.empName },
    { label: "Employee ID", value: submission.empId },
    { label: "Section", value: submission.section },
    { label: "Description", value: submission.description },
  ];
}
