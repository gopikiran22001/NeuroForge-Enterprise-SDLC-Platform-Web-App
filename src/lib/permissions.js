export const ROLE_LABEL = {
  super_admin: "Super Administrator",
  admin: "Organization Administrator",
  pm: "Project Manager",
  developer: "Developer",
  tester: "Tester",
  devops: "DevOps Engineer",
};
const MATRIX = {
  super_admin: [
    "manage_organizations",
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
    "trigger_build"
  ],
  pm: [
    "invite_users",
    "start_sprint",
    "cut_release",
    "create_task",
    "log_bug"
  ],
  developer: [
    "run_tests",
    "create_task",
    "create_branch"
  ],
  tester: [
    "run_test_suite",
    "log_bug"
  ],
  devops: [
    "cut_release",
    "deploy",
    "trigger_build"
  ],
};
export function can(role, action) {
  return MATRIX[role].includes(action);
}
