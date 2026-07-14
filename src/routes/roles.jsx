import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShieldCheck, ShieldAlert, Loader2, Info } from "lucide-react";
import { useSession, mapBackendRoleToFrontend, mapFrontendRoleToBackend } from "@/lib/session";
import { ROLE_LABEL } from "@/lib/permissions";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/roles")({
  head: () => ({
    meta: [
      { title: "Roles · NeuroForge Nexus" },
      { name: "description", content: "Role assignments and platform permissions." },
    ],
  }),
  component: RolesPage,
});

const PERMISSION_EXPLANATIONS = [
  { name: "manage_users", desc: "Create, update status, and remove user accounts" },
  { name: "manage_roles", desc: "Modify system roles and assign them to members" },
  { name: "create_project", desc: "Scaffold new products, epics and repositories" },
  { name: "invite_users", desc: "Invite external members into the workspace" },
  { name: "start_sprint", desc: "Kickoff sprints, modify capacity and planning boards" },
  { name: "cut_release", desc: "Bundle code milestones and trigger release pipelines" },
  { name: "deploy", desc: "Promote release builds to staging and production environments" },
  { name: "run_tests", desc: "Execute automated integration and regression test suites" },
  { name: "view_audit", desc: "Audit workspace actions, logins, and settings changes" },
  { name: "view_billing", desc: "View plan settings, invoices, and payment details" },
];

function RolesPage() {
  const { user: currentUser } = useSession();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const canView = currentUser?.role === "admin" || currentUser?.role === "pm";
  const isAdmin = currentUser?.role === "admin";

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/users?page=0&size=100");
      setUsers(res.content || []);
    } catch (err) {
      toast.error(err.message || "Failed to load users for role management");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canView) {
      fetchUsers();
    }
  }, []);

  const handleRoleChange = async (userId, userObj, newRole) => {
    setUpdatingId(userId);
    try {
      const payload = {
        firstName: userObj.firstName,
        lastName: userObj.lastName,
        email: userObj.email,
        role: mapFrontendRoleToBackend(newRole),
        status: userObj.status || "ACTIVE",
      };

      await api.put(`/api/users?id=${userId}`, payload);
      toast.success("User role updated successfully");
      fetchUsers();
    } catch (err) {
      toast.error(err.message || "Failed to update role");
    } finally {
      setUpdatingId(null);
    }
  };

  if (!canView) {
    return (
      <div className="p-8 max-w-md mx-auto text-center space-y-4 mt-20">
        <div className="size-12 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
          <ShieldAlert className="size-6" />
        </div>
        <h1 className="font-display text-2xl">Access Denied</h1>
        <p className="text-sm text-muted-foreground">
          You do not have the required permissions to view workspace role configuration.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto space-y-8">
      <header className="flex items-end justify-between gap-4 pb-6 border-b hairline">
        <div>
          <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            Security
          </div>
          <h1 className="font-display text-3xl mt-1 flex items-center gap-2">
            <ShieldCheck className="size-6 text-primary" /> Role Management
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure system roles, access policies, and permission mapping.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
        {/* User assignments */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold">User Role Assignment</h2>
          <div className="rounded-xl border hairline bg-card overflow-hidden">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center text-muted-foreground text-xs gap-2">
                <Loader2 className="size-6 animate-spin text-primary" />
                Loading members...
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground border-b hairline">
                      <th className="py-2.5 pl-4 pr-3 font-medium">User</th>
                      <th className="py-2.5 px-3 font-medium">Email</th>
                      <th className="py-2.5 pr-4 pl-3 font-medium">Assigned Role</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-hairline)]">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-accent/40 transition-colors">
                        <td className="py-3 pl-4 pr-3">
                          <div className="font-medium text-foreground">
                            {u.firstName} {u.lastName}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-muted-foreground">{u.email}</td>
                        <td className="py-3 pr-4 pl-3">
                          {isAdmin && u.id !== currentUser?.id ? (
                            <div className="flex items-center gap-2">
                              <Select
                                value={mapBackendRoleToFrontend(u.role)}
                                onValueChange={(val) => handleRoleChange(u.id, u, val)}
                                disabled={updatingId === u.id}
                              >
                                <SelectTrigger className="w-44 h-8 text-[12px] bg-background">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {Object.entries(ROLE_LABEL)
                                    .filter(([val]) => currentUser?.role === "super_admin" || val !== "super_admin")
                                    .map(([val, label]) => (
                                      <SelectItem key={val} value={val} className="text-[12px]">
                                        {label}
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                              {updatingId === u.id && (
                                <Loader2 className="size-3.5 animate-spin text-primary" />
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center rounded-md border hairline px-2 py-0.5 text-[11px] font-medium bg-muted/30">
                              {ROLE_LABEL[mapBackendRoleToFrontend(u.role)] || u.role}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Permission matrix info */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold flex items-center gap-1.5">
            <Info className="size-4 text-muted-foreground" /> Permission Overview
          </h2>
          <div className="rounded-xl border hairline bg-card p-4 space-y-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Permissions are structured logically under static roles. Admins possess full workspace
              control, while Project Managers govern sprints, projects, and releases.
            </p>
            <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1">
              {PERMISSION_EXPLANATIONS.map((p) => (
                <div
                  key={p.name}
                  className="text-[12px] border-b hairline pb-2 last:border-b-0 last:pb-0"
                >
                  <div className="font-mono font-semibold text-primary">{p.name}</div>
                  <div className="text-muted-foreground mt-0.5">{p.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
