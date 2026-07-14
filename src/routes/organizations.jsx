import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShieldCheck, Plus, Search, Edit2, Trash2, ShieldAlert, Loader2, Filter, Check, Eye } from "lucide-react";
import { useSession } from "@/lib/session";
import { api } from "@/lib/api";
import { organizationService, userService } from "@/services/api-services";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { fmtDate } from "@/lib/format";

export const Route = createFileRoute("/organizations")({
  head: () => ({
    meta: [
      { title: "Organizations · NeuroForge platform" },
      { name: "description", content: "Manage platform tenants and organization details." },
    ],
  }),
  component: OrganizationsPage,
});

function OrganizationsPage() {
  const { user: currentUser } = useSession();
  const [orgs, setOrgs] = useState([]);
  const [pendingAdmins, setPendingAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [stats, setStats] = useState({ total: 0, active: 0, pendingApproval: 0, suspended: 0 });

  // Dialog & Drawer state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState(null); // null means creating
  const [formLoading, setFormLoading] = useState(false);
  const [viewOrg, setViewOrg] = useState(null); // drawer details

  // Delete confirmation state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [orgToDelete, setOrgToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [type, setType] = useState("ENTERPRISE");
  const [description, setDescription] = useState("");
  const [ownerUserId, setOwnerUserId] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [usersList, setUsersList] = useState([]);

  const isSuperAdmin = currentUser?.role === "super_admin";

  const fetchOrgs = async () => {
    setLoading(true);
    try {
      const typeParam = typeFilter === "ALL" ? undefined : typeFilter;
      const statusParam = statusFilter === "ALL" ? undefined : statusFilter;
      const res = await organizationService.search({
        type: typeParam,
        status: statusParam,
        page,
        size: 10,
      });
      setOrgs(res.content || []);
      setTotalPages(res.totalPages || 0);
      try {
        const statsData = await organizationService.getStats();
        setStats(statsData);
      } catch (err) {
        console.error("Failed to load organization stats", err);
      }
    } catch (err) {
      toast.error(err.message || "Failed to load organizations");
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingAdmins = async () => {
    try {
      const res = await userService.getPending();
      const admins = (res.content || []).filter((u) => u.role === "ORG_ADMIN" || u.role === "admin");
      setPendingAdmins(admins);
    } catch (err) {
      console.error("Failed to load pending administrators", err);
    }
  };

  const fetchPlatformUsers = async () => {
    try {
      const res = await api.get("/api/users?size=100");
      setUsersList(res.content || []);
    } catch (err) {
      console.error("Failed to load users for owner assignment", err);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      fetchOrgs();
      fetchPendingAdmins();
    }
  }, [page, typeFilter, statusFilter]);

  useEffect(() => {
    if (isSuperAdmin) {
      fetchPlatformUsers();
    }
  }, []);

  const handleOpenCreate = () => {
    setEditingOrg(null);
    setName("");
    setSlug("");
    setType("ENTERPRISE");
    setDescription("");
    setOwnerUserId(usersList[0]?.id || "");
    setStatus("ACTIVE");
    setDialogOpen(true);
  };

  const handleOpenEdit = (org) => {
    setEditingOrg(org);
    setName(org.name);
    setSlug(org.slug);
    setType(org.type);
    setDescription(org.description || "");
    setOwnerUserId(org.ownerId || "");
    setStatus(org.status || "ACTIVE");
    setDialogOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name || !slug || !ownerUserId) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setFormLoading(true);
    try {
      const payload = {
        name,
        slug,
        type,
        description,
        ownerUserId,
        status,
      };

      if (editingOrg) {
        await organizationService.update(editingOrg.id, payload);
        toast.success("Organization updated successfully");
      } else {
        await organizationService.create(payload);
        toast.success("Organization created successfully");
      }
      setDialogOpen(false);
      fetchOrgs();
    } catch (err) {
      toast.error(err.message || "Failed to save organization");
    } finally {
      setFormLoading(false);
    }
  };

  const handleApprove = async (orgId) => {
    try {
      await organizationService.approve(orgId);
      toast.success("Organization and Owner approved successfully!");
      fetchOrgs();
      fetchPendingAdmins();
    } catch (err) {
      toast.error(err.message || "Failed to approve organization");
    }
  };

  const handleApproveAdmin = async (userId) => {
    try {
      await userService.approve(userId);
      toast.success("Administrator approved successfully!");
      fetchOrgs();
      fetchPendingAdmins();
    } catch (err) {
      toast.error(err.message || "Failed to approve administrator");
    }
  };

  const confirmDelete = (org) => {
    setOrgToDelete(org);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!orgToDelete) return;
    setDeleteLoading(true);
    try {
      await organizationService.delete(orgToDelete.id);
      toast.success("Organization deleted successfully");
      setDeleteOpen(false);
      setOrgToDelete(null);
      fetchOrgs();
    } catch (err) {
      toast.error(err.message || "Failed to delete organization");
    } finally {
      setDeleteLoading(false);
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="p-8 max-w-md mx-auto text-center space-y-4 mt-20">
        <div className="size-12 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
          <ShieldAlert className="size-6" />
        </div>
        <h1 className="font-display text-2xl">Access Denied</h1>
        <p className="text-sm text-muted-foreground">
          You do not have the required permissions to view the platform administration.
        </p>
      </div>
    );
  }

  // Filter organizations locally by search text
  const filteredOrgs = orgs.filter((org) => {
    const q = search.toLowerCase();
    return (
      org.name.toLowerCase().includes(q) ||
      org.slug.toLowerCase().includes(q) ||
      (org.ownerName && org.ownerName.toLowerCase().includes(q))
    );
  });

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto space-y-6">
      <header className="flex items-end justify-between gap-4 pb-6 border-b hairline">
        <div>
          <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            Platform Administration
          </div>
          <h1 className="font-display text-3xl mt-1 flex items-center gap-2">
            <ShieldCheck className="size-6 text-primary" /> Organizations
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage organization tenants, approve registration requests, and configure settings.
          </p>
        </div>
        <Button size="sm" onClick={handleOpenCreate}>
          <Plus className="size-3.5 mr-1" /> New Organization
        </Button>
      </header>

      {/* KPI Stats Panel */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border hairline bg-card p-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Organizations</div>
          <div className="text-2xl font-bold mt-1 font-display">{stats.total}</div>
        </div>
        <div className="rounded-xl border hairline bg-card p-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Active</div>
          <div className="text-2xl font-bold mt-1 text-success font-display">
            {stats.active}
          </div>
        </div>
        <div className="rounded-xl border hairline bg-card p-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Pending Approval</div>
          <div className="text-2xl font-bold mt-1 text-warning font-display">
            {stats.pendingApproval}
          </div>
        </div>
        <div className="rounded-xl border hairline bg-card p-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Suspended</div>
          <div className="text-2xl font-bold mt-1 text-destructive font-display">
            {stats.suspended}
          </div>
        </div>
      </div>

      {/* Pending Administrators Section */}
      {pendingAdmins.length > 0 && (
        <div className="border border-warning/20 bg-warning/5 rounded-xl p-4 space-y-3">
          <div className="text-xs font-semibold text-warning uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="size-3.5" /> Pending Organization Administrators ({pendingAdmins.length})
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {pendingAdmins.slice(0, 10).map((admin) => (
              <div key={admin.id} className="p-3 border hairline bg-card rounded-lg text-xs">
                <div className="min-w-0">
                  <div className="font-semibold truncate">{admin.firstName} {admin.lastName}</div>
                  <div className="text-muted-foreground truncate text-[11px]">{admin.email}</div>
                  <div className="text-[10px] text-warning font-medium mt-0.5 uppercase">
                    Organization: {admin.organizationName || "N/A"}
                  </div>
                </div>
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
            placeholder="Search organizations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 text-xs"
          />
        </div>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40 h-9 text-xs bg-background">
            <Filter className="size-3 mr-1 text-muted-foreground" />
            <SelectValue placeholder="Org Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Types</SelectItem>
            <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
            <SelectItem value="STARTUP">Startup</SelectItem>
            <SelectItem value="AGENCY">Agency</SelectItem>
            <SelectItem value="EDUCATIONAL">Educational</SelectItem>
            <SelectItem value="GOVERNMENT">Government</SelectItem>
            <SelectItem value="NON_PROFIT">Non-Profit</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 h-9 text-xs bg-background">
            <Filter className="size-3 mr-1 text-muted-foreground" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="ACTIVE">ACTIVE</SelectItem>
            <SelectItem value="PENDING_APPROVAL">PENDING APPROVAL</SelectItem>
            <SelectItem value="SUSPENDED">SUSPENDED</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orgs Table */}
      <div className="rounded-xl border hairline bg-card overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-muted-foreground text-xs gap-2">
            <Loader2 className="size-6 animate-spin text-primary" />
            Loading organizations...
          </div>
        ) : filteredOrgs.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground text-sm">No organizations found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground border-b hairline">
                  <th className="py-2.5 pl-4 pr-3 font-medium">Organization Name</th>
                  <th className="py-2.5 px-3 font-medium">Slug / URL</th>
                  <th className="py-2.5 px-3 font-medium">Type</th>
                  <th className="py-2.5 px-3 font-medium">Owner</th>
                  <th className="py-2.5 px-3 font-medium">Status</th>
                  <th className="py-2.5 pr-4 pl-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-hairline)]">
                {filteredOrgs.map((org) => {
                  return (
                    <tr key={org.id} className="hover:bg-accent/40 transition-colors">
                      <td
                        className="py-3 pl-4 pr-3 font-semibold text-foreground cursor-pointer hover:text-primary transition-colors"
                        onClick={() => setViewOrg(org)}
                      >
                        {org.name}
                      </td>
                      <td className="py-3 px-3 text-muted-foreground">
                        /{org.slug}
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center rounded-md border hairline px-1.5 py-0.5 text-[11px] font-medium">
                          {org.type}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        {org.ownerName ? (
                          <div>
                            <div className="font-medium text-foreground">{org.ownerName}</div>
                            <div className="text-[11px] text-muted-foreground">{org.ownerEmail}</div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">N/A</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                            org.status === "ACTIVE"
                              ? "bg-success/10 text-success"
                              : org.status === "PENDING_APPROVAL"
                              ? "bg-warning/10 text-warning"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          <span
                            className={`size-1.5 rounded-full ${
                              org.status === "ACTIVE"
                                ? "bg-success"
                                : org.status === "PENDING_APPROVAL"
                                ? "bg-warning"
                                : "bg-muted-foreground"
                            }`}
                          />
                          {org.status}
                        </span>
                      </td>
                      <td className="py-3 pr-4 pl-3 text-right space-x-1.5">
                        {org.status === "PENDING_APPROVAL" && (
                          <Button
                            variant="default"
                            size="xs"
                            className="h-7 px-2"
                            onClick={() => handleApprove(org.id)}
                          >
                            <Check className="size-3.5 mr-1" /> Approve
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          onClick={() => setViewOrg(org)}
                        >
                          <Eye className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          onClick={() => handleOpenEdit(org)}
                        >
                          <Edit2 className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => confirmDelete(org)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </td>
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

      {/* Dialog for Edit / Create */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md bg-card border hairline">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {editingOrg ? "Edit Organization" : "New Organization"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Organization Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!editingOrg) {
                    setSlug(
                      e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, "-")
                        .replace(/(^-|-$)/g, "")
                    );
                  }
                }}
                required
                disabled={formLoading}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="slug">Slug (URL-safe)</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                required
                disabled={formLoading}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="type">Type</Label>
              <Select value={type} onValueChange={setType} disabled={formLoading}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
                  <SelectItem value="STARTUP">Startup</SelectItem>
                  <SelectItem value="AGENCY">Agency</SelectItem>
                  <SelectItem value="EDUCATIONAL">Educational</SelectItem>
                  <SelectItem value="GOVERNMENT">Government</SelectItem>
                  <SelectItem value="NON_PROFIT">Non-Profit</SelectItem>
                </SelectContent>
              </Select>
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
              <Label htmlFor="ownerUserId">Assign Owner User</Label>
              {usersList.length === 0 ? (
                <div className="text-xs text-muted-foreground italic py-1">
                  Loading users...
                </div>
              ) : (
                <Select value={ownerUserId} onValueChange={setOwnerUserId} disabled={formLoading}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select platform user" />
                  </SelectTrigger>
                  <SelectContent>
                    {usersList.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.firstName} {user.lastName} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="status">Organization Status</Label>
              <Select value={status} onValueChange={setStatus} disabled={formLoading}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                  <SelectItem value="PENDING_APPROVAL">PENDING_APPROVAL</SelectItem>
                  <SelectItem value="SUSPENDED">SUSPENDED</SelectItem>
                  <SelectItem value="DELETED">DELETED</SelectItem>
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

      {/* Details Drawer / Sheet */}
      <Sheet open={viewOrg !== null} onOpenChange={(open) => !open && setViewOrg(null)}>
        <SheetContent className="bg-card border-l hairline sm:max-w-md">
          <SheetHeader className="pb-4 border-b hairline">
            <SheetTitle className="font-display text-xl">Organization Details</SheetTitle>
          </SheetHeader>
          {viewOrg && (
            <div className="mt-6 space-y-6 text-sm">
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Name</span>
                <div className="font-semibold text-lg text-foreground">{viewOrg.name}</div>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">URL Slug</span>
                <div className="font-mono text-foreground">/{viewOrg.slug}</div>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Organization Type</span>
                <div className="font-medium text-foreground">{viewOrg.type}</div>
              </div>

              {viewOrg.description && (
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Description</span>
                  <div className="text-muted-foreground leading-relaxed">{viewOrg.description}</div>
                </div>
              )}

              <div className="space-y-1">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Status</span>
                <div>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      viewOrg.status === "ACTIVE"
                        ? "bg-success/10 text-success"
                        : viewOrg.status === "PENDING_APPROVAL"
                        ? "bg-warning/10 text-warning"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {viewOrg.status}
                  </span>
                </div>
              </div>

              <div className="border-t hairline pt-4 space-y-3">
                <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">Owner Details</h4>
                {viewOrg.ownerName ? (
                  <div className="space-y-2">
                    <div>
                      <span className="text-xs text-muted-foreground">Name:</span>
                      <div className="font-medium text-foreground">{viewOrg.ownerName}</div>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Email:</span>
                      <div className="font-medium text-foreground">{viewOrg.ownerEmail}</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground italic">No owner assigned yet.</div>
                )}
              </div>

              <div className="border-t hairline pt-4 text-xs text-muted-foreground space-y-1">
                <div>Created At: {fmtDate(viewOrg.createdAt)}</div>
                {viewOrg.updatedAt && <div>Updated At: {fmtDate(viewOrg.updatedAt)}</div>}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation */}
      <ConfirmationDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Organization"
        description={`Are you sure you want to delete ${orgToDelete?.name}? This will suspend the tenant workspace.`}
        confirmLabel="Delete"
        loading={deleteLoading}
        onConfirm={handleDelete}
      />
    </div>
  );
}
