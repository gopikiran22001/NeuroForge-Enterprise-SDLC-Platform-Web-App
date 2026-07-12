import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
const LABELS = {
  "": "Dashboard",
  projects: "Projects",
  sprints: "Sprints",
  milestones: "Milestones",
  tasks: "Tasks",
  repositories: "Repositories",
  pipelines: "Pipelines",
  releases: "Releases",
  deployments: "Deployments",
  monitoring: "Monitoring",
  users: "Users",
  teams: "Teams",
  roles: "Roles",
  "audit-log": "Audit log",
  reports: "Reports",
  settings: "Settings",
  login: "Sign in",
};
export function Breadcrumbs() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const parts = pathname.split("/").filter(Boolean);
  const crumbs =
    parts.length === 0
      ? [{ label: "Dashboard", href: "/" }]
      : parts.map((p, i) => ({
          label: LABELS[p] ?? p,
          href: "/" + parts.slice(0, i + 1).join("/"),
        }));
  return (
    <nav className="flex items-center gap-1 text-[13px] text-muted-foreground min-w-0">
      {crumbs.map((c, i) => {
        const last = i === crumbs.length - 1;
        return (
          <div key={c.href + i} className="flex items-center gap-1 min-w-0">
            {i > 0 && <ChevronRight className="size-3.5 shrink-0 opacity-60" />}
            {last ? (
              <span className="truncate text-foreground">{c.label}</span>
            ) : (
              <Link to={c.href} className="truncate hover:text-foreground transition-colors">
                {c.label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
