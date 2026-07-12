import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Flag, Plus, Search, Edit2, Trash2, Loader2, Calendar, Filter } from "lucide-react";
import { useSession } from "@/lib/session";
import { milestoneService, projectService } from "@/services/api-services";
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

export const Route = createFileRoute("/milestones")({
  head: () => ({
    meta: [
      { title: "Milestones · NeuroForge Nexus" },
      {
        name: "description",
        content: "Key delivery milestones across the SDLC portfolio.",
      },
    ],
  }),
  component: MilestonesPage,
});

const MILESTONE_STATUSES = ["PLANNED", "IN_PROGRESS", "ON_HOLD", "COMPLETED", "CANCELLED"];

function MilestonesPage() {
  const { user: currentUser } = useSession();
  const [milestones, setMilestones] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("IN_PROGRESS");
  const [projectFilter, setProjectFilter] = useState("ALL");

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [projectId, setProjectId] = useState("");
  const [status, setStatus] = useState("PLANNED");

  const canEdit = currentUser.role === "admin" || currentUser.role === "pm";

  const fetchData = async () => {
    setLoading(true);
    try {
      const [msRes, projRes] = await Promise.all([
        milestoneService.search({
          search: search || undefined,
          status: statusFilter !== "ALL" ? statusFilter : undefined,
          projectId: projectFilter !== "ALL" ? projectFilter : undefined,
          size: 100,
        }),
        projectService.search({ size: 100 }),
      ]);
      setMilestones(msRes.content || []);
      setProjects(projRes.content || []);
    } catch (err) {
      toast.error(err.message || "Failed to load milestones data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, statusFilter, projectFilter]);

  const handleOpenCreate = () => {
    setEditingMilestone(null);
    setName("");
    setDescription("");
    setDueDate(new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0]);
    setProjectId(projects[0]?.id || "");
    setStatus("PLANNED");
    setDialogOpen(true);
  };

  const handleOpenEdit = (m) => {
    setEditingMilestone(m);
    setName(m.name);
    setDescription(m.description || "");
    setDueDate(m.dueDate ? m.dueDate.split("T")[0] : "");
    setProjectId(m.projectId || "");
    setStatus(m.status || "PLANNED");
    setDialogOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const payload = {
        name,
        description,
        dueDate: new Date(dueDate).toISOString(),
        projectId,
        status,
      };

      if (editingMilestone) {
        await milestoneService.update(editingMilestone.id, payload);
        toast.success("Milestone updated successfully");
      } else {
        await milestoneService.create(payload);
        toast.success("Milestone created successfully");
      }
      setDialogOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.message || "Failed to save milestone");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (milestoneId) => {
    if (!window.confirm("Are you sure you want to delete this milestone?")) return;
    try {
      await milestoneService.delete(milestoneId);
      toast.success("Milestone deleted successfully");
      fetchData();
    } catch (err) {
      toast.error(err.message || "Failed to delete milestone");
    }
  };

  const statusStyle = (st) => {
    switch (st) {
      case "COMPLETED": return "bg-success/10 text-success";
      case "IN_PROGRESS": return "bg-primary-soft text-primary";
      case "ON_HOLD": return "bg-warning/10 text-warning";
      case "CANCELLED": return "bg-destructive/10 text-destructive";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto space-y-6">
      <header className="flex items-end justify-between gap-4 pb-6 border-b hairline">
        <div>
          <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            Delivery
          </div>
          <h1 className="font-display text-3xl mt-1 flex items-center gap-2">
            <Flag className="size-6 text-primary" /> Milestones
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Key delivery milestones across the SDLC portfolio.
          </p>
        </div>
        {canEdit && (
          <Button size="sm" onClick={handleOpenCreate}>
            <Plus className="size-3.5 mr-1" /> New milestone
          </Button>
        )}
      </header>

      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Search milestones by name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 text-xs"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 h-9 text-xs bg-background">
            <Filter className="size-3 mr-1 text-muted-foreground" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            {MILESTONE_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>
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

      {/* Milestones listing */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-muted-foreground text-xs gap-2">
          <Loader2 className="size-6 animate-spin text-primary" />
          Loading milestones...
        </div>
      ) : milestones.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground text-sm">
          No milestones found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {milestones.map((m) => {
            const project = projects.find((p) => p.id === m.projectId);
            const projectName = project ? project.name : m.projectCode || "Unknown Project";

            return (
              <div
                key={m.id}
                className="rounded-xl border hairline bg-card p-5 flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-display text-lg font-muted">{m.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                        {projectName}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium whitespace-nowrap ${statusStyle(m.status)}`}
                    >
                      {(m.status || "PLANNED").replace("_", " ")}
                    </span>
                  </div>
                  {m.description && (
                    <p className="text-xs text-muted-foreground mt-3 leading-relaxed line-clamp-2">
                      {m.description}
                    </p>
                  )}
                  <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="size-3.5" />
                    <span>Due: {fmtDate(m.dueDate)}</span>
                  </div>
                </div>

                {canEdit && (
                  <div className="pt-3 border-t hairline flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8"
                      onClick={() => handleOpenEdit(m)}
                    >
                      <Edit2 className="size-3.5 mr-1" /> Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => handleDelete(m.id)}
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
              {editingMilestone ? "Edit Milestone" : "New Milestone"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Milestone name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={formLoading}
              />
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
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                  disabled={formLoading}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={setStatus} disabled={formLoading}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {MILESTONE_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

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
