import { Link, useRouterState, useMatches } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { useSession } from "@/lib/session";

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
  const { user } = useSession();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const matches = useMatches();

  const orgName = user?.organizationName || "NeuroForge";

  // Find project details from active route matches to get the name instead of UUID
  const projectMatch = matches.find(
    (m) => m.id === "/projects/$projectId" || m.routeId === "/projects/$projectId"
  );
  const projectId = projectMatch?.params?.projectId;
  const projectName =
    projectMatch?.loaderData?.project?.name || projectMatch?.loaderData?.rawProject?.name;

  const parts = pathname.split("/").filter(Boolean);

  // Prepend organization name as the root of the breadcrumb trail
  const crumbs = [
    {
      label: orgName,
      href: "/",
    },
  ];

  parts.forEach((p, i) => {
    let label = LABELS[p] ?? p;
    
    // Resolve project ID to project name
    if (projectId && p === projectId && projectName) {
      label = projectName;
    }

    crumbs.push({
      label,
      href: "/" + parts.slice(0, i + 1).join("/"),
    });
  });

  return (
    <nav className="flex items-center gap-1 text-[13px] text-muted-foreground min-w-0">
      {crumbs.map((c, i) => {
        const last = i === crumbs.length - 1;
        return (
          <div key={c.href + i} className="flex items-center gap-1 min-w-0">
            {i > 0 && <ChevronRight className="size-3.5 shrink-0 opacity-60" />}
            {last ? (
              <span className="truncate text-foreground font-medium">{c.label}</span>
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

