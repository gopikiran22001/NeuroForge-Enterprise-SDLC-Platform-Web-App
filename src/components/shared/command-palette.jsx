import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
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
  Plus,
  UserPlus,
  Play,
  Package,
} from "lucide-react";
const Ctx = createContext(null);
export function useCommandPalette() {
  const c = useContext(Ctx);
  if (!c) return { open: false, setOpen: () => {} };
  return c;
}
const NAV = [
  { label: "Dashboard", url: "/", icon: LayoutDashboard },
  { label: "Projects", url: "/projects", icon: FolderKanban },
  { label: "Sprints", url: "/sprints", icon: Layers },
  { label: "Milestones", url: "/milestones", icon: Flag },
  { label: "Tasks", url: "/tasks", icon: ListChecks },
  { label: "Repositories", url: "/repositories", icon: GitBranch },
  { label: "Pipelines", url: "/pipelines", icon: Workflow },
  { label: "Releases", url: "/releases", icon: Rocket },
  { label: "Deployments", url: "/deployments", icon: Server },
  { label: "Monitoring", url: "/monitoring", icon: Activity },
  { label: "Users", url: "/users", icon: Users },
  { label: "Teams", url: "/teams", icon: UsersRound },
  { label: "Roles", url: "/roles", icon: ShieldCheck },
  { label: "Audit log", url: "/audit-log", icon: FileClock },
  { label: "Reports", url: "/reports", icon: BarChart3 },
  { label: "Settings", url: "/settings", icon: Settings },
];
const ACTIONS = [
  { label: "Create new project", icon: Plus },
  { label: "Invite users to workspace", icon: UserPlus },
  { label: "Start a new sprint", icon: Play },
  { label: "Cut a release", icon: Package },
];
export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const value = useMemo(() => ({ open, setOpen }), [open]);
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return (
    <Ctx.Provider value={value}>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search projects, people, actions…" />
        <CommandList>
          <CommandEmpty>No results.</CommandEmpty>
          <CommandGroup heading="Navigate">
            {NAV.map((n) => (
              <CommandItem
                key={n.url}
                onSelect={() => {
                  setOpen(false);
                  navigate({ to: n.url });
                }}
              >
                <n.icon className="size-4" />
                <span>{n.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Actions">
            {ACTIONS.map((a) => (
              <CommandItem key={a.label} onSelect={() => setOpen(false)}>
                <a.icon className="size-4" />
                <span>{a.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </Ctx.Provider>
  );
}
