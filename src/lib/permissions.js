export const ROLE_LABEL = {
  super_admin: "Super Administrator",
  admin: "Organization Administrator",
  pm: "Project Manager",
  developer: "Developer",
  tester: "Tester",
  devops: "DevOps Engineer",
};

// ─── Granular permission matrix ──────────────────────────────
const MATRIX = {
  super_admin: [
    "manage_organizations",
    "approve_organizations",
    "view_all_users",
    "approve_org_admins",
  ],
  admin: [
    "manage_users",
    "manage_roles",
    "view_audit",
    "create_project",
    "invite_users",
    "start_sprint",
    "cut_release",
    "deploy",
    "run_tests",
    "view_billing",
    "create_task",
    "create_branch",
    "log_bug",
    "run_test_suite",
    "trigger_build",
    "approve_users",
    "manage_teams",
    "manage_sprints",
    "manage_milestones",
    "manage_projects",
    "view_users",
    "view_teams",
    "view_projects",
    "view_sprints",
    "view_milestones",
    "view_reports",
  ],
  pm: [
    "invite_users",
    "start_sprint",
    "cut_release",
    "create_task",
    "log_bug",
    "manage_teams",
    "manage_sprints",
    "manage_milestones",
    "view_users",
    "view_teams",
    "view_projects",
    "view_sprints",
    "view_milestones",
    "view_reports",
  ],
  developer: [
    "run_tests",
    "create_task",
    "create_branch",
    "view_projects",
    "view_sprints",
    "view_milestones",
    "view_teams",
  ],
  tester: [
    "run_test_suite",
    "log_bug",
    "view_projects",
    "view_sprints",
    "view_milestones",
    "view_reports",
  ],
  devops: [
    "cut_release",
    "deploy",
    "trigger_build",
    "view_projects",
    "view_sprints",
    "view_milestones",
  ],
};

export function can(role, action) {
  if (!role || !MATRIX[role]) return false;
  return MATRIX[role].includes(action);
}

// ─── Sidebar module visibility per role ──────────────────────
// Each entry maps to a route URL used by the sidebar
const SIDEBAR_VISIBILITY = {
  super_admin: ["/", "/organizations"],
  admin: [
    "/",
    "/projects",
    "/sprints",
    "/milestones",
    "/tasks",
    "/repositories",
    "/pipelines",
    "/releases",
    "/deployments",
    "/monitoring",
    "/users",
    "/teams",
    "/roles",
    "/audit-log",
    "/reports",
    "/settings",
  ],
  pm: [
    "/",
    "/projects",
    "/sprints",
    "/milestones",
    "/tasks",
    "/teams",
    "/reports",
    "/settings",
  ],
  developer: [
    "/",
    "/projects",
    "/sprints",
    "/milestones",
    "/tasks",
    "/repositories",
    "/pipelines",
    "/settings",
  ],
  tester: [
    "/",
    "/projects",
    "/sprints",
    "/milestones",
    "/tasks",
    "/reports",
    "/settings",
  ],
  devops: [
    "/",
    "/projects",
    "/sprints",
    "/milestones",
    "/pipelines",
    "/releases",
    "/deployments",
    "/monitoring",
    "/settings",
  ],
};

export function canViewRoute(role, routeUrl) {
  if (!role || !SIDEBAR_VISIBILITY[role]) return false;
  return SIDEBAR_VISIBILITY[role].includes(routeUrl);
}
