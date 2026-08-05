import { createFileRoute, Link } from "@tanstack/react-router";
import { FolderKanban, Plus, Search, Loader2, Edit2, Trash2, Filter, Github, GitBranch, Workflow, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { fmtDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { projectService, userService, teamService, githubIntegrationService } from "@/services/api-services";
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
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";

const PROJECT_STATUSES = ["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"];

export const Route = createFileRoute("/projects/")({
  head: () => ({
    meta: [
      { title: "Projects · NeuroForge Platform" },
      {
        name: "description",
        content: "Every project in the workspace linked to GitHub repositories and workflows.",
      },
    ],
  }),
  component: ProjectList,
});

export function ProjectList() {
  const { user: currentUser } = useSession();
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("ACTIVE");

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  // GitHub Cascading Dropdown States
  const [githubIntegrationId, setGithubIntegrationId] = useState("");
  const [availableRepos, setAvailableRepos] = useState([]);
  const [reposLoading, setReposLoading] = useState(false);
  const [selectedRepoFullName, setSelectedRepoFullName] = useState("");

  const [availableBranches, setAvailableBranches] = useState([]);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState("");

  const [availableWorkflows, setAvailableWorkflows] = useState([]);
  const [workflowsLoading, setWorkflowsLoading] = useState(false);
  const [selectedWorkflowIdStr, setSelectedWorkflowIdStr] = useState("");

  // Hidden auto-populated fields for payload
  const [repositoryOwner, setRepositoryOwner] = useState("");
  const [repositoryName, setRepositoryName] = useState("");
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [workflowName, setWorkflowName] = useState("");
  const [workflowFile, setWorkflowFile] = useState("");

  // Delete state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);

  // Core Form fields
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [projectManagerId, setProjectManagerId] = useState("");
  const [selectedTeams, setSelectedTeams] = useState([]);
  const [status, setStatus] = useState("ACTIVE");
  const [teamSearch, setTeamSearch] = useState("");

  const canEdit = currentUser?.role === "admin" || currentUser?.role === "super_admin";

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const [projRes, usersRes, teamsRes, integrationsRes] = await Promise.all([
        projectService.search({
          search: q || undefined,
          status: statusFilter !== "ALL" ? statusFilter : undefined,
          size: 100,
        }),
        userService.search({ role: "PROJECT_MANAGER", size: 100 }).catch(() => ({ content: [] })),
        teamService.search({ size: 100 }).catch(() => ({ content: [] })),
        githubIntegrationService.search({ status: "CONNECTED", size: 100 }).catch(() => ({ content: [] })),
      ]);
      const content = projRes.content || [];
      const mapped = content.map((p) => ({ ...mapBackendProjectToFrontend(p), raw: p }));
      setProjects(mapped);
      setUsers(usersRes.content || []);
      setTeams(teamsRes.content || []);
      setIntegrations(integrationsRes.content || []);
    } catch (err) {
      console.error("Failed to fetch projects:", err);
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [q, statusFilter]);

  // Load repositories when GitHub integration selection changes
  const handleIntegrationChange = async (integrationId) => {
    setGithubIntegrationId(integrationId);
    setSelectedRepoFullName("");
    setAvailableRepos([]);
    setSelectedBranch("");
    setAvailableBranches([]);
    setSelectedWorkflowIdStr("");
    setAvailableWorkflows([]);
    setRepositoryOwner("");
    setRepositoryName("");
    setRepositoryUrl("");
    setWorkflowName("");
    setWorkflowFile("");

    if (!integrationId) return;

    setReposLoading(true);
    try {
      const res = await githubIntegrationService.getRepositories(integrationId, { size: 100 });
      setAvailableRepos(res.content || []);
    } catch (err) {
      console.error("Failed to load repositories:", err);
      toast.error("Failed to load repositories for selected integration");
    } finally {
      setReposLoading(false);
    }
  };

  // Load branches & workflows when repository selection changes
  const handleRepositoryChange = async (fullName) => {
    setSelectedRepoFullName(fullName);
    setSelectedBranch("");
    setAvailableBranches([]);
    setSelectedWorkflowIdStr("");
    setAvailableWorkflows([]);

    const repoObj = availableRepos.find((r) => (r.fullName || r.name) === fullName);
    if (!repoObj || !githubIntegrationId) return;

    setRepositoryOwner(repoObj.owner);
    setRepositoryName(repoObj.name);
    setRepositoryUrl(repoObj.repositoryUrl);

    setBranchesLoading(true);
    setWorkflowsLoading(true);

    try {
      const [branchRes, wfRes] = await Promise.all([
        githubIntegrationService.getBranches(githubIntegrationId, repoObj.owner, repoObj.name).catch(() => ({ content: [] })),
        githubIntegrationService.getWorkflows(githubIntegrationId, repoObj.owner, repoObj.name).catch(() => ({ content: [] })),
      ]);

      const bList = branchRes.content || [];
      setAvailableBranches(bList);
      if (repoObj.defaultBranch) {
        setSelectedBranch(repoObj.defaultBranch);
      } else if (bList.length > 0) {
        setSelectedBranch(bList[0].name);
      }

      const wList = wfRes.content || [];
      setAvailableWorkflows(wList);
      if (wList.length > 0) {
        setSelectedWorkflowIdStr(String(wList[0].id));
        setWorkflowName(wList[0].name);
        setWorkflowFile(wList[0].path);
      }
    } catch (err) {
      console.error("Error loading branches/workflows:", err);
    } finally {
      setBranchesLoading(false);
      setWorkflowsLoading(false);
    }
  };

  const handleWorkflowChange = (wfIdStr) => {
    setSelectedWorkflowIdStr(wfIdStr);
    const wfObj = availableWorkflows.find((w) => String(w.id) === wfIdStr);
    if (wfObj) {
      setWorkflowName(wfObj.name);
      setWorkflowFile(wfObj.path);
    }
  };

  const handleOpenCreate = () => {
    setEditingProject(null);
    setName("");
    setCode("");
    setDescription("");
    setStartDate(new Date().toISOString().split("T")[0]);
    setProjectManagerId(currentUser?.id || users[0]?.id || "");
    setSelectedTeams([]);
    setStatus("ACTIVE");
    setTeamSearch("");

    setGithubIntegrationId(integrations[0]?.id || "");
    setSelectedRepoFullName("");
    setAvailableRepos([]);
    setSelectedBranch("");
    setAvailableBranches([]);
    setSelectedWorkflowIdStr("");
    setAvailableWorkflows([]);

    if (integrations.length > 0) {
      handleIntegrationChange(integrations[0].id);
    }

    setDialogOpen(true);
  };

  const handleOpenEdit = async (p, originalParam) => {
    const original = originalParam || p?.raw || p || {};
    setEditingProject(p);
    setName(p.name || original.name || "");
    setCode(p.key || p.code || original.code || "");
    setDescription(original.description || p.description || "");
    setStartDate(original.startDate ? original.startDate.split("T")[0] : (p.startDate ? p.startDate.split("T")[0] : ""));
    setProjectManagerId(original.projectManagerId || p.projectManagerId || "");
    setSelectedTeams(Array.from(original.teamIds || p.teamIds || []));
    setStatus(original.status || p.status || "ACTIVE");
    setTeamSearch("");

    const integrationId = original.githubIntegrationId || p.githubIntegrationId || "";
    const repoOwner = original.repositoryOwner || p.repositoryOwner || "";
    const repoName = original.repositoryName || p.repositoryName || "";
    const repoFullName = original.repositoryFullName || p.repositoryFullName || "";
    const repoUrl = original.repositoryUrl || p.repositoryUrl || "";
    const defaultBranch = original.defaultBranch || p.defaultBranch || "main";
    const workflowId = original.workflowId || p.workflowId;
    const wfName = original.workflowName || p.workflowName || "";
    const wfFile = original.workflowFile || p.workflowFile || "";

    setGithubIntegrationId(integrationId);
    setRepositoryOwner(repoOwner);
    setRepositoryName(repoName);
    setSelectedRepoFullName(repoFullName);
    setRepositoryUrl(repoUrl);
    setSelectedBranch(defaultBranch);
    setSelectedWorkflowIdStr(workflowId ? String(workflowId) : "");
    setWorkflowName(wfName);
    setWorkflowFile(wfFile);

    if (integrationId) {
      setReposLoading(true);
      try {
        const res = await githubIntegrationService.getRepositories(integrationId, { size: 100 });
        setAvailableRepos(res.content || []);

        if (repoOwner && repoName) {
          const [branchRes, wfRes] = await Promise.all([
            githubIntegrationService.getBranches(integrationId, repoOwner, repoName).catch(() => ({ content: [] })),
            githubIntegrationService.getWorkflows(integrationId, repoOwner, repoName).catch(() => ({ content: [] })),
          ]);
          setAvailableBranches(branchRes.content || []);
          setAvailableWorkflows(wfRes.content || []);
        }
      } catch (err) {
        console.error("Failed to load edit project GitHub details:", err);
      } finally {
        setReposLoading(false);
      }
    }

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
        githubIntegrationId: githubIntegrationId || null,
        repositoryOwner: repositoryOwner || null,
        repositoryName: repositoryName || null,
        repositoryFullName: selectedRepoFullName || null,
        repositoryUrl: repositoryUrl || null,
        repositoryProvider: "GITHUB",
        defaultBranch: selectedBranch || "main",
        workflowId: selectedWorkflowIdStr ? LongFromStr(selectedWorkflowIdStr) : null,
        workflowName: workflowName || null,
        workflowFile: workflowFile || null,
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

  const LongFromStr = (str) => {
    const num = parseInt(str, 10);
    return isNaN(num) ? null : num;
  };

  const confirmDelete = (proj) => {
    setProjectToDelete(proj);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!projectToDelete) return;
    setLoading(true);
    try {
      await projectService.delete(projectToDelete.id);
      toast.success("Project deleted successfully");
      setDeleteOpen(false);
      setProjectToDelete(null);
      await fetchProjects();
    } catch (err) {
      toast.error(err.message || "Failed to delete project");
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto">
      <header className="flex items-end justify-between gap-4 pb-6 border-b hairline">
        <div>
          <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            Delivery & Engineering
          </div>
          <h1 className="font-display text-3xl mt-1 flex items-center gap-2">
            <FolderKanban className="size-6 text-primary" /> Projects
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Workspace projects linked to real GitHub repositories, default branches, and GitHub Actions workflows.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              placeholder="Search projects"
              className="h-9 pl-8 w-64 text-xs"
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

      {/* Projects Grid / List */}
      {loading ? (
        <div className="py-16 text-center text-xs text-muted-foreground flex justify-center items-center gap-2">
          <Loader2 className="size-5 animate-spin text-primary" /> Loading projects...
        </div>
      ) : projects.length === 0 ? (
        <div className="rounded-xl border hairline bg-card p-12 text-center text-xs text-muted-foreground mt-6">
          No projects found matching your criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {projects.map((p) => (
            <div
              key={p.id}
              className="rounded-xl border hairline bg-card p-5 hover:border-primary/40 transition-all shadow-sm flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Link to="/projects/$projectId" params={{ projectId: p.id }} className="hover:underline">
                      <h3 className="font-semibold text-foreground text-base truncate">{p.name}</h3>
                    </Link>
                    <span className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-semibold">
                      {p.key}
                    </span>
                  </div>
                  <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border bg-primary/10 text-primary border-primary/20">
                    {p.status}
                  </span>
                </div>

                <p className="text-xs text-muted-foreground line-clamp-2">{p.raw?.description || "No description provided."}</p>

                <div className="pt-2 border-t hairline space-y-1.5 text-xs text-muted-foreground">
                  {p.raw?.repositoryFullName && (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Github className="size-3.5 text-foreground" /> Repository:
                      </span>
                      <span className="font-mono text-foreground font-medium truncate max-w-[180px]">
                        {p.raw.repositoryFullName}
                      </span>
                    </div>
                  )}

                  {p.raw?.defaultBranch && (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <GitBranch className="size-3.5 text-primary" /> Branch:
                      </span>
                      <span className="font-mono text-foreground">{p.raw.defaultBranch}</span>
                    </div>
                  )}

                  {p.raw?.workflowName && (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Workflow className="size-3.5 text-primary" /> Workflow:
                      </span>
                      <span className="font-medium text-foreground truncate max-w-[180px]">{p.raw.workflowName}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t hairline flex items-center justify-between">
                <Link to="/projects/$projectId" params={{ projectId: p.id }}>
                  <span className="text-xs text-primary hover:underline font-medium">View Project →</span>
                </Link>

                {canEdit && (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      onClick={() => handleOpenEdit(p, p.raw)}
                    >
                      <Edit2 className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => confirmDelete(p)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Project Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg bg-card border hairline max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl flex items-center gap-2">
              <FolderKanban className="size-5 text-primary" />
              {editingProject ? "Edit Project Configuration" : "Create GitHub-Backed Project"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 py-2 text-xs">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="name" className="font-semibold">Project Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g. Payment Service"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={formLoading}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="code" className="font-semibold">Project Code *</Label>
                <Input
                  id="code"
                  placeholder="PAY"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  required
                  disabled={formLoading}
                  className="h-9 text-xs font-mono"
                  maxLength={10}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="Brief summary of the project"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={formLoading}
                className="h-9 text-xs"
              />
            </div>

            {/* Cascading GitHub Selection Step 1..4 */}
            <div className="p-4 bg-muted/20 border hairline rounded-xl space-y-3">
              <div className="flex items-center gap-2 border-b hairline pb-2">
                <Github className="size-4 text-primary" />
                <span className="font-semibold text-foreground">GitHub Integration & Workflow Setup</span>
              </div>

              {/* Step 1: GitHub Integration */}
              <div className="space-y-1.5">
                <Label htmlFor="githubIntegration">Step 1: Select GitHub Integration</Label>
                <Select value={githubIntegrationId} onValueChange={handleIntegrationChange} disabled={formLoading}>
                  <SelectTrigger className="bg-background h-9 text-xs">
                    <SelectValue placeholder="Select connected GitHub account" />
                  </SelectTrigger>
                  <SelectContent>
                    {integrations.map((i) => (
                      <SelectItem key={i.id} value={i.id}>
                        {i.connectionName} (@{i.githubUsername || "user"})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Step 2: Repository */}
              <div className="space-y-1.5">
                <Label htmlFor="repository">Step 2: Select Repository</Label>
                <Select
                  value={selectedRepoFullName}
                  onValueChange={handleRepositoryChange}
                  disabled={formLoading || reposLoading || !githubIntegrationId}
                >
                  <SelectTrigger className="bg-background h-9 text-xs">
                    {reposLoading ? (
                      <span className="flex items-center gap-1.5"><Loader2 className="size-3 animate-spin" /> Loading repositories...</span>
                    ) : (
                      <SelectValue placeholder="Select GitHub repository" />
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    {availableRepos.map((r) => (
                      <SelectItem key={r.id} value={r.fullName || r.name}>
                        {r.fullName || r.name} ({r.visibility || "public"})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Step 3: Branch */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="branch">Step 3: Default Branch</Label>
                  <Select
                    value={selectedBranch}
                    onValueChange={setSelectedBranch}
                    disabled={formLoading || branchesLoading || !selectedRepoFullName}
                  >
                    <SelectTrigger className="bg-background h-9 text-xs font-mono">
                      {branchesLoading ? (
                        <span className="flex items-center gap-1.5"><Loader2 className="size-3 animate-spin" /> Branches...</span>
                      ) : (
                        <SelectValue placeholder="Select branch" />
                      )}
                    </SelectTrigger>
                    <SelectContent>
                      {availableBranches.map((b) => (
                        <SelectItem key={b.name} value={b.name}>
                          {b.name} {b.defaultBranch ? "(Default)" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Step 4: Workflow */}
                <div className="space-y-1.5">
                  <Label htmlFor="workflow">Step 4: GitHub Actions Workflow</Label>
                  <Select
                    value={selectedWorkflowIdStr}
                    onValueChange={handleWorkflowChange}
                    disabled={formLoading || workflowsLoading || !selectedRepoFullName}
                  >
                    <SelectTrigger className="bg-background h-9 text-xs">
                      {workflowsLoading ? (
                        <span className="flex items-center gap-1.5"><Loader2 className="size-3 animate-spin" /> Workflows...</span>
                      ) : (
                        <SelectValue placeholder="Select workflow" />
                      )}
                    </SelectTrigger>
                    <SelectContent>
                      {availableWorkflows.map((w) => (
                        <SelectItem key={w.id} value={String(w.id)}>
                          {w.name} ({w.path})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="projectManager">Project Manager *</Label>
                <Select value={projectManagerId} onValueChange={setProjectManagerId} disabled={formLoading}>
                  <SelectTrigger className="bg-background h-9 text-xs">
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
                <Label htmlFor="status">Status *</Label>
                <Select value={status} onValueChange={setStatus} disabled={formLoading}>
                  <SelectTrigger className="bg-background h-9 text-xs">
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

            <div className="space-y-2">
              <Label>Assigned Teams *</Label>
              <Input
                placeholder="Filter teams..."
                value={teamSearch}
                onChange={(e) => setTeamSearch(e.target.value)}
                className="h-8 text-xs mb-2"
                disabled={formLoading}
              />
              <div className="border hairline rounded-lg p-3 max-h-[120px] overflow-y-auto space-y-2 bg-background">
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
              <Button type="submit" disabled={formLoading} className="gap-2">
                {formLoading ? <Loader2 className="size-3.5 animate-spin" /> : null}
                {editingProject ? "Update Project" : "Create Project"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Cancel Project?"
        description={`Are you sure you want to cancel project "${projectToDelete?.name}"?`}
        confirmLabel="Cancel Project"
        loading={loading}
        onConfirm={handleDelete}
      />
    </div>
  );
}
