import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Layers, Plus, Search, Edit2, Trash2, Loader2, Calendar, Filter } from "lucide-react";
import { useSession } from "@/lib/session";
import { sprintService, projectService } from "@/services/api-services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { fmtDate } from "@/lib/format";
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

export const Route = createFileRoute("/sprints")({
  head: () => ({
    meta: [
      { title: "Sprints · NeuroForge Nexus" },
      { name: "description", content: "Sprint planning and velocity tracking." },
    ],
  }),
  component: SprintsPage,
});

const SPRINT_STATUSES = ["PLANNED", "ACTIVE", "COMPLETED", "CANCELLED"];

function SprintsPage() {
  const { user: currentUser } = useSession();
  const [sprints, setSprints] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ACTIVE");
  const [projectFilter, setProjectFilter] = useState("ALL");

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSprint, setEditingSprint] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [projectId, setProjectId] = useState("");
  const [status, setStatus] = useState("PLANNED");

  const canEdit = currentUser.role === "admin" || currentUser.role === "pm";

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sprintsRes, projRes] = await Promise.all([
        sprintService.search({
          search: search || undefined,
          status: statusFilter !== "ALL" ? statusFilter : undefined,
          projectId: projectFilter !== "ALL" ? projectFilter : undefined,
          size: 100,
        }),
        projectService.search({ size: 100 }),
      ]);
      setSprints(sprintsRes.content || []);
      setProjects(projRes.content || []);
    } catch (err) {
      toast.error(err.message || "Failed to load sprints data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, statusFilter, projectFilter]);

  const handleOpenCreate = () => {
    setEditingSprint(null);
    setName("");
    setGoal("");
    setStartDate(new Date().toISOString().split("T")[0]);
    setEndDate(new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0]);
    setProjectId(projects[0]?.id || "");
    setStatus("PLANNED");
    setDialogOpen(true);
  };

  const handleOpenEdit = (s) => {
    setEditingSprint(s);
    setName(s.name);
    setGoal(s.goal || "");
    setStartDate(s.startDate ? s.startDate.split("T")[0] : "");
    setEndDate(s.endDate ? s.endDate.split("T")[0] : "");
    setProjectId(s.projectId || "");
    setStatus(s.status || "PLANNED");
    setDialogOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const payload = {
        name,
        goal,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        projectId,
        status,
      };

      if (editingSprint) {
        await sprintService.update(editingSprint.id, payload);
        toast.success("Sprint updated successfully");
      } else {
        await sprintService.create(payload);
        toast.success("Sprint created successfully");
      }
      setDialogOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.message || "Failed to save sprint");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (sprintId) => {
    if (!window.confirm("Are you sure you want to delete this sprint?")) return;
    try {
      await sprintService.delete(sprintId);
      toast.success("Sprint deleted successfully");
      fetchData();
    } catch (err) {
      toast.error(err.message || "Failed to delete sprint");
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto space-y-6">
      <header className="flex items-end justify-between gap-4 pb-6 border-b hairline">
        <div>
          <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            Planning
          </div>
          <h1 className="font-display text-3xl mt-1 flex items-center gap-2">
            <Layers className="size-6 text-primary" /> Sprints
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Plan milestones, sprints, capacity and delivery timelines.
          </p>
        </div>
        {canEdit && (
          <Button size="sm" onClick={handleOpenCreate}>
            <Plus className="size-3.5 mr-1" /> New sprint
          </Button>
        )}
      </header>

      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Search sprints by name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 text-xs"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36 h-9 text-xs bg-background">
            <Filter className="size-3 mr-1 text-muted-foreground" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            {SPRINT_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={projectFilter} onValueChange={setProjectFilter}>
          <SelectTrigger className="w-44 h-9 text-xs bg-background">
            <SelectValue placeholder="Project" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All projects</SelectItem>
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Sprints listing */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-muted-foreground text-xs gap-2">
          <Loader2 className="size-6 animate-spin text-primary" />
          Loading sprints...
        </div>
      ) : sprints.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground text-sm">No sprints found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sprints.map((s) => {
            const project = projects.find((p) => p.id === s.projectId);
            const projectName = project ? project.name : s.projectCode || "Unknown Project";

            return (
              <div
                key={s.id}
                className="rounded-xl border hairline bg-card p-5 flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-display text-lg font-muted">{s.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                        {projectName}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        s.status === "ACTIVE"
                          ? "bg-success/10 text-success"
                          : s.status === "COMPLETED"
                            ? "bg-muted text-muted-foreground"
                            : s.status === "CANCELLED"
                              ? "bg-destructive/10 text-destructive"
                              : "bg-primary-soft text-primary"
                      }`}
                    >
                      {s.status}
                    </span>
                  </div>

                  <p className="text-xs text-foreground mt-2 font-medium">
                    Goal: {s.goal || "No specific goal defined."}
                  </p>

                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="size-3.5" />
                      <span>Starts: {fmtDate(s.startDate)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="size-3.5" />
                      <span>Ends: {fmtDate(s.endDate)}</span>
                    </div>
                  </div>
                </div>

                {canEdit && (
                  <div className="pt-3 border-t hairline flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8"
                      onClick={() => handleOpenEdit(s)}
                    >
                      <Edit2 className="size-3.5 mr-1" /> Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => handleDelete(s.id)}
                    >
                      <Trash2 className="size-3.5 mr-1" /> Delete
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Edit/Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md bg-card border hairline">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {editingSprint ? "Edit Sprint" : "New Sprint"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Sprint name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={formLoading}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="goal">Goal</Label>
              <Input
                id="goal"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
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
                  required
                  disabled={formLoading}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="project">Project</Label>
                <Select value={projectId} onValueChange={setProjectId} disabled={formLoading}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
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
                    {SPRINT_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
