import { Plus, UserPlus, Play, Package, GitBranch, AlertCircle, ListChecks, Server, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useSession } from "@/lib/session";
import { can } from "@/lib/permissions";
import { useNavigate } from "@tanstack/react-router";

const ACTIONS = [
  // PM / Admin Actions
  { icon: Plus, label: "New project", action: "create_project", url: "/projects", primary: true },
  { icon: UserPlus, label: "Invite users", action: "invite_users", url: "/users" },
  { icon: Play, label: "Start sprint", action: "start_sprint", url: "/sprints" },
  { icon: Package, label: "Cut release", action: "cut_release", url: "/releases" },

  // Developer Actions
  { icon: Plus, label: "New task", action: "create_task", url: "/tasks", primary: true },
  { icon: GitBranch, label: "Create branch", action: "create_branch", url: "/repositories" },
  { icon: Play, label: "Run tests", action: "run_tests", url: "/pipelines" },

  // Tester Actions
  { icon: AlertCircle, label: "Log bug", action: "log_bug", url: "/tasks", primary: true },
  { icon: ListChecks, label: "Run test suite", action: "run_test_suite", url: "/pipelines" },

  // DevOps Actions
  { icon: PlayCircle, label: "Trigger build", action: "trigger_build", url: "/pipelines", primary: true },
  { icon: Server, label: "Deploy prod", action: "deploy", url: "/deployments" },
];

export function QuickActions() {
  const { user } = useSession();
  const navigate = useNavigate();
  const activeActions = ACTIONS.filter((a) => can(user.role, a.action));

  const handleAction = (a) => {
    toast.success(`${a.label} initiated`, {
      description: `Opening workspace module for ${a.label}.`,
    });
    if (a.url) {
      navigate({ to: a.url });
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {activeActions.map((a) => (
        <Button
          key={a.label}
          size="sm"
          variant={a.primary ? "default" : "outline"}
          onClick={() => handleAction(a)}
        >
          <a.icon className="size-3.5 mr-1" />
          {a.label}
        </Button>
      ))}
    </div>
  );
}
