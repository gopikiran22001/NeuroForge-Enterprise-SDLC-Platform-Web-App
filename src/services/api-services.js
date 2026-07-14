import { api } from "@/lib/api";

// ─── Auth Service ─────────────────────────────────────────────
export const authService = {
  login: (email, password) => api.post("/api/auth/login", { email, password }),
  register: (payload) => api.post("/api/auth/register", payload),
  logout: () => api.post("/api/auth/logout"),
  refresh: () =>
    api.post("/api/auth/refresh", null, {
      headers: { "Content-Type": "application/json" },
    }),
};

// ─── User Service ─────────────────────────────────────────────
export const userService = {
  getProfile: () => api.get("/api/users/profile"),

  search: ({ search, status, role, page = 0, size = 20 } = {}) => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    if (role) params.set("role", role);
    params.set("page", String(page));
    params.set("size", String(size));
    return api.get(`/api/users?${params.toString()}`).catch((err) => {
      if (err.status === 403) {
        return { content: [] };
      }
      throw err;
    });
  },

  getById: (id) =>
    api.get(`/api/users?id=${id}`).catch((err) => {
      if (err.status === 403) {
        return null;
      }
      throw err;
    }),

  create: (payload) => api.post("/api/users", payload),

  update: (id, payload) => api.put(`/api/users?id=${id}`, payload),

  updateSelf: (payload) => api.put("/api/users", payload),

  delete: (id) => api.delete(`/api/users?id=${id}`),

  approve: (id) => api.put(`/api/users/${id}/approve`),

  getPending: ({ page = 0, size = 20 } = {}) =>
    api.get(`/api/users/pending?page=${page}&size=${size}`),

  getStats: () => api.get("/api/users/stats"),
};

// ─── Project Service ──────────────────────────────────────────
export const projectService = {
  search: ({ search, status, page = 0, size = 20 } = {}) => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    params.set("page", String(page));
    params.set("size", String(size));
    return api.get(`/api/projects?${params.toString()}`);
  },

  getById: (id) => api.get(`/api/projects/${id}`),

  create: (payload) => api.post("/api/projects", payload),

  update: (id, payload) => api.put(`/api/projects/${id}`, payload),

  delete: (id) => api.delete(`/api/projects/${id}`),
};

// ─── Team Service ─────────────────────────────────────────────
export const teamService = {
  search: ({ search, status, page = 0, size = 20 } = {}) => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    params.set("page", String(page));
    params.set("size", String(size));
    return api.get(`/api/teams?${params.toString()}`);
  },

  getById: (id) => api.get(`/api/teams/${id}`),

  create: (payload) => api.post("/api/teams", payload),

  update: (id, payload) => api.put(`/api/teams/${id}`, payload),

  delete: (id) => api.delete(`/api/teams/${id}`),
};

// ─── Sprint Service ───────────────────────────────────────────
export const sprintService = {
  search: ({ search, status, projectId, page = 0, size = 20 } = {}) => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    if (projectId) params.set("projectId", projectId);
    params.set("page", String(page));
    params.set("size", String(size));
    return api.get(`/api/sprints?${params.toString()}`);
  },

  getById: (id) => api.get(`/api/sprints/${id}`),

  create: (payload) => api.post("/api/sprints", payload),

  update: (id, payload) => api.put(`/api/sprints/${id}`, payload),

  delete: (id) => api.delete(`/api/sprints/${id}`),

  getStats: ({ projectId } = {}) =>
    api.get(`/api/sprints/stats${projectId ? "?projectId=" + projectId : ""}`),
};

// ─── Milestone Service ────────────────────────────────────────
export const milestoneService = {
  search: ({ search, status, projectId, page = 0, size = 20 } = {}) => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    if (projectId) params.set("projectId", projectId);
    params.set("page", String(page));
    params.set("size", String(size));
    return api.get(`/api/milestones?${params.toString()}`);
  },

  getById: (id) => api.get(`/api/milestones/${id}`),

  create: (payload) => api.post("/api/milestones", payload),

  update: (id, payload) => api.put(`/api/milestones/${id}`, payload),

  delete: (id) => api.delete(`/api/milestones/${id}`),

  getStats: ({ projectId } = {}) =>
    api.get(`/api/milestones/stats${projectId ? "?projectId=" + projectId : ""}`),
};

// ─── Organization Service ────────────────────────────────────
export const organizationService = {
  search: ({ type, status, page = 0, size = 20 } = {}) => {
    const params = new URLSearchParams();
    if (type) params.set("type", type);
    if (status) params.set("status", status);
    params.set("page", String(page));
    params.set("size", String(size));
    return api.get(`/api/organizations?${params.toString()}`);
  },

  getById: (id) => api.get(`/api/organizations/${id}`),

  getBySlug: (slug) => api.get(`/api/organizations/slug/${slug}`),

  create: (payload) => api.post("/api/organizations", payload),

  update: (id, payload) => api.put(`/api/organizations/${id}`, payload),

  delete: (id) => api.delete(`/api/organizations/${id}`),

  approve: (id) => api.put(`/api/organizations/${id}/approve`),

  getActiveOrganizations: () => api.get("/api/organizations/active"),

  getStats: () => api.get("/api/organizations/stats"),
};

// ─── Task Service ─────────────────────────────────────────────
export const taskService = {
  search: ({ projectId, sprintId, status, search, page = 0, size = 100 } = {}) => {
    const params = new URLSearchParams();
    if (projectId) params.set("projectId", projectId);
    if (sprintId) params.set("sprintId", sprintId);
    if (status) params.set("status", status);
    if (search) params.set("search", search);
    params.set("page", String(page));
    params.set("size", String(size));
    return api.get(`/api/tasks?${params.toString()}`);
  },

  getById: (id) => api.get(`/api/tasks/${id}`),

  create: (payload) => api.post("/api/tasks", payload),

  update: (id, payload) => api.put(`/api/tasks/${id}`, payload),

  delete: (id) => api.delete(`/api/tasks/${id}`),

  addComment: (id, text) => api.post(`/api/tasks/${id}/comments`, { text }),

  addAttachment: (id, { name, size, url }) => api.post(`/api/tasks/${id}/attachments`, { name, size, url }),

  getActivityHistory: (id) => api.get(`/api/tasks/${id}/history`),
};

// ─── Audit Log Service ─────────────────────────────────────────
export const auditLogService = {
  search: ({ severity, search, page = 0, size = 20 } = {}) => {
    const params = new URLSearchParams();
    if (severity && severity !== "ALL") params.set("severity", severity);
    if (search) params.set("search", search);
    params.set("page", String(page));
    params.set("size", String(size));
    return api.get(`/api/audit-logs?${params.toString()}`);
  }
};
