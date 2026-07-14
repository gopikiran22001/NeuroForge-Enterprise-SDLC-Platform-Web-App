import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Users, Plus, Search, Edit2, Trash2, ShieldAlert, Loader2, Filter, Check, X } from "lucide-react";
import { useSession, mapBackendRoleToFrontend, mapFrontendRoleToBackend } from "@/lib/session";
import { ROLE_LABEL } from "@/lib/permissions";
import { api } from "@/lib/api";
import { userService } from "@/services/api-services";
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

export const Route = createFileRoute("/users")({
  head: () => ({
    meta: [
      { title: "Users · NeuroForge Nexus" },
      { name: "description", content: "Directory of every member across the organization." },
    ],
  }),
  component: UsersPage,
});

function UsersPage() {
  const { user: currentUser } = useSession();
  const [users, setUsers] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null); // null means creating
  const [formLoading, setFormLoading] = useState(false);

  // Form fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("developer");
  const [status, setStatus] = useState("ACTIVE");

  const canView = currentUser.role === "admin" || currentUser.role === "pm";
  const isAdmin = currentUser.role === "admin";

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Build search params
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("size", "10");
      if (search) params.set("search", search);
      if (roleFilter !== "ALL") params.set("role", mapFrontendRoleToBackend(roleFilter));
      if (statusFilter !== "ALL") params.set("status", statusFilter);

      const res = await api.get(`/api/users?${params.toString()}`);
      setUsers(res.content || []);
      setTotalPages(res.totalPages || 0);
    } catch (err) {
      toast.error(err.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingUsers = async () => {
    if (isAdmin) {
      try {
        const res = await userService.getPending();
        setPendingUsers(res.content || []);
      } catch (err) {
        console.error("Failed to load pending users", err);
      }
    }
  };

  useEffect(() => {
    setPage(0);
  }, [search, roleFilter, statusFilter]);

  useEffect(() => {
    if (canView) {
      fetchUsers();
      fetchPendingUsers();
    }
  }, [page, search, roleFilter, statusFilter]);

  const handleOpenCreate = () => {
    setEditingUser(null);
    setFirstName("");
    setLastName("");
    setEmail("");
    setPassword("");
    setRole("developer");
    setStatus("ACTIVE");
    setDialogOpen(true);
  };

  const handleOpenEdit = (u) => {
    setEditingUser(u);
    setFirstName(u.firstName);
    setLastName(u.lastName);
    setEmail(u.email);
    setPassword(""); // Do not populate password
    setRole(mapBackendRoleToFrontend(u.role));
    setStatus(u.status || "ACTIVE");
    setDialogOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const payload = {
        firstName,
        lastName,
        email,
        role: mapFrontendRoleToBackend(role),
        status: status,
      };

      if (password) {
        payload.password = password;
      } else if (!editingUser) {
        throw new Error("Password is required for new users.");
      }

      if (editingUser) {
        // Update user
        await api.put(`/api/users?id=${editingUser.id}`, payload);
        toast.success("User updated successfully");
      } else {
        // Create user
        await api.post("/api/users", payload);
        toast.success("User created successfully");
      }
      setDialogOpen(false);
      fetchUsers();
    } catch (err) {
      toast.error(err.message || "Failed to save user");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await api.delete(`/api/users?id=${userId}`);
      toast.success("User deleted successfully");
      fetchUsers();
      fetchPendingUsers();
    } catch (err) {
      toast.error(err.message || "Failed to delete user");
    }
  };

  const handleApprove = async (userId) => {
    try {
      await userService.approve(userId);
      toast.success("User approved successfully");
      fetchUsers();
      fetchPendingUsers();
    } catch (err) {
      toast.error(err.message || "Failed to approve user");
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
          You do not have the required permissions to view the user directory.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto space-y-6">
      <header className="flex items-end justify-between gap-4 pb-6 border-b hairline">
        <div>
          <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            Management
          </div>
          <h1 className="font-display text-3xl mt-1 flex items-center gap-2">
            <Users className="size-6 text-primary" /> Users
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Directory of every member across the organization.
          </p>
        </div>
        {isAdmin && (
          <Button size="sm" onClick={handleOpenCreate}>
            <Plus className="size-3.5 mr-1" /> New user
          </Button>
        )}
      </header>

      {/* Pending Approval Section */}
      {isAdmin && pendingUsers.length > 0 && (
        <div className="border border-primary/20 bg-primary-soft/10 rounded-xl p-4 space-y-3">
          <div className="text-xs font-semibold text-primary uppercase tracking-wider flex items-center gap-1.5">
            <Users className="size-3.5" /> Pending Join Requests ({pendingUsers.length})
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {pendingUsers.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-3 border hairline bg-card rounded-lg text-xs">
                <div className="min-w-0 pr-2">
                  <div className="font-semibold truncate">{p.firstName} {p.lastName}</div>
                  <div className="text-muted-foreground truncate text-[11px]">{p.email}</div>
                  <div className="text-[10px] text-primary font-medium mt-0.5 uppercase">{ROLE_LABEL[mapBackendRoleToFrontend(p.role)] || p.role}</div>
                </div>
                <Button
                  size="xs"
                  className="h-7 px-2 shrink-0"
                  onClick={() => handleApprove(p.id)}
                >
                  <Check className="size-3.5 mr-1" /> Approve
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Search by name or email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 text-xs"
          />
        </div>

        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-36 h-9 text-xs bg-background">
            <Filter className="size-3 mr-1 text-muted-foreground" />
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All roles</SelectItem>
            {Object.entries(ROLE_LABEL).map(([val, label]) => (
              <SelectItem key={val} value={val}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32 h-9 text-xs bg-background">
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

      {/* Users table */}
      <div className="rounded-xl border hairline bg-card overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-muted-foreground text-xs gap-2">
            <Loader2 className="size-6 animate-spin text-primary" />
            Loading user directory...
          </div>
        ) : users.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground text-sm">No users found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground border-b hairline">
                  <th className="py-2.5 pl-4 pr-3 font-medium">Name</th>
                  <th className="py-2.5 px-3 font-medium">Email</th>
                  <th className="py-2.5 px-3 font-medium">Role</th>
                  <th className="py-2.5 px-3 font-medium">Status</th>
                  {isAdmin && <th className="py-2.5 pr-4 pl-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-hairline)]">
                {users.map((u) => {
                  const initials =
                    `${u.firstName?.[0] || ""}${u.lastName?.[0] || ""}`.toUpperCase();
                  const roleLabel = ROLE_LABEL[mapBackendRoleToFrontend(u.role)] || u.role;

                  return (
                    <tr key={u.id} className="hover:bg-accent/40 transition-colors">
                      <td className="py-3 pl-4 pr-3">
                        <div className="flex items-center gap-2.5">
                          <div className="grid size-7 place-items-center rounded-full bg-primary-soft text-primary text-[10px] font-semibold">
                            {initials || "U"}
                          </div>
                          <div className="font-medium text-foreground">
                            {u.firstName} {u.lastName}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-muted-foreground">{u.email}</td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center rounded-md border hairline px-1.5 py-0.5 text-[11px] font-medium">
                          {roleLabel}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                            u.status === "ACTIVE"
                              ? "bg-success/10 text-success"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          <span
                            className={`size-1.5 rounded-full ${
                              u.status === "ACTIVE" ? "bg-success" : "bg-muted-foreground"
                            }`}
                          />
                          {u.status || "ACTIVE"}
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="py-3 pr-4 pl-3 text-right space-x-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7"
                            onClick={() => handleOpenEdit(u)}
                          >
                            <Edit2 className="size-3.5" />
                          </Button>
                          {u.id !== currentUser.id && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 text-destructive hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => handleDelete(u.id)}
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
              {editingUser ? "Edit User" : "New User"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="firstName">First name</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  disabled={formLoading}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName">Last name</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  disabled={formLoading}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={formLoading}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">
                Password{" "}
                {editingUser && (
                  <span className="text-muted-foreground text-[10px]">
                    (leave blank to keep current)
                  </span>
                )}
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required={!editingUser}
                disabled={formLoading}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="role">Role</Label>
                <Select value={role} onValueChange={setRole} disabled={formLoading}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ROLE_LABEL).map(([val, label]) => (
                      <SelectItem key={val} value={val}>
                        {label}
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
