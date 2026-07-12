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
};
