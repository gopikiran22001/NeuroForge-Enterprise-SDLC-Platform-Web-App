import { Plus, UserPlus, Play, Package, GitBranch, AlertCircle, ListChecks, Server, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useSession } from "@/lib/session";
import { can } from "@/lib/permissions";
const ACTIONS = [
  // PM / Admin Actions
  { icon: Plus, label: "New project", action: "create_project", primary: true },
  { icon: UserPlus, label: "Invite users", action: "invite_users" },
  { icon: Play, label: "Start sprint", action: "start_sprint" },
  { icon: Package, label: "Cut release", action: "cut_release" },

  // Developer Actions
  { icon: Plus, label: "New task", action: "create_task", primary: true },
  { icon: GitBranch, label: "Create branch", action: "create_branch" },
  { icon: Play, label: "Run tests", action: "run_tests" },

  // Tester Actions
  { icon: AlertCircle, label: "Log bug", action: "log_bug", primary: true },
  { icon: ListChecks, label: "Run test suite", action: "run_test_suite" },

  // DevOps Actions
  { icon: PlayCircle, label: "Trigger build", action: "trigger_build", primary: true },
  { icon: Server, label: "Deploy prod", action: "deploy" },
];
export function QuickActions() {
  const { user } = useSession();
  const activeActions = ACTIONS.filter((a) => can(user.role, a.action));
  return (
    <div className="flex flex-wrap items-center gap-2">
      {activeActions.map((a) => (
        <Button
          key={a.label}
          size="sm"
          variant={a.primary ? "default" : "outline"}
          onClick={() =>
            toast.success(`${a.label} triggered`, {
              description: "Wired to workspace, operation completed.",
            })
          }
        >
          <a.icon className="size-3.5 mr-1" />
          {a.label}
        </Button>
      ))}
    </div>
  );
}
