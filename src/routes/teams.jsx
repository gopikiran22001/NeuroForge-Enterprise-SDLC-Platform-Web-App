import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { UsersRound, Plus, Search, Edit2, Trash2, ShieldAlert, Loader2, Filter, Eye } from "lucide-react";
import { useSession, mapBackendRoleToFrontend } from "@/lib/session";
import { ROLE_LABEL } from "@/lib/permissions";
import { teamService, userService } from "@/services/api-services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export const Route = createFileRoute("/teams")({
  head: () => ({
    meta: [
      { title: "Teams · NeuroForge Nexus" },
      { name: "description", content: "Directory of engineering and product teams." },
    ],
  }),
  component: TeamsPage,
});

function TeamsPage() {
  const { user: currentUser } = useSession();
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Dialog & Drawer state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [viewTeam, setViewTeam] = useState(null);

  // Delete state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [teamLeaderId, setTeamLeaderId] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [status, setStatus] = useState("ACTIVE");
  const [memberSearch, setMemberSearch] = useState("");

  const canEdit = currentUser?.role === "admin" || currentUser?.role === "pm";

  const fetchData = async () => {
    setLoading(true);
    try {
      const [teamsRes, usersRes] = await Promise.all([
        teamService.search({
          search: search || undefined,
          status: statusFilter !== "ALL" ? statusFilter : undefined,
          size: 100,
        }),
        userService.search({ size: 100 }),
      ]);
      setTeams(teamsRes.content || []);
      setUsers(usersRes.content || []);
    } catch (err) {
      toast.error(err.message || "Failed to load teams data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, statusFilter]);

  // Compute which user IDs are already assigned to any team
  const usersAlreadyInTeam = new Set(
    teams.flatMap((t) => [...(t.memberIds || []), t.teamLeaderId].filter(Boolean)),
  );

  // Excluded roles for team membership
  const EXCLUDED_ROLES = ["ORG_ADMIN", "PROJECT_MANAGER"];

  // Users eligible for team assignment (not in any team + not excluded roles)
  // When editing, also include users who are currently in *this* team
  const getAvailableUsers = (currentTeam) => {
    return users.filter((u) => {
      // Always exclude ORG_ADMIN and PROJECT_MANAGER
      if (EXCLUDED_ROLES.includes(u.role)) return false;

      // If creating, exclude anyone already in a team
      if (!currentTeam) {
        return !usersAlreadyInTeam.has(u.id);
      }

      // If editing, keep current team members + anyone not in any other team
      const currentTeamMemberIds = new Set([
        ...(currentTeam.memberIds || []),
        currentTeam.teamLeaderId,
      ].filter(Boolean));
      return currentTeamMemberIds.has(u.id) || !usersAlreadyInTeam.has(u.id);
    });
  };

  const handleOpenCreate = () => {
    setEditingTeam(null);
    setName("");
    setDescription("");
    const available = getAvailableUsers(null);
    setTeamLeaderId(available[0]?.id || "");
    setSelectedMembers([]);
    setStatus("ACTIVE");
    setMemberSearch("");
    setDialogOpen(true);
  };

  const handleOpenEdit = (t) => {
    setEditingTeam(t);
    setName(t.name);
    setDescription(t.description || "");
    setTeamLeaderId(t.teamLeaderId || "");
    setSelectedMembers(Array.from(t.memberIds || []));
    setStatus(t.status || "ACTIVE");
    setMemberSearch("");
    setDialogOpen(true);
  };

  const handleToggleMember = (userId) => {
    setSelectedMembers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    );
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (selectedMembers.length === 0) {
      toast.error("At least one team member must be assigned.");
      return;
    }
    setFormLoading(true);
    try {
      const payload = {
        name,
        description,
        teamLeaderId,
        memberIds: selectedMembers,
        status,
      };

      if (editingTeam) {
        await teamService.update(editingTeam.id, payload);
        toast.success("Team updated successfully");
      } else {
        await teamService.create(payload);
        toast.success("Team created successfully");
      }
      setDialogOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.message || "Failed to save team");
    } finally {
      setFormLoading(false);
    }
  };

  const confirmDelete = (team) => {
    setTeamToDelete(team);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!teamToDelete) return;
    setDeleteLoading(true);
    try {
      await teamService.delete(teamToDelete.id);
      toast.success("Team deleted successfully");
      setDeleteOpen(false);
      setTeamToDelete(null);
      fetchData();
    } catch (err) {
      toast.error(err.message || "Failed to delete team");
    } finally {
      setDeleteLoading(false);
    }
  };

  const totalMembers = teams.reduce((sum, t) => sum + (t.memberIds?.length || 0), 0);

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto space-y-6">
      <header className="flex items-end justify-between gap-4 pb-6 border-b hairline">
        <div>
          <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            Management
          </div>
          <h1 className="font-display text-3xl mt-1 flex items-center gap-2">
            <UsersRound className="size-6 text-primary" /> Teams
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your organization's delivery units, leadership, and capacity.
          </p>
        </div>
        {canEdit && (
          <Button size="sm" onClick={handleOpenCreate}>
            <Plus className="size-3.5 mr-1" /> New team
          </Button>
        )}
      </header>

      {/* KPI Stats Panel */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="rounded-xl border hairline bg-card p-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Teams</div>
          <div className="text-2xl font-bold mt-1 font-display">{teams.length}</div>
        </div>
        <div className="rounded-xl border hairline bg-card p-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Active Units</div>
          <div className="text-2xl font-bold mt-1 text-success font-display">
            {teams.filter(t => t.status === "ACTIVE").length}
          </div>
        </div>
        <div className="rounded-xl border hairline bg-card p-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Assigned Members</div>
          <div className="text-2xl font-bold mt-1 font-display">{totalMembers}</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Search teams by name"
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
            <SelectItem value="ACTIVE">ACTIVE</SelectItem>
            <SelectItem value="INACTIVE">INACTIVE</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Teams grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-muted-foreground text-xs gap-2">
          <Loader2 className="size-6 animate-spin text-primary" />
          Loading teams...
        </div>
      ) : teams.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground text-sm">No teams found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((t) => {
            const leadUser = users.find((u) => u.id === t.teamLeaderId);
            const leadName = leadUser
              ? `${leadUser.firstName} ${leadUser.lastName}`
              : "Unknown Leader";

            return (
              <div
                key={t.id}
                className="rounded-xl border hairline bg-card p-5 flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3
                        className="font-display text-lg font-semibold cursor-pointer hover:text-primary transition-colors"
                        onClick={() => setViewTeam(t)}
                      >
                        {t.name}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {t.description || "No description provided."}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        t.status === "ACTIVE"
                          ? "bg-success/10 text-success"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>

                  <div className="mt-4 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Team Lead:</span>
                      <span className="font-medium text-foreground">{leadName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Active Members:</span>
                      <span className="font-medium text-foreground">
                        {t.memberIds?.length || 0} members
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t hairline flex justify-end gap-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2"
                    onClick={() => setViewTeam(t)}
                  >
                    <Eye className="size-3.5 mr-1" /> View
                  </Button>
                  {canEdit && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2"
                        onClick={() => handleOpenEdit(t)}
                      >
                        <Edit2 className="size-3.5 mr-1" /> Edit
                      </Button>
                      {currentUser?.role === "admin" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => confirmDelete(t)}
                        >
                          <Trash2 className="size-3.5 mr-1" /> Delete
                        </Button>
                      )}
                    </>
                  )}
                </div>
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
              {editingTeam ? "Edit Team" : "New Team"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Team name</Label>
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
                required
                disabled={formLoading}
              />
            </div>

            {(() => {
              const dialogUsers = getAvailableUsers(editingTeam);
              return (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="teamLeader">Team Leader</Label>
                      <Select value={teamLeaderId} onValueChange={setTeamLeaderId} disabled={formLoading}>
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder="Select leader" />
                        </SelectTrigger>
                        <SelectContent>
                          {dialogUsers.map((u) => (
                            <SelectItem key={u.id} value={u.id}>
                              {u.firstName} {u.lastName}
                              <span className="ml-1 text-muted-foreground">· {ROLE_LABEL[mapBackendRoleToFrontend(u.role)] || u.role}</span>
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
                          <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                          <SelectItem value="INACTIVE">INACTIVE</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Members Checklist */}
                  <div className="space-y-2">
                    <Label>Team Members</Label>
                    <Input
                      placeholder="Filter members..."
                      value={memberSearch}
                      onChange={(e) => setMemberSearch(e.target.value)}
                      className="h-8 text-xs mb-2"
                      disabled={formLoading}
                    />
                    <div className="border hairline rounded-lg p-3 max-h-[160px] overflow-y-auto space-y-2 bg-background [&::-webkit-scrollbar]:hidden [scrollbar-width:none] [-ms-overflow-style:none]">
                      {dialogUsers
                        .filter((u) => {
                          const fullName = `${u.firstName || ""} ${u.lastName || ""}`.toLowerCase();
                          const email = (u.email || "").toLowerCase();
                          const q = memberSearch.toLowerCase();
                          return fullName.includes(q) || email.includes(q);
                        })
                        .map((u) => (
                          <div key={u.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`chk-${u.id}`}
                              checked={selectedMembers.includes(u.id)}
                              onCheckedChange={() => handleToggleMember(u.id)}
                              disabled={formLoading}
                            />
                            <label htmlFor={`chk-${u.id}`} className="text-xs cursor-pointer select-none">
                              {u.firstName} {u.lastName} ({u.email})
                              <span className="ml-1 text-muted-foreground">· {ROLE_LABEL[mapBackendRoleToFrontend(u.role)] || u.role}</span>
                            </label>
                          </div>
                        ))}
                    </div>
                  </div>
                </>
              );
            })()}

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

      {/* Details Sheet */}
      <Sheet open={viewTeam !== null} onOpenChange={(open) => !open && setViewTeam(null)}>
        <SheetContent className="bg-card border-l hairline sm:max-w-md">
          <SheetHeader className="pb-4 border-b hairline">
            <SheetTitle className="font-display text-xl">Team Workspace Details</SheetTitle>
          </SheetHeader>
          {viewTeam && (
            <div className="mt-6 space-y-6 text-sm">
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Team Name</span>
                <div className="font-semibold text-lg text-foreground">{viewTeam.name}</div>
              </div>

              {viewTeam.description && (
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Description</span>
                  <div className="text-muted-foreground leading-relaxed">{viewTeam.description}</div>
                </div>
              )}

              <div className="space-y-1">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Status</span>
                <div>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      viewTeam.status === "ACTIVE"
                        ? "bg-success/10 text-success"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {viewTeam.status}
                  </span>
                </div>
              </div>

              <div className="border-t hairline pt-4 space-y-3">
                <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">Team Leadership</h4>
                <div>
                  <span className="text-xs text-muted-foreground">Team Leader:</span>
                  <div className="font-medium text-foreground">
                    {users.find((u) => u.id === viewTeam.teamLeaderId)
                      ? `${users.find((u) => u.id === viewTeam.teamLeaderId).firstName} ${users.find((u) => u.id === viewTeam.teamLeaderId).lastName}`
                      : "No assigned leader"}
                  </div>
                </div>
              </div>

              <div className="border-t hairline pt-4 space-y-3">
                <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">Active Members ({viewTeam.memberIds?.length || 0})</h4>
                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                  {(viewTeam.memberIds || []).map((uid) => {
                    const u = users.find((user) => user.id === uid);
                    if (!u) return null;
                    return (
                      <div key={uid} className="flex items-center gap-2">
                        <div className="grid size-6 place-items-center rounded-full bg-primary-soft text-primary text-[9px] font-semibold">
                          {`${u.firstName?.[0] || ""}${u.lastName?.[0] || ""}`.toUpperCase()}
                        </div>
                        <div>
                          <div className="text-xs font-medium">{u.firstName} {u.lastName}</div>
                          <div className="text-[10px] text-muted-foreground">{u.email}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation */}
      <ConfirmationDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Team"
        description={`Are you sure you want to delete ${teamToDelete?.name}? This will dissolve the delivery unit.`}
        confirmLabel="Delete"
        loading={deleteLoading}
        onConfirm={handleDelete}
      />
    </div>
  );
}
