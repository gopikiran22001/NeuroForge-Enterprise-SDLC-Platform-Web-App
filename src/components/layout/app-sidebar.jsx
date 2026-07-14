import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  FolderKanban,
  Layers,
  Flag,
  ListChecks,
  GitBranch,
  Workflow,
  Rocket,
  Server,
  Activity,
  Users,
  UsersRound,
  ShieldCheck,
  FileClock,
  BarChart3,
  Settings,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useSession } from "@/lib/session";
import { NeuroForgeLogo } from "@/components/neuroforge-logo";
import { canViewRoute } from "@/lib/permissions";
const NAV = [
  {
    label: "Overview",
    items: [{ title: "Dashboard", url: "/", icon: LayoutDashboard }],
  },
  {
    label: "Delivery",
    items: [
      { title: "Projects", url: "/projects", icon: FolderKanban },
      { title: "Sprints", url: "/sprints", icon: Layers },
      { title: "Milestones", url: "/milestones", icon: Flag },
      { title: "Tasks", url: "/tasks", icon: ListChecks },
    ],
  },
  {
    label: "Engineering",
    items: [
      { title: "Repositories", url: "/repositories", icon: GitBranch },
      { title: "Pipelines", url: "/pipelines", icon: Workflow },
      { title: "Releases", url: "/releases", icon: Rocket },
      { title: "Deployments", url: "/deployments", icon: Server },
      { title: "Monitoring", url: "/monitoring", icon: Activity },
    ],
  },
  {
    label: "Organization",
    items: [
      { title: "Organizations", url: "/organizations", icon: ShieldCheck },
      { title: "Users", url: "/users", icon: Users },
      { title: "Teams", url: "/teams", icon: UsersRound },
      { title: "Roles", url: "/roles", icon: ShieldCheck },
      { title: "Audit Log", url: "/audit-log", icon: FileClock },
    ],
  },
  {
    label: "Insights",
    items: [
      { title: "Reports", url: "/reports", icon: BarChart3 },
      { title: "Settings", url: "/settings", icon: Settings },
    ],
  },
];
export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user } = useSession();
  const isActive = (path) =>
    path === "/" ? pathname === "/" : pathname === path || pathname.startsWith(path + "/");
  const filteredNav = NAV.map((group) => {
    const items = group.items.filter((item) => canViewRoute(user?.role, item.url));
    return { ...group, items };
  }).filter((group) => group.items.length > 0);

  return (
    <Sidebar collapsible="icon" className="border-r hairline">
      <SidebarHeader className="border-b hairline">
        <div className="flex items-center gap-2 px-1 py-1">
          <div className="grid size-8 place-items-center shrink-0 text-primary">
            <NeuroForgeLogo className="size-7" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="text-lg font-semibold text-foreground ">NeuroForge</div>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="[&::-webkit-scrollbar]:hidden [scrollbar-width:none] [-ms-overflow-style:none]">
        {filteredNav.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const active = isActive(item.url);
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                        <Link to={item.url} className="flex items-center gap-2">
                          <item.icon className="size-4 shrink-0" />
                          <span className="truncate">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t hairline">
        <div className="flex items-center gap-2 px-1 py-1">
          <div
            className="grid size-8 place-items-center rounded-full text-[11px] font-medium text-primary-foreground shrink-0"
            style={{ background: user.avatarColor }}
          >
            {user && user.name
              ? user.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)
              : "U"}
          </div>
          {!collapsed && (
            <div className="min-w-0 leading-tight">
              <div className="truncate text-sm font-medium">{user.name}</div>
              <div className="truncate text-[11px] text-muted-foreground">{user.title}</div>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
