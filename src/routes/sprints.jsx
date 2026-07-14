import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Layers, Plus, Search, Edit2, Trash2, Loader2, Calendar, Filter, Eye } from "lucide-react";
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
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

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
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [stats, setStats] = useState({ total: 0, active: 0, planned: 0, completed: 0 });

  // Dialog & Drawer state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSprint, setEditingSprint] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [viewSprint, setViewSprint] = useState(null);

  // Delete state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [sprintToDelete, setSprintToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [projectId, setProjectId] = useState("");
  const [status, setStatus] = useState("PLANNED");

  const canEdit = currentUser?.role === "admin" || currentUser?.role === "pm";

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sprintsRes, projRes] = await Promise.all([
        sprintService.search({
          search: search || undefined,
          status: statusFilter !== "ALL" ? statusFilter : undefined,
          projectId: projectFilter !== "ALL" ? projectFilter : undefined,
          page,
          size: 10,
        }),
        projectService.search({ size: 100 }),
      ]);
      setSprints(sprintsRes.content || []);
      setProjects(projRes.content || []);
      setTotalPages(sprintsRes.totalPages || 0);
      try {
        const statsData = await sprintService.getStats({
          projectId: projectFilter !== "ALL" ? projectFilter : undefined,
        });
        setStats(statsData);
      } catch (err) {
        console.error("Failed to load sprint stats", err);
      }
    } catch (err) {
      toast.error(err.message || "Failed to load sprints data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, statusFilter, projectFilter, page]);

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

  const confirmDelete = (sprint) => {
    setSprintToDelete(sprint);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!sprintToDelete) return;
    setDeleteLoading(true);
    try {
      await sprintService.delete(sprintToDelete.id);
      toast.success("Sprint deleted successfully");
      setDeleteOpen(false);
      setSprintToDelete(null);
      fetchData();
    } catch (err) {
      toast.error(err.message || "Failed to delete sprint");
    } finally {
      setDeleteLoading(false);
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

      {/* KPI Stats Panel */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border hairline bg-card p-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Active Sprints</div>
          <div className="text-2xl font-bold mt-1 text-success font-display">
            {stats.active}
          </div>
        </div>
        <div className="rounded-xl border hairline bg-card p-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Planned</div>
          <div className="text-2xl font-bold mt-1 text-primary font-display">
            {stats.planned}
          </div>
        </div>
        <div className="rounded-xl border hairline bg-card p-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Completed</div>
          <div className="text-2xl font-bold mt-1 text-muted-foreground font-display">
            {stats.completed}
          </div>
        </div>
        <div className="rounded-xl border hairline bg-card p-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Portfolio</div>
          <div className="text-2xl font-bold mt-1 font-display">{stats.total}</div>
        </div>
      </div>

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
                      <h3
                        className="font-display text-lg font-semibold cursor-pointer hover:text-primary transition-colors"
                        onClick={() => setViewSprint(s)}
                      >
                        {s.name}
                      </h3>
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

                <div className="pt-3 border-t hairline flex justify-end gap-1.5">
                  <Link to="/tasks" search={{ sprintId: s.id, projectId: s.projectId }}>
                    <Button
                      variant="default"
                      size="sm"
                      className="h-8 px-2 text-xs"
                    >
                      Sprint Board
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2"
                    onClick={() => setViewSprint(s)}
                  >
                    <Eye className="size-3.5 mr-1" /> View
                  </Button>
                  {canEdit && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2"
                        onClick={() => handleOpenEdit(s)}
                      >
                        <Edit2 className="size-3.5 mr-1" /> Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => confirmDelete(s)}
                      >
                        <Trash2 className="size-3.5 mr-1" /> Delete
                      </Button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-end gap-2 text-xs">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            Previous
          </Button>
          <span className="py-1.5 px-3 border border-input rounded-md bg-card">
            Page {page + 1} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
          >
            Next
          </Button>
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

      {/* Details Drawer / Sheet */}
      <Sheet open={viewSprint !== null} onOpenChange={(open) => !open && setViewSprint(null)}>
        <SheetContent className="bg-card border-l hairline sm:max-w-md">
          <SheetHeader className="pb-4 border-b hairline">
            <SheetTitle className="font-display text-xl">Sprint Details</SheetTitle>
          </SheetHeader>
          {viewSprint && (
            <div className="mt-6 space-y-6 text-sm">
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Sprint Name</span>
                <div className="font-semibold text-lg text-foreground">{viewSprint.name}</div>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Associated Project</span>
                <div className="font-medium text-foreground">
                  {projects.find((p) => p.id === viewSprint.projectId)?.name || "Unknown"}
                </div>
              </div>

              {viewSprint.goal && (
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Goal / Scope</span>
                  <div className="text-muted-foreground leading-relaxed">{viewSprint.goal}</div>
                </div>
              )}

              <div className="space-y-1">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Dates</span>
                <div className="flex flex-col gap-1">
                  <div>Starts: {fmtDate(viewSprint.startDate)}</div>
                  <div>Ends: {fmtDate(viewSprint.endDate)}</div>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Status</span>
                <div>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      viewSprint.status === "ACTIVE"
                        ? "bg-success/10 text-success"
                        : viewSprint.status === "COMPLETED"
                        ? "bg-muted text-muted-foreground"
                        : "bg-primary-soft text-primary"
                    }`}
                  >
                    {viewSprint.status}
                  </span>
                </div>
              </div>

              <div className="border-t hairline pt-4 text-xs text-muted-foreground space-y-1">
                <div>Created At: {fmtDate(viewSprint.createdAt)}</div>
                {viewSprint.updatedAt && <div>Updated At: {fmtDate(viewSprint.updatedAt)}</div>}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation */}
      <ConfirmationDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Sprint"
        description={`Are you sure you want to delete ${sprintToDelete?.name}? This will remove it from project planning.`}
        confirmLabel="Delete"
        loading={deleteLoading}
        onConfirm={handleDelete}
      />
    </div>
  );
}
