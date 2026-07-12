import { createFileRoute, Link, notFound, useRouter, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, GitBranch, Users, Calendar, Layers, Edit2, Trash2, Loader2 } from "lucide-react";
import { fmtDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { projectService, teamService, userService, sprintService, milestoneService } from "@/services/api-services";
import { mapBackendProjectToFrontend } from "@/components/dashboard/active-projects-table";
import { useSession } from "@/lib/session";
import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

const PROJECT_STATUSES = ["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"];

export const Route = createFileRoute("/projects/$projectId")({
  loader: async ({ params }) => {
    try {
      const [p, sprintsRes, milestonesRes, usersRes, teamsRes] = await Promise.all([
        projectService.getById(params.projectId),
        sprintService.search({ projectId: params.projectId, size: 100 }).catch(() => ({ content: [] })),
        milestoneService.search({ projectId: params.projectId, size: 100 }).catch(() => ({ content: [] })),
        userService.search({ size: 100 }).catch(() => ({ content: [] })),
        teamService.search({ size: 100 }).catch(() => ({ content: [] })),
      ]);

      const project = mapBackendProjectToFrontend(p);
      if (!project) throw notFound();

      return {
        rawProject: p,
        project,
        sprints: sprintsRes?.content || [],
        milestones: milestonesRes?.content || [],
        users: usersRes?.content || [],
        teams: teamsRes?.content || [],
      };
    } catch (err) {
      console.error("Failed to load project details:", err);
      throw notFound();
    }
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.project?.name ?? "Project"} · NeuroForge Nexus` },
      {
        name: "description",
        content: `Details, sprints, releases and team for ${loaderData?.project?.name}.`,
      },
    ],
  }),
  component: ProjectDetail,
  notFoundComponent: () => (
    <div className="p-10 text-center text-sm text-muted-foreground">Project not found.</div>
  ),
});

function ProjectDetail() {
  const { rawProject, project, sprints, milestones, users, teams } = Route.useLoaderData();
  const { user: currentUser } = useSession();
  const navigate = useNavigate();
  const router = useRouter();

  // Dialogue & Form states
  const [editOpen, setEditOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [projectManagerId, setProjectManagerId] = useState("");
  const [selectedTeams, setSelectedTeams] = useState([]);
  const [status, setStatus] = useState("ACTIVE");

  const canEdit = currentUser?.role === "admin";

  // Resolve assigned teams
  const projectTeamIds = rawProject.teamIds ? Array.from(rawProject.teamIds) : [];
  const assignedTeams = teams.filter((t) => projectTeamIds.includes(t.id));

  // Collect unique user IDs assigned to this project (from team member list, team leader, and project manager)
  const assignedUserIds = new Set();
  assignedTeams.forEach((t) => {
    if (t.memberIds) {
      t.memberIds.forEach((id) => assignedUserIds.add(id));
    }
    if (t.teamLeaderId) {
      assignedUserIds.add(t.teamLeaderId);
    }
  });
  if (rawProject.projectManagerId) {
    assignedUserIds.add(rawProject.projectManagerId);
  }

  // Map user IDs to user objects
  const assignedUsers = Array.from(assignedUserIds)
    .map((uid) => {
      const u = users.find((user) => user.id === uid);
      if (u) {
        return {
          id: uid,
          name: `${u.firstName} ${u.lastName}`,
          email: u.email,
          role: u.role,
          isPm: uid === rawProject.projectManagerId,
          isLeader: assignedTeams.some((t) => t.teamLeaderId === uid),
        };
      }
      // Fallback formatting from emails if user list is empty/unaccessible (e.g. Developer role 403)
      const teamLead = assignedTeams.find((t) => t.teamLeaderId === uid);
      if (teamLead && teamLead.teamLeaderEmail) {
        const derivedName = teamLead.teamLeaderEmail
          .split("@")[0]
          .split(".")
          .map((n) => n.charAt(0).toUpperCase() + n.slice(1))
          .join(" ");
        return {
          id: uid,
          name: derivedName,
          email: teamLead.teamLeaderEmail,
          role: "DEVELOPER",
          isPm: uid === rawProject.projectManagerId,
          isLeader: true,
        };
      }
      return null;
    })
    .filter(Boolean);

  const getDisplayRole = (u) => {
    if (u.isPm) return "Project Manager";
    if (u.isLeader) return "Team Leader";
    if (!u.role) return "Engineer";
    switch (u.role.toUpperCase()) {
      case "ADMIN":
        return "Administrator";
      case "PROJECT_MANAGER":
        return "Project Manager";
      case "DEVELOPER":
        return "Software Engineer";
      case "TESTER":
        return "Tester";
      case "DEVOPS_ENGINEER":
        return "DevOps Engineer";
      default:
        return "Engineer";
    }
  };

  const handleOpenEdit = () => {
    setName(rawProject.name || "");
    setCode(rawProject.code || "");
    setDescription(rawProject.description || "");
    setStartDate(rawProject.startDate ? rawProject.startDate.split("T")[0] : "");
    setEndDate(rawProject.endDate ? rawProject.endDate.split("T")[0] : "");
    setProjectManagerId(rawProject.projectManagerId || "");
    setSelectedTeams(rawProject.teamIds ? Array.from(rawProject.teamIds) : []);
    setStatus(rawProject.status || "ACTIVE");
    setEditOpen(true);
  };

  const handleToggleTeam = (teamId) => {
    setSelectedTeams((prev) =>
      prev.includes(teamId) ? prev.filter((id) => id !== teamId) : [...prev, teamId]
    );
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const payload = {
        name,
        code,
        description,
        startDate: startDate ? new Date(startDate).toISOString() : null,
        endDate: endDate ? new Date(endDate).toISOString() : null,
        projectManagerId: projectManagerId || null,
        teamIds: selectedTeams,
        status,
      };
      await projectService.update(rawProject.id, payload);
      toast.success("Project updated successfully");
      setEditOpen(false);
      router.invalidate();
    } catch (err) {
      toast.error(err.message || "Failed to update project");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this project? This will permanently remove it.")) return;
    try {
      await projectService.delete(rawProject.id);
      toast.success("Project deleted successfully");
      navigate({ to: "/projects" });
    } catch (err) {
      toast.error(err.message || "Failed to delete project");
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto">
      <Link
        to="/projects"
        className="inline-flex items-center gap-1 text-[12px] text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-3.5" /> All projects
      </Link>

      <header className="mt-3 flex flex-wrap items-end justify-between gap-4 pb-6 border-b hairline">
        <div className="flex items-start gap-4">
          <div className="grid size-14 place-items-center rounded-xl bg-primary-soft text-primary text-lg font-semibold">
            {project.key ? project.key.charAt(0) : ""}
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              Project · {project.key}
            </div>
            <h1 className="font-display text-3xl mt-1">{project.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground tnum">
              PM {project.pm} · Sprint {project.sprint} · Release v{project.release}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canEdit && (
            <>
              <Button variant="outline" size="sm" onClick={handleOpenEdit}>
                <Edit2 className="size-3.5 mr-1" /> Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={handleDelete}
              >
                <Trash2 className="size-3.5 mr-1" /> Delete
              </Button>
            </>
          )}
          <Link to="/sprints" search={{ projectId: rawProject.id }}>
            <Button size="sm">Open sprint board</Button>
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
        <Stat icon={Users} label="Members" value={String(assignedUsers.length || project.members)} />
        <Stat icon={Layers} label="Open tasks" value={String(project.tasks)} />
        <Stat icon={GitBranch} label="Release" value={`v${project.release}`} mono />
        <Stat icon={Calendar} label="Due" value={fmtDate(project.due)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
        <div className="lg:col-span-2 space-y-4">
          {/* Progress Card */}
          <div className="rounded-xl border hairline bg-card p-6">
            <h2 className="text-sm font-semibold">Progress</h2>
            <div className="mt-4">
              <div className="flex justify-between text-[11px] text-muted-foreground mb-1.5">
                <span>Sprint {project.sprint}</span>
                <span className="tnum">{project.progress}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn("h-full rounded-full", {
                    "bg-success": project.health === "healthy",
                    "bg-warning": project.health === "at_risk",
                    "bg-destructive": project.health === "blocked",
                  })}
                  style={{ width: `${project.progress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Sprints Card */}
          <div className="rounded-xl border hairline bg-card p-6">
            <h2 className="text-sm font-semibold flex items-center justify-between">
              <span>Sprints</span>
              <span className="text-[11px] font-normal text-muted-foreground">{sprints.length} total</span>
            </h2>
            {sprints.length === 0 ? (
              <div className="mt-4 py-8 text-center text-xs text-muted-foreground border border-dashed rounded-lg hairline">
                No sprints planned for this project.
              </div>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b hairline text-muted-foreground">
                      <th className="pb-2 font-medium">Sprint</th>
                      <th className="pb-2 font-medium">Goal</th>
                      <th className="pb-2 font-medium">Dates</th>
                      <th className="pb-2 font-medium text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border hairline">
                    {sprints.map((s) => (
                      <tr key={s.id} className="hover:bg-muted/30">
                        <td className="py-2.5 font-medium">{s.name}</td>
                        <td className="py-2.5 text-muted-foreground max-w-[200px] truncate" title={s.goal}>
                          {s.goal || "—"}
                        </td>
                        <td className="py-2.5 text-muted-foreground whitespace-nowrap">
                          {fmtDate(s.startDate)} - {fmtDate(s.endDate)}
                        </td>
                        <td className="py-2.5 text-right">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
                              s.status === "ACTIVE"
                                ? "bg-success/10 text-success"
                                : s.status === "COMPLETED"
                                  ? "bg-muted text-muted-foreground"
                                  : s.status === "CANCELLED"
                                    ? "bg-destructive/10 text-destructive"
                                    : "bg-primary-soft text-primary"
                            )}
                          >
                            {s.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Milestones Card */}
          <div className="rounded-xl border hairline bg-card p-6">
            <h2 className="text-sm font-semibold flex items-center justify-between">
              <span>Milestones</span>
              <span className="text-[11px] font-normal text-muted-foreground">{milestones.length} total</span>
            </h2>
            {milestones.length === 0 ? (
              <div className="mt-4 py-8 text-center text-xs text-muted-foreground border border-dashed rounded-lg hairline">
                No milestones defined for this project.
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {milestones.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-start justify-between p-3 rounded-lg border hairline bg-background hover:border-primary/20 transition-colors"
                  >
                    <div>
                      <h3 className="text-xs font-semibold">{m.name}</h3>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{m.description || "No description."}</p>
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-2">
                        <Calendar className="size-3" /> Due {fmtDate(m.dueDate)}
                      </div>
                    </div>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium",
                        m.status === "COMPLETED"
                          ? "bg-success/10 text-success"
                          : m.status === "IN_PROGRESS"
                            ? "bg-primary-soft text-primary"
                            : m.status === "ON_HOLD"
                              ? "bg-warning/10 text-warning"
                              : m.status === "CANCELLED"
                                ? "bg-destructive/10 text-destructive"
                                : "bg-muted text-muted-foreground"
                      )}
                    >
                      {(m.status || "PLANNED").replace("_", " ")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Team list card */}
        <div className="rounded-xl border hairline bg-card p-6 self-start">
          <h2 className="text-sm font-semibold">Team</h2>
          <div className="mt-4 space-y-2.5">
            {assignedUsers.length === 0 ? (
              <div className="text-xs text-muted-foreground text-center py-4">No assigned team members.</div>
            ) : (
              assignedUsers.map((u) => (
                <div key={u.id} className="flex items-center gap-2.5">
                  <div className="grid size-7 place-items-center rounded-full bg-foreground text-background text-[10px] font-semibold">
                    {u.name
                      .split(" ")
                      .map((p) => p[0])
                      .slice(0, 2)
                      .join("")}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm truncate font-medium">{u.name}</div>
                    <div className="text-[11px] text-muted-foreground">{getDisplayRole(u)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md bg-card border hairline">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Edit Project</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="name">Project Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={formLoading}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="code">Code (Key)</Label>
                <Input
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  required
                  disabled={formLoading}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={formLoading}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  disabled={formLoading}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  disabled={formLoading}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="projectManager">Project Manager</Label>
                <Select value={projectManagerId} onValueChange={setProjectManagerId} disabled={formLoading}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select PM" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.firstName} {u.lastName} ({u.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={setStatus} disabled={formLoading}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROJECT_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Teams Checklist */}
            <div className="space-y-2">
              <Label>Assigned Teams</Label>
              <div className="border hairline rounded-lg p-3 max-h-[140px] overflow-y-auto space-y-2 bg-background">
                {teams.map((t) => (
                  <div key={t.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`chk-t-${t.id}`}
                      checked={selectedTeams.includes(t.id)}
                      onCheckedChange={() => handleToggleTeam(t.id)}
                      disabled={formLoading}
                    />
                    <label htmlFor={`chk-t-${t.id}`} className="text-xs cursor-pointer select-none">
                      {t.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter className="pt-4 border-t hairline mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditOpen(false)}
                disabled={formLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={formLoading}>
                {formLoading ? (
                  <>
                    Saving <Loader2 className="size-3.5 animate-spin ml-2" />
                  </>
                ) : (
                  "Save changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Stat({ icon: Icon, label, value, mono }) {
  return (
    <div className="rounded-xl border hairline bg-card p-4">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
        <Icon className="size-3.5" /> {label}
      </div>
      <div className={cn("mt-2 text-xl", mono ? "font-mono" : "font-display")}>{value}</div>
    </div>
  );
}
