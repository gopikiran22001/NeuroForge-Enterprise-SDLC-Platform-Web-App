import { api } from "@/lib/api";

export const authService = {
  login: (email, password) => api.post("/api/auth/login", { email, password }),
  register: (payload) => api.post("/api/auth/register", payload),
  logout: () => api.post("/api/auth/logout"),
  refresh: () =>
    api.post("/api/auth/refresh", null, {
      headers: { "Content-Type": "application/json" },
    }),
};

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

  getGitHubDashboard: (id) => api.get(`/api/projects/${id}/github-dashboard`),
};

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

export const scmConnectionService = {
  search: () => Promise.resolve({ content: [] }),
  getById: () => Promise.resolve(null),
  create: () => Promise.reject(new Error("SCM Connections have been migrated to Project Repository properties.")),
  update: () => Promise.reject(new Error("SCM Connections have been migrated to Project Repository properties.")),
  delete: () => Promise.resolve(),
};

export const githubIntegrationService = {
  search: ({ organizationId, status, search, page = 0, size = 20 } = {}) => {
    const params = new URLSearchParams();
    if (organizationId) params.set("organizationId", organizationId);
    if (status) params.set("status", status);
    if (search) params.set("search", search);
    params.set("page", String(page));
    params.set("size", String(size));
    return api.get(`/api/github-integrations?${params.toString()}`);
  },

  getById: (id) => api.get(`/api/github-integrations/${id}`),

  create: (payload) => api.post("/api/github-integrations", payload),

  update: (id, payload) => api.put(`/api/github-integrations/${id}`, payload),

  delete: (id) => api.delete(`/api/github-integrations/${id}`),

  validate: (id) => api.post(`/api/github-integrations/${id}/validate`),

  getRepositories: (id, { search, page = 0, size = 20 } = {}) => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    params.set("page", String(page));
    params.set("size", String(size));
    return api.get(`/api/github-integrations/${id}/repositories?${params.toString()}`);
  },

  getRepositoryDetails: (id, owner, repo) =>
    api.get(`/api/github-integrations/${id}/repositories/${owner}/${repo}`),

  getBranches: (id, owner, repo, { search, page = 0, size = 20 } = {}) => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    params.set("page", String(page));
    params.set("size", String(size));
    return api.get(`/api/github-integrations/${id}/repositories/${owner}/${repo}/branches?${params.toString()}`);
  },

  getCommits: (id, owner, repo, { page = 0, size = 20 } = {}) =>
    api.get(`/api/github-integrations/${id}/repositories/${owner}/${repo}/commits?page=${page}&size=${size}`),

  getPullRequests: (id, owner, repo, { state, page = 0, size = 20 } = {}) => {
    const params = new URLSearchParams();
    if (state) params.set("state", state);
    params.set("page", String(page));
    params.set("size", String(size));
    return api.get(`/api/github-integrations/${id}/repositories/${owner}/${repo}/pull-requests?${params.toString()}`);
  },

  getReleases: (id, owner, repo, { page = 0, size = 20 } = {}) =>
    api.get(`/api/github-integrations/${id}/repositories/${owner}/${repo}/releases?page=${page}&size=${size}`),

  getContributors: (id, owner, repo, { page = 0, size = 20 } = {}) =>
    api.get(`/api/github-integrations/${id}/repositories/${owner}/${repo}/contributors?page=${page}&size=${size}`),

  getWorkflows: (id, owner, repo, { page = 0, size = 20 } = {}) =>
    api.get(`/api/github-integrations/${id}/repositories/${owner}/${repo}/workflows?page=${page}&size=${size}`),
};

export const pipelineService = {
  search: ({ projectId, search, status, page = 0, size = 50 } = {}) => {
    const params = new URLSearchParams();
    if (projectId) params.set("projectId", projectId);
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    params.set("page", String(page));
    params.set("size", String(size));
    return api.get(`/api/pipelines?${params.toString()}`);
  },

  getById: (id) => api.get(`/api/pipelines/${id}`),

  create: (payload) => api.post("/api/pipelines", payload),

  update: (id, payload) => api.put(`/api/pipelines/${id}`, payload),

  delete: (id) => api.delete(`/api/pipelines/${id}`),

  getStats: (projectId) =>
    api.get(`/api/pipelines/stats${projectId ? "?projectId=" + projectId : ""}`),

  getWorkflowRuns: (pipelineId, { branch, status, actor, page = 0, size = 20 } = {}) => {
    const params = new URLSearchParams();
    if (branch) params.set("branch", branch);
    if (status) params.set("status", status);
    if (actor) params.set("actor", actor);
    params.set("page", String(page));
    params.set("size", String(size));
    return api.get(`/api/pipelines/${pipelineId}/workflow-runs?${params.toString()}`);
  },

  getMonitoringStats: (pipelineId) => api.get(`/api/pipelines/${pipelineId}/monitoring-stats`),

  getWorkflowRunDetails: (pipelineId, runId) =>
    api.get(`/api/pipelines/${pipelineId}/workflow-runs/${runId}`),

  getWorkflowRunJobs: (pipelineId, runId) =>
    api.get(`/api/pipelines/${pipelineId}/workflow-runs/${runId}/jobs`),

  getWorkflowRunLogs: (pipelineId, runId) =>
    api.get(`/api/pipelines/${pipelineId}/workflow-runs/${runId}/logs`),
};

export const buildService = {
  search: ({ pipelineId, status, page = 0, size = 50 } = {}) => {
    const params = new URLSearchParams();
    if (pipelineId) params.set("pipelineId", pipelineId);
    if (status) params.set("status", status);
    params.set("page", String(page));
    params.set("size", String(size));
    return api.get(`/api/builds?${params.toString()}`);
  },

  getById: (id) => api.get(`/api/builds/${id}`),

  create: (payload) => api.post("/api/builds", payload),

  update: (id, payload) => api.put(`/api/builds/${id}`, payload),

  delete: (id) => api.delete(`/api/builds/${id}`),

  getLatest: (pipelineId) => api.get(`/api/builds/latest?pipelineId=${pipelineId}`),

  getLogs: (id) => api.get(`/api/builds/${id}/logs`),

  getStats: () => api.get("/api/builds/stats"),
};

export const deploymentService = {
  search: ({ buildId, pipelineId, environment, status, page = 0, size = 50 } = {}) => {
    const params = new URLSearchParams();
    if (buildId) params.set("buildId", buildId);
    if (pipelineId) params.set("pipelineId", pipelineId);
    if (environment) params.set("environment", environment);
    if (status) params.set("status", status);
    params.set("page", String(page));
    params.set("size", String(size));
    return api.get(`/api/deployments?${params.toString()}`);
  },

  getById: (id) => api.get(`/api/deployments/${id}`),

  create: (payload) => api.post("/api/deployments", payload),

  update: (id, payload) => api.put(`/api/deployments/${id}`, payload),

  delete: (id) => api.delete(`/api/deployments/${id}`),

  getStats: () => api.get("/api/deployments/stats"),
};

export const dashboardService = {
  getStats: (projectId) =>
    api.get(`/api/dashboard/stats${projectId ? "?projectId=" + projectId : ""}`),
};

export const analyticsService = {
  getOrganizationDashboard: () => api.get("/api/analytics/organization"),

  getActivityTimeline: (limit = 30) => api.get(`/api/analytics/activity-timeline?limit=${limit}`),

  downloadExportCsvUrl: () => "/api/analytics/export",
};
