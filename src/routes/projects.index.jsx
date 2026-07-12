import { createFileRoute, Link } from "@tanstack/react-router";
import { FolderKanban, Plus, Search, Loader2, Edit2, Trash2, Filter } from "lucide-react";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { fmtDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { projectService, userService, teamService } from "@/services/api-services";
import { mapBackendProjectToFrontend } from "@/components/dashboard/active-projects-table";
import { useSession } from "@/lib/session";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const PROJECT_STATUSES = ["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"];

export const Route = createFileRoute("/projects/")({
  head: () => ({
    meta: [
      { title: "Projects · NeuroForge Nexus" },
      {
        name: "description",
        content: "Every project in the workspace with owner, sprint and health.",
      },
    ],
  }),
  component: ProjectList,
});

function ProjectList() {
  const { user: currentUser } = useSession();
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [projectManagerId, setProjectManagerId] = useState("");
  const [selectedTeams, setSelectedTeams] = useState([]);
  const [status, setStatus] = useState("ACTIVE");
  const [teamSearch, setTeamSearch] = useState("");

  const canEdit = currentUser.role === "admin";

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const [projRes, usersRes, teamsRes] = await Promise.all([
        projectService.search({
          search: q || undefined,
          status: statusFilter !== "ALL" ? statusFilter : undefined,
          size: 100,
        }),
        userService.search({ role: "PROJECT_MANAGER", size: 100 }),
        teamService.search({ size: 100 }),
      ]);
      const mapped = (projRes.content || []).map(mapBackendProjectToFrontend);
      setProjects(mapped);
      setUsers((usersRes.content || []).filter((u) => u.role === "PROJECT_MANAGER"));
      setTeams(teamsRes.content || []);
    } catch (err) {
      console.error("Failed to fetch projects data:", err);
      toast.error("Failed to load projects data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [q, statusFilter]);

  const handleOpenCreate = () => {
    setEditingProject(null);
    setName("");
    setCode("");
    setDescription("");
    setStartDate(new Date().toISOString().split("T")[0]);
    setProjectManagerId(currentUser.id || users[0]?.id || "");
    setSelectedTeams([]);
    setStatus("ACTIVE");
    setTeamSearch("");
    setDialogOpen(true);
  };

  const handleOpenEdit = (p, original) => {
    setEditingProject(p);
    setName(p.name);
    setCode(p.key);
    setDescription(original.description || "");
    setStartDate(original.startDate ? original.startDate.split("T")[0] : "");
    setProjectManagerId(original.projectManagerId || "");
    setSelectedTeams(Array.from(original.teamIds || []));
    setStatus(original.status || "ACTIVE");
    setTeamSearch("");
    setDialogOpen(true);
  };

  const handleToggleTeam = (teamId) => {
    setSelectedTeams((prev) =>
      prev.includes(teamId) ? prev.filter((id) => id !== teamId) : [...prev, teamId],
    );
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (selectedTeams.length === 0) {
      toast.error("At least one team must be assigned to the project.");
      return;
    }
    setFormLoading(true);
    try {
      const payload = {
        name,
        code,
        description,
        startDate: new Date(startDate).toISOString(),
        endDate: null,
        projectManagerId,
        teamIds: selectedTeams,
        status,
      };

      if (editingProject) {
        await projectService.update(editingProject.id, payload);
        toast.success("Project updated successfully");
      } else {
        await projectService.create(payload);
        toast.success("Project created successfully");
      }
      setDialogOpen(false);
      fetchProjects();
    } catch (err) {
      toast.error(err.message || "Failed to save project");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (projectId) => {
    if (!window.confirm("Are you sure you want to delete this project?")) return;
    try {
      await projectService.delete(projectId);
      toast.success("Project deleted successfully");
      fetchProjects();
    } catch (err) {
      toast.error(err.message || "Failed to delete project");
    }
  };

  const filtered = projects;

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto">
      <header className="flex items-end justify-between gap-4 pb-6 border-b hairline">
        <div>
          <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            Delivery
          </div>
          <h1 className="font-display text-3xl mt-1 flex items-center gap-2">
            <FolderKanban className="size-6 text-primary" /> Projects
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {filtered.length} projects · {filtered.reduce((sum, p) => sum + p.members, 0)} members ·{" "}
            {filtered.reduce((sum, p) => sum + p.tasks, 0)} open tasks
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              placeholder="Search projects"
              className="h-9 pl-7 w-64 text-xs"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36 h-9 text-xs bg-background">
              <Filter className="size-3 mr-1 text-muted-foreground" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All statuses</SelectItem>
              {PROJECT_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {canEdit && (
            <Button size="sm" onClick={handleOpenCreate}>
              <Plus className="size-3.5 mr-1" /> New project
            </Button>
          )}
        </div>
      </header>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-muted-foreground text-xs gap-2">
          <Loader2 className="size-6 animate-spin text-primary" />
          Loading projects...
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground text-sm">No projects found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mt-6">
          {filtered.map((p) => (
            <div
              key={p.id}
              className="group rounded-xl border hairline bg-card p-4 hover:border-primary/30 transition-colors flex flex-col justify-between"
            >
              <Link
                to="/projects/$projectId"
                params={{ projectId: p.id }}
                className="flex-1"
              >
                <div className="flex items-start gap-3">
                  <div className="grid size-10 place-items-center rounded-md bg-primary-soft text-primary text-[12px] font-semibold shrink-0">
                    {p.key ? p.key.charAt(0) : ""}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate group-hover:text-primary transition-colors">
                      {p.name}
                    </div>
                    <div className="text-[11px] text-muted-foreground tnum">
                      PM {p.pm} · Sprint {p.sprint}
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex justify-between text-[11px] text-muted-foreground mb-1.5">
                    <span>Progress</span>
                    <span className="tnum">{p.progress}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn("h-full", {
                        "bg-success": p.health === "healthy",
                        "bg-warning": p.health === "at_risk",
                        "bg-destructive": p.health === "blocked",
                      })}
                      style={{ width: `${p.progress}%` }}
                    />
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="font-mono">v{p.release}</span>
                  <span className="tnum">Due {fmtDate(p.due, "d MMM")}</span>
                </div>
              </Link>

              {canEdit && (
                <div className="mt-4 pt-3 border-t hairline flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-[10px]"
                    onClick={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      try {
                        const original = await projectService.getById(p.id);
                        handleOpenEdit(p, original);
                      } catch (err) {
                        toast.error("Failed to load project details for editing");
                      }
                    }}
                  >
                    <Edit2 className="size-3 mr-1" /> Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-[10px] text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDelete(p.id);
                    }}
                  >
                    <Trash2 className="size-3 mr-1" /> Delete
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Edit/Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md bg-card border hairline">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {editingProject ? "Edit Project" : "New Project"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="name">Project name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={formLoading}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="code">Code / Key</Label>
                <Input
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  required
                  placeholder="e.g. NF"
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
                    <SelectItem value="PLANNING">PLANNING</SelectItem>
                    <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                    <SelectItem value="ON_HOLD">ON_HOLD</SelectItem>
                    <SelectItem value="COMPLETED">COMPLETED</SelectItem>
                    <SelectItem value="CANCELLED">CANCELLED</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Teams Checklist */}
            <div className="space-y-2">
              <Label>Assigned Teams</Label>
              <Input
                placeholder="Filter teams..."
                value={teamSearch}
                onChange={(e) => setTeamSearch(e.target.value)}
                className="h-8 text-xs mb-2"
                disabled={formLoading}
              />
              <div className="border hairline rounded-lg p-3 max-h-[140px] overflow-y-auto space-y-2 bg-background [&::-webkit-scrollbar]:hidden [scrollbar-width:none] [-ms-overflow-style:none]">
                {teams
                  .filter((t) => t.name.toLowerCase().includes(teamSearch.toLowerCase()))
                  .map((t) => (
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
                onClick={() => setDialogOpen(false)}
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
