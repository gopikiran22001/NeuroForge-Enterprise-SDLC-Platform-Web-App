import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { UsersRound, Plus, Search, Edit2, Trash2, ShieldAlert, Loader2, Filter } from "lucide-react";
import { useSession } from "@/lib/session";
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

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [teamLeaderId, setTeamLeaderId] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [status, setStatus] = useState("ACTIVE");
  const [memberSearch, setMemberSearch] = useState("");

  const canEdit = currentUser.role === "admin" || currentUser.role === "pm";

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

  const handleOpenCreate = () => {
    setEditingTeam(null);
    setName("");
    setDescription("");
    setTeamLeaderId(users[0]?.id || "");
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

  const handleDelete = async (teamId) => {
    if (!window.confirm("Are you sure you want to delete this team?")) return;
    try {
      await teamService.delete(teamId);
      toast.success("Team deleted successfully");
      fetchData();
    } catch (err) {
      toast.error(err.message || "Failed to delete team");
    }
  };

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
                      <h3 className="font-display text-lg font-semibold">{t.name}</h3>
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
                        {(t.memberIds || []).size || t.memberIds?.length || 0} members
                      </span>
                    </div>
                  </div>
                </div>

                {canEdit && (
                  <div className="pt-3 border-t hairline flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8"
                      onClick={() => handleOpenEdit(t)}
                    >
                      <Edit2 className="size-3.5 mr-1" /> Edit
                    </Button>
                    {currentUser.role === "admin" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => handleDelete(t.id)}
                      >
                        <Trash2 className="size-3.5 mr-1" /> Delete
                      </Button>
                    )}
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

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="teamLeader">Team Leader</Label>
                <Select value={teamLeaderId} onValueChange={setTeamLeaderId} disabled={formLoading}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select leader" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.firstName} {u.lastName}
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
                {users
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
