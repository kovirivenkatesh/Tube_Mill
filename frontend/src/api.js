const API = import.meta.env.VITE_API_BASE || "/api";

export function getToken() {
  return localStorage.getItem("token");
}

export function setAuth(token, user) {
  localStorage.setItem("token", token);
  persistUser(user);
}

export function persistUser(user) {
  if (!user) return;
  const { profileImage, ...lite } = user;
  localStorage.setItem("user", JSON.stringify(lite));
}

export function clearAuth() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

export function getStoredUser() {
  const raw = localStorage.getItem("user");
  return raw ? JSON.parse(raw) : null;
}

async function request(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...options.headers };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

export const api = {
  register: (body) => request("/auth/register", { method: "POST", body: JSON.stringify(body) }),
  login: (body) => request("/auth/login", { method: "POST", body: JSON.stringify(body) }),
  verifyForgotPasswordEmail: (email) =>
    request("/auth/forgot-password/verify-email", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
  resetForgotPassword: (body) =>
    request("/auth/forgot-password/reset", { method: "POST", body: JSON.stringify(body) }),
  me: () => request("/auth/me"),
  updateSupervisorEmail: (supervisorEmail) =>
    request("/user/supervisor-email", {
      method: "PATCH",
      body: JSON.stringify({ supervisorEmail }),
    }),
  updateProfileImage: (profileImage) =>
    request("/user/profile-image", {
      method: "PATCH",
      body: JSON.stringify({ profileImage }),
    }),
  updateUserName: (name) =>
    request("/user/name", { method: "PATCH", body: JSON.stringify({ name }) }),
  removeProfileImage: () => request("/user/profile-image", { method: "DELETE" }),
  createSubmission: (body) =>
    request("/submissions", { method: "POST", body: JSON.stringify(body) }),
  listSubmissions: () => request("/submissions"),
  getSubmission: (id) => request(`/submissions/${id}`),
  getDepartments: () => request("/config/departments"),
  getMills: (departmentSlug) =>
    request(`/config/departments/${encodeURIComponent(departmentSlug)}/mills`),
  getFormFields: () => request("/config/form-fields"),
  adminListDepartments: () => request("/admin/departments"),
  adminCreateDepartment: (body) =>
    request("/admin/departments", { method: "POST", body: JSON.stringify(body) }),
  adminUpdateDepartment: (id, body) =>
    request(`/admin/departments/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  adminDeleteDepartment: (id) => request(`/admin/departments/${id}`, { method: "DELETE" }),
  adminListMills: (departmentSlug) =>
    request(`/admin/mills?departmentSlug=${encodeURIComponent(departmentSlug)}`),
  adminCreateMill: (body) => request("/admin/mills", { method: "POST", body: JSON.stringify(body) }),
  adminBulkCreateMills: (body) =>
    request("/admin/mills/bulk", { method: "POST", body: JSON.stringify(body) }),
  adminUpdateMill: (id, body) =>
    request(`/admin/mills/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  adminDeleteMill: (id) => request(`/admin/mills/${id}`, { method: "DELETE" }),
  adminListFormFields: () => request("/admin/form-fields"),
  adminCreateFormField: (body) =>
    request("/admin/form-fields", { method: "POST", body: JSON.stringify(body) }),
  adminUpdateFormField: (id, body) =>
    request(`/admin/form-fields/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  adminDeleteFormField: (id) => request(`/admin/form-fields/${id}`, { method: "DELETE" }),
};
