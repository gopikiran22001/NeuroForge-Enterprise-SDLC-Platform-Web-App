import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  GitBranch,
  Plus,
  Search,
  RefreshCw,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Key,
  ShieldCheck,
  Calendar,
  Github,
  ExternalLink,
  FolderGit2,
  Lock,
  Globe,
  Code2,
  ArrowLeft,
  Copy,
  Check,
  Star,
  GitFork,
  Eye,
  FileCode2,
  GitPullRequest,
  Tag,
  Users,
  Workflow,
  Clock,
  BookOpen,
  Scale
} from "lucide-react";
import { useSession } from "@/lib/session";
import { githubIntegrationService } from "@/services/api-services";
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
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { fmtDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/integrations")({
  head: () => ({
    meta: [
      { title: "GitHub Integration & Repositories · NeuroForge platform" },
      { name: "description", content: "Manage organization GitHub PAT connections and discover accessible repositories." },
    ],
  }),
  component: IntegrationsPage,
});

export function IntegrationsPage() {
  const { user: currentUser } = useSession();
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [validatingId, setValidatingId] = useState(null);

  // Connection Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  // Delete state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Connection Form inputs
  const [connectionName, setConnectionName] = useState("");
  const [personalAccessToken, setPersonalAccessToken] = useState("");

  // Repository Discovery view state
  const [selectedIntegration, setSelectedIntegration] = useState(null);
  const [repositories, setRepositories] = useState([]);
  const [reposLoading, setReposLoading] = useState(false);
  const [reposError, setReposError] = useState(null);
  const [repoSearch, setRepoSearch] = useState("");
  const [repoPage, setRepoPage] = useState(0);
  const [repoTotalElements, setRepoTotalElements] = useState(0);

  // Active Repository Details view state
  const [selectedRepo, setSelectedRepo] = useState(null); // Repo summary object
  const [repoDetails, setRepoDetails] = useState(null); // Full repo details from API
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  // Tab data states
  const [branches, setBranches] = useState([]);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [branchSearch, setBranchSearch] = useState("");

  const [commits, setCommits] = useState([]);
  const [commitsLoading, setCommitsLoading] = useState(false);

  const [pullRequests, setPullRequests] = useState([]);
  const [prLoading, setPrLoading] = useState(false);
  const [prStateFilter, setPrStateFilter] = useState("ALL");

  const [releases, setReleases] = useState([]);
  const [releasesLoading, setReleasesLoading] = useState(false);

  const [contributors, setContributors] = useState([]);
  const [contributorsLoading, setContributorsLoading] = useState(false);

  const [workflows, setWorkflows] = useState([]);
  const [workflowsLoading, setWorkflowsLoading] = useState(false);

  const [copiedCloneUrl, setCopiedCloneUrl] = useState(false);

  const fetchIntegrations = async () => {
    setLoading(true);
    try {
      const statusParam = statusFilter === "ALL" ? undefined : statusFilter;
      const res = await githubIntegrationService.search({
        status: statusParam,
        search: search || undefined,
        size: 100,
      });
      setIntegrations(res.content || []);
    } catch (err) {
      console.error("Failed to load GitHub integrations:", err);
      toast.error(err.message || "Failed to load GitHub integrations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();
  }, [statusFilter]);

  // Fetch repositories list for selected connection
  const fetchRepositories = async (integrationId, pageNum = 0, searchStr = "") => {
    if (!integrationId) return;
    setReposLoading(true);
    setReposError(null);
    try {
      const res = await githubIntegrationService.getRepositories(integrationId, {
        search: searchStr,
        page: pageNum,
        size: 15,
      });
      setRepositories(res.content || []);
      setRepoTotalElements(res.totalElements || 0);
    } catch (err) {
      console.error("Failed to fetch dynamic GitHub repositories:", err);
      setReposError(err.message || "Failed to retrieve repositories from GitHub REST API");
      toast.error(err.message || "Failed to retrieve repositories from GitHub");
    } finally {
      setReposLoading(false);
    }
  };

  // Fetch single repository details & active tab content
  const openRepoDetailsPage = async (repoItem) => {
    setSelectedRepo(repoItem);
    setActiveTab("overview");
    setDetailsLoading(true);
    setDetailsError(null);

    const owner = repoItem.owner || selectedIntegration.githubUsername;
    const repoName = repoItem.name;

    try {
      const details = await githubIntegrationService.getRepositoryDetails(
        selectedIntegration.id,
        owner,
        repoName
      );
      setRepoDetails(details || repoItem);
    } catch (err) {
      console.error("Error fetching repository details:", err);
      setDetailsError(err.message || "Failed to load repository details");
      setRepoDetails(repoItem);
    } finally {
      setDetailsLoading(false);
    }
  };

  // Handle Tab Switch & Lazy Load tab data
  useEffect(() => {
    if (!selectedRepo || !selectedIntegration) return;
    const owner = selectedRepo.owner || selectedIntegration.githubUsername;
    const repoName = selectedRepo.name;
    const integrationId = selectedIntegration.id;

    if (activeTab === "branches" && branches.length === 0 && !branchesLoading) {
      setBranchesLoading(true);
      githubIntegrationService
        .getBranches(integrationId, owner, repoName, { search: branchSearch })
        .then((res) => setBranches(res.content || []))
        .catch((err) => toast.error(err.message || "Failed to load branches"))
        .finally(() => setBranchesLoading(false));
    } else if (activeTab === "commits" && commits.length === 0 && !commitsLoading) {
      setCommitsLoading(true);
      githubIntegrationService
        .getCommits(integrationId, owner, repoName)
        .then((res) => setCommits(res.content || []))
        .catch((err) => toast.error(err.message || "Failed to load commits"))
        .finally(() => setCommitsLoading(false));
    } else if (activeTab === "pulls" && pullRequests.length === 0 && !prLoading) {
      setPrLoading(true);
      githubIntegrationService
        .getPullRequests(integrationId, owner, repoName, { state: prStateFilter === "ALL" ? undefined : prStateFilter })
        .then((res) => setPullRequests(res.content || []))
        .catch((err) => toast.error(err.message || "Failed to load pull requests"))
        .finally(() => setPrLoading(false));
    } else if (activeTab === "releases" && releases.length === 0 && !releasesLoading) {
      setReleasesLoading(true);
      githubIntegrationService
        .getReleases(integrationId, owner, repoName)
        .then((res) => setReleases(res.content || []))
        .catch((err) => toast.error(err.message || "Failed to load releases"))
        .finally(() => setReleasesLoading(false));
    } else if (activeTab === "contributors" && contributors.length === 0 && !contributorsLoading) {
      setContributorsLoading(true);
      githubIntegrationService
        .getContributors(integrationId, owner, repoName)
        .then((res) => setContributors(res.content || []))
        .catch((err) => toast.error(err.message || "Failed to load contributors"))
        .finally(() => setContributorsLoading(false));
    } else if (activeTab === "workflows" && workflows.length === 0 && !workflowsLoading) {
      setWorkflowsLoading(true);
      githubIntegrationService
        .getWorkflows(integrationId, owner, repoName)
        .then((res) => setWorkflows(res.content || []))
        .catch((err) => toast.error(err.message || "Failed to load workflows"))
        .finally(() => setWorkflowsLoading(false));
    }
  }, [activeTab, selectedRepo]);

  const handleBranchSearch = (e) => {
    e.preventDefault();
    if (!selectedRepo || !selectedIntegration) return;
    setBranchesLoading(true);
    const owner = selectedRepo.owner || selectedIntegration.githubUsername;
    githubIntegrationService
      .getBranches(selectedIntegration.id, owner, selectedRepo.name, { search: branchSearch })
      .then((res) => setBranches(res.content || []))
      .catch((err) => toast.error(err.message || "Failed to search branches"))
      .finally(() => setBranchesLoading(false));
  };

  const handlePrFilterChange = (val) => {
    setPrStateFilter(val);
    if (!selectedRepo || !selectedIntegration) return;
    setPrLoading(true);
    const owner = selectedRepo.owner || selectedIntegration.githubUsername;
    githubIntegrationService
      .getPullRequests(selectedIntegration.id, owner, selectedRepo.name, { state: val === "ALL" ? undefined : val })
      .then((res) => setPullRequests(res.content || []))
      .catch((err) => toast.error(err.message || "Failed to filter pull requests"))
      .finally(() => setPrLoading(false));
  };

  const openRepositoriesView = (integration) => {
    setSelectedIntegration(integration);
    setSelectedRepo(null);
    setRepoPage(0);
    setRepoSearch("");
    fetchRepositories(integration.id, 0, "");
  };

  const openCreateDialog = () => {
    setEditingItem(null);
    setConnectionName("");
    setPersonalAccessToken("");
    setDialogOpen(true);
  };

  const openEditDialog = (item) => {
    setEditingItem(item);
    setConnectionName(item.connectionName || "");
    setPersonalAccessToken("");
    setDialogOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!connectionName.trim()) {
      toast.error("Connection name is required");
      return;
    }
    if (!editingItem && !personalAccessToken.trim()) {
      toast.error("Personal Access Token is required");
      return;
    }

    setFormLoading(true);
    try {
      if (editingItem) {
        const payload = {
          connectionName: connectionName.trim(),
          personalAccessToken: personalAccessToken.trim() || undefined,
        };
        const updated = await githubIntegrationService.update(editingItem.id, payload);
        toast.success(
          updated.status === "CONNECTED"
            ? `GitHub connection updated and validated for @${updated.githubUsername || "user"}`
            : `GitHub connection updated but validation failed.`
        );
      } else {
        const payload = {
          connectionName: connectionName.trim(),
          personalAccessToken: personalAccessToken.trim(),
        };
        const created = await githubIntegrationService.create(payload);
        toast.success(
          `GitHub connection created and validated successfully for @${created.githubUsername || "user"}`
        );
      }
      setDialogOpen(false);
      fetchIntegrations();
    } catch (err) {
      console.error("Error saving GitHub connection:", err);
      toast.error(err.message || "Failed to save GitHub integration");
    } finally {
      setFormLoading(false);
    }
  };

  const handleValidate = async (item) => {
    setValidatingId(item.id);
    try {
      const res = await githubIntegrationService.validate(item.id);
      if (res.status === "CONNECTED") {
        toast.success(`PAT validation successful for @${res.githubUsername || "user"}`);
      } else {
        toast.error(`PAT validation failed for connection "${item.connectionName}"`);
      }
      fetchIntegrations();
    } catch (err) {
      console.error("Validation failed:", err);
      toast.error(err.message || "Failed to validate GitHub Personal Access Token");
    } finally {
      setValidatingId(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    setDeleteLoading(true);
    try {
      await githubIntegrationService.delete(itemToDelete.id);
      toast.success(`Deleted GitHub connection "${itemToDelete.connectionName}"`);
      setDeleteOpen(false);
      if (selectedIntegration?.id === itemToDelete.id) {
        setSelectedIntegration(null);
        setSelectedRepo(null);
      }
      setItemToDelete(null);
      fetchIntegrations();
    } catch (err) {
      console.error("Failed to delete GitHub connection:", err);
      toast.error(err.message || "Failed to delete GitHub connection");
    } finally {
      setDeleteLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedCloneUrl(true);
    toast.success("Clone URL copied to clipboard");
    setTimeout(() => setCopiedCloneUrl(false), 2000);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "CONNECTED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border bg-success/15 text-success border-success/20">
            <CheckCircle2 className="size-3" /> Connected
          </span>
        );
      case "FAILED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border bg-destructive/15 text-destructive border-destructive/20">
            <XCircle className="size-3" /> Failed
          </span>
        );
      case "DISCONNECTED":
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border bg-muted text-muted-foreground border-border/20">
            <AlertCircle className="size-3" /> Disconnected
          </span>
        );
    }
  };

  const getVisibilityBadge = (visibility) => {
    const isPublic = visibility?.toLowerCase() === "public";
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium border",
          isPublic
            ? "bg-success/10 text-success border-success/20"
            : "bg-muted text-muted-foreground border-border/40"
        )}
      >
        {isPublic ? <Globe className="size-3" /> : <Lock className="size-3" />}
        {visibility || "private"}
      </span>
    );
  };

  const getPrStateBadge = (state) => {
    const s = state?.toUpperCase();
    if (s === "OPEN") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border bg-success/15 text-success border-success/20">
          <GitPullRequest className="size-3" /> Open
        </span>
      );
    } else if (s === "MERGED") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border bg-primary-soft text-primary border-primary/20">
          <GitPullRequest className="size-3" /> Merged
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border bg-muted text-muted-foreground border-border/20">
          <GitPullRequest className="size-3" /> Closed
        </span>
      );
    }
  };

  const filteredIntegrations = integrations.filter((item) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      (item.connectionName && item.connectionName.toLowerCase().includes(s)) ||
      (item.githubUsername && item.githubUsername.toLowerCase().includes(s))
    );
  });

  const displayRepo = repoDetails || selectedRepo;

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto space-y-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 pb-6 border-b hairline">
        <div>
          <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            Integrations & SCM Providers
          </div>
          <h1 className="font-display text-3xl mt-1 flex items-center gap-2.5">
            <Github className="size-7 text-primary" /> GitHub Integration
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Securely manage GitHub Personal Access Tokens and discover accessible repositories directly via GitHub APIs.
          </p>
        </div>
        <Button onClick={openCreateDialog} className="shrink-0 gap-2">
          <Plus className="size-4" /> Connect GitHub
        </Button>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          1. REPOSITORY DETAILS PAGE (When a repository is selected)
         ───────────────────────────────────────────────────────────── */}
      {selectedRepo && selectedIntegration ? (
        <div className="space-y-6">
          {/* Back breadcrumb */}
          <div className="flex items-center justify-between border-b hairline pb-4">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={() => setSelectedRepo(null)}
              >
                <ArrowLeft className="size-3.5" /> Back to Repositories
              </Button>
              <div className="h-4 w-px bg-border hairline" />
              <div>
                <h2 className="font-display text-xl flex items-center gap-2">
                  <FolderGit2 className="size-5 text-primary" />
                  {displayRepo?.fullName || displayRepo?.name}
                </h2>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                  <Github className="size-3 text-foreground" />
                  Owner: <span className="font-mono text-foreground">{displayRepo?.owner || selectedIntegration.githubUsername}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {displayRepo?.cloneUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs gap-1.5"
                  onClick={() => copyToClipboard(displayRepo.cloneUrl)}
                >
                  {copiedCloneUrl ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
                  Clone URL
                </Button>
              )}
              {displayRepo?.repositoryUrl && (
                <a href={displayRepo.repositoryUrl} target="_blank" rel="noreferrer">
                  <Button variant="secondary" size="sm" className="h-8 text-xs gap-1.5">
                    View on GitHub <ExternalLink className="size-3.5" />
                  </Button>
                </a>
              )}
            </div>
          </div>

          {/* Quick Metrics Bar */}
          {detailsLoading ? (
            <div className="py-6 text-center text-xs text-muted-foreground flex justify-center items-center gap-2">
              <Loader2 className="size-4 animate-spin text-primary" /> Loading repository details...
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              <div className="p-3 bg-card border hairline rounded-xl space-y-1">
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Star className="size-3.5 text-warning" /> Stars
                </span>
                <p className="font-display text-lg font-semibold text-foreground">
                  {displayRepo?.stargazersCount ?? 0}
                </p>
              </div>
              <div className="p-3 bg-card border hairline rounded-xl space-y-1">
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <GitFork className="size-3.5 text-primary" /> Forks
                </span>
                <p className="font-display text-lg font-semibold text-foreground">
                  {displayRepo?.forksCount ?? 0}
                </p>
              </div>
              <div className="p-3 bg-card border hairline rounded-xl space-y-1">
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Eye className="size-3.5 text-muted-foreground" /> Watchers
                </span>
                <p className="font-display text-lg font-semibold text-foreground">
                  {displayRepo?.watchersCount ?? 0}
                </p>
              </div>
              <div className="p-3 bg-card border hairline rounded-xl space-y-1">
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <AlertCircle className="size-3.5 text-destructive" /> Open Issues
                </span>
                <p className="font-display text-lg font-semibold text-foreground">
                  {displayRepo?.openIssuesCount ?? 0}
                </p>
              </div>
              <div className="p-3 bg-card border hairline rounded-xl space-y-1">
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Code2 className="size-3.5 text-primary" /> Language
                </span>
                <p className="font-display text-sm font-semibold text-foreground truncate">
                  {displayRepo?.language || "—"}
                </p>
              </div>
              <div className="p-3 bg-card border hairline rounded-xl space-y-1">
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <GitBranch className="size-3.5 text-primary" /> Default Branch
                </span>
                <p className="font-mono text-sm font-semibold text-foreground truncate">
                  {displayRepo?.defaultBranch || "main"}
                </p>
              </div>
            </div>
          )}

          {/* Repository Multi-Tab Navigation */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="bg-card border hairline p-1 h-10 w-full justify-start overflow-x-auto gap-1">
              <TabsTrigger value="overview" className="text-xs gap-1.5">
                <BookOpen className="size-3.5" /> Overview
              </TabsTrigger>
              <TabsTrigger value="branches" className="text-xs gap-1.5">
                <GitBranch className="size-3.5" /> Branches
              </TabsTrigger>
              <TabsTrigger value="commits" className="text-xs gap-1.5">
                <Clock className="size-3.5" /> Commits
              </TabsTrigger>
              <TabsTrigger value="pulls" className="text-xs gap-1.5">
                <GitPullRequest className="size-3.5" /> Pull Requests
              </TabsTrigger>
              <TabsTrigger value="releases" className="text-xs gap-1.5">
                <Tag className="size-3.5" /> Releases
              </TabsTrigger>
              <TabsTrigger value="contributors" className="text-xs gap-1.5">
                <Users className="size-3.5" /> Contributors
              </TabsTrigger>
              <TabsTrigger value="workflows" className="text-xs gap-1.5">
                <Workflow className="size-3.5" /> Workflows
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: OVERVIEW */}
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-4">
                  <div className="p-5 bg-card border hairline rounded-xl space-y-3">
                    <h3 className="font-semibold text-sm text-foreground uppercase text-[11px] tracking-wider text-muted-foreground">
                      Repository Description
                    </h3>
                    <p className="text-xs text-foreground leading-relaxed">
                      {displayRepo?.description || "No description provided for this repository."}
                    </p>

                    {displayRepo?.topics && displayRepo.topics.length > 0 && (
                      <div className="pt-2 border-t hairline space-y-1.5">
                        <span className="text-[11px] text-muted-foreground">Topics:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {displayRepo.topics.map((t) => (
                            <span key={t} className="inline-flex items-center rounded-full bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 text-[10px] font-mono">
                              #{t}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-5 bg-card border hairline rounded-xl space-y-3">
                    <h3 className="font-semibold text-sm text-foreground uppercase text-[11px] tracking-wider text-muted-foreground">
                      Clone Repository
                    </h3>
                    <div className="flex items-center gap-2">
                      <Input
                        readOnly
                        value={displayRepo?.cloneUrl || ""}
                        className="h-9 text-xs font-mono bg-muted/30"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-9 px-3 shrink-0 gap-1.5 text-xs"
                        onClick={() => copyToClipboard(displayRepo?.cloneUrl)}
                      >
                        {copiedCloneUrl ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
                        Copy
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-5 bg-card border hairline rounded-xl space-y-3 text-xs">
                    <h3 className="font-semibold text-sm text-foreground uppercase text-[11px] tracking-wider text-muted-foreground border-b hairline pb-2">
                      Metadata
                    </h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Visibility:</span>
                        {getVisibilityBadge(displayRepo?.visibility)}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">License:</span>
                        <span className="font-medium text-foreground flex items-center gap-1">
                          <Scale className="size-3 text-muted-foreground" /> {displayRepo?.license || "None"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Created:</span>
                        <span className="text-foreground">{displayRepo?.createdAt ? fmtDate(displayRepo.createdAt) : "—"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Updated:</span>
                        <span className="text-foreground">{displayRepo?.updatedAt ? fmtDate(displayRepo.updatedAt) : "—"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Last Pushed:</span>
                        <span className="text-foreground">{displayRepo?.pushedAt ? fmtDate(displayRepo.pushedAt) : "—"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* TAB 2: BRANCHES */}
            <TabsContent value="branches" className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <form onSubmit={handleBranchSearch} className="relative flex-1 max-w-xs">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Filter branches..."
                    value={branchSearch}
                    onChange={(e) => setBranchSearch(e.target.value)}
                    className="pl-8 h-9 text-xs"
                  />
                </form>
                <div className="text-xs text-muted-foreground">{branches.length} branches discovered</div>
              </div>

              {branchesLoading ? (
                <div className="py-12 text-center text-xs text-muted-foreground flex justify-center items-center gap-2">
                  <Loader2 className="size-4 animate-spin text-primary" /> Loading branches...
                </div>
              ) : branches.length === 0 ? (
                <div className="rounded-xl border hairline bg-card p-8 text-center text-xs text-muted-foreground">
                  No branches found.
                </div>
              ) : (
                <div className="rounded-xl border hairline bg-card overflow-hidden">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b hairline text-muted-foreground bg-muted/20 uppercase text-[10px] tracking-wider">
                        <th className="py-3 px-4 font-semibold">Branch Name</th>
                        <th className="py-3 px-4 font-semibold">Status Badges</th>
                        <th className="py-3 px-4 font-semibold">Latest Commit SHA</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border hairline">
                      {branches.map((b) => (
                        <tr key={b.name} className="hover:bg-muted/30 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-medium text-foreground flex items-center gap-2">
                            <GitBranch className="size-4 text-primary shrink-0" />
                            {b.name}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5">
                              {b.defaultBranch && (
                                <span className="inline-flex items-center rounded bg-primary-soft text-primary border border-primary/20 px-2 py-0.5 text-[10px] font-semibold">
                                  Default
                                </span>
                              )}
                              {b.protectedBranch && (
                                <span className="inline-flex items-center rounded bg-warning/15 text-warning border border-warning/20 px-2 py-0.5 text-[10px] font-semibold">
                                  Protected
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-muted-foreground">
                            {b.commitSha ? (
                              <a
                                href={b.commitUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-primary hover:underline"
                              >
                                {b.commitSha.substring(0, 7)}
                              </a>
                            ) : (
                              "—"
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>

            {/* TAB 3: COMMITS */}
            <TabsContent value="commits" className="space-y-4">
              {commitsLoading ? (
                <div className="py-12 text-center text-xs text-muted-foreground flex justify-center items-center gap-2">
                  <Loader2 className="size-4 animate-spin text-primary" /> Loading commit history...
                </div>
              ) : commits.length === 0 ? (
                <div className="rounded-xl border hairline bg-card p-8 text-center text-xs text-muted-foreground">
                  No commit history available.
                </div>
              ) : (
                <div className="rounded-xl border hairline bg-card overflow-hidden">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b hairline text-muted-foreground bg-muted/20 uppercase text-[10px] tracking-wider">
                        <th className="py-3 px-4 font-semibold">Commit Message</th>
                        <th className="py-3 px-4 font-semibold">Author</th>
                        <th className="py-3 px-4 font-semibold">SHA</th>
                        <th className="py-3 px-4 font-semibold">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border hairline">
                      {commits.map((c) => (
                        <tr key={c.sha} className="hover:bg-muted/30 transition-colors">
                          <td className="py-3.5 px-4 max-w-[400px]">
                            <p className="font-medium text-foreground truncate">{c.message}</p>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              {c.authorAvatar && (
                                <img src={c.authorAvatar} alt="" className="size-5 rounded-full" />
                              )}
                              <span className="text-foreground">{c.authorName || c.committerName || "Unknown"}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-mono">
                            <a
                              href={c.commitUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary hover:underline"
                            >
                              {c.shortSha || c.sha?.substring(0, 7)}
                            </a>
                          </td>
                          <td className="py-3.5 px-4 text-muted-foreground">
                            {c.commitDate ? fmtDate(c.commitDate) : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>

            {/* TAB 4: PULL REQUESTS */}
            <TabsContent value="pulls" className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <Select value={prStateFilter} onValueChange={handlePrFilterChange}>
                  <SelectTrigger className="w-40 h-9 text-xs bg-background">
                    <SelectValue placeholder="All States" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All States</SelectItem>
                    <SelectItem value="OPEN">Open</SelectItem>
                    <SelectItem value="CLOSED">Closed</SelectItem>
                    <SelectItem value="MERGED">Merged</SelectItem>
                  </SelectContent>
                </Select>
                <div className="text-xs text-muted-foreground">{pullRequests.length} Pull Requests</div>
              </div>

              {prLoading ? (
                <div className="py-12 text-center text-xs text-muted-foreground flex justify-center items-center gap-2">
                  <Loader2 className="size-4 animate-spin text-primary" /> Loading pull requests...
                </div>
              ) : pullRequests.length === 0 ? (
                <div className="rounded-xl border hairline bg-card p-8 text-center text-xs text-muted-foreground">
                  No pull requests found.
                </div>
              ) : (
                <div className="rounded-xl border hairline bg-card overflow-hidden">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b hairline text-muted-foreground bg-muted/20 uppercase text-[10px] tracking-wider">
                        <th className="py-3 px-4 font-semibold">PR</th>
                        <th className="py-3 px-4 font-semibold">Title</th>
                        <th className="py-3 px-4 font-semibold">Author</th>
                        <th className="py-3 px-4 font-semibold">Status</th>
                        <th className="py-3 px-4 font-semibold">Created</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border hairline">
                      {pullRequests.map((pr) => (
                        <tr key={pr.number} className="hover:bg-muted/30 transition-colors">
                          <td className="py-3.5 px-4 font-mono text-muted-foreground">#{pr.number}</td>
                          <td className="py-3.5 px-4 font-medium text-foreground">
                            <a href={pr.url} target="_blank" rel="noreferrer" className="hover:underline flex items-center gap-1.5">
                              <span>{pr.title}</span>
                              <ExternalLink className="size-3 text-muted-foreground shrink-0" />
                            </a>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5">
                              {pr.authorAvatar && <img src={pr.authorAvatar} alt="" className="size-4 rounded-full" />}
                              <span className="font-mono text-muted-foreground">@{pr.author}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">{getPrStateBadge(pr.state)}</td>
                          <td className="py-3.5 px-4 text-muted-foreground">
                            {pr.createdAt ? fmtDate(pr.createdAt) : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>

            {/* TAB 5: RELEASES */}
            <TabsContent value="releases" className="space-y-4">
              {releasesLoading ? (
                <div className="py-12 text-center text-xs text-muted-foreground flex justify-center items-center gap-2">
                  <Loader2 className="size-4 animate-spin text-primary" /> Loading releases...
                </div>
              ) : releases.length === 0 ? (
                <div className="rounded-xl border hairline bg-card p-8 text-center text-xs text-muted-foreground">
                  No releases found.
                </div>
              ) : (
                <div className="space-y-3">
                  {releases.map((rel) => (
                    <div key={rel.id} className="p-4 bg-card border hairline rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded border border-primary/20">
                            {rel.version}
                          </span>
                          <h4 className="font-semibold text-foreground text-sm">{rel.name || rel.version}</h4>
                          {rel.prerelease && (
                            <span className="text-[10px] font-semibold bg-warning/15 text-warning border border-warning/20 px-2 py-0.5 rounded-full">
                              Pre-release
                            </span>
                          )}
                          {rel.draft && (
                            <span className="text-[10px] font-semibold bg-muted text-muted-foreground border border-border/40 px-2 py-0.5 rounded-full">
                              Draft
                            </span>
                          )}
                        </div>
                        <a href={rel.url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
                          GitHub Release <ExternalLink className="size-3" />
                        </a>
                      </div>
                      {rel.description && (
                        <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap pt-1">
                          {rel.description}
                        </p>
                      )}
                      <div className="text-[11px] text-muted-foreground pt-2 border-t hairline flex items-center justify-between">
                        <span>Published by @{rel.author || "user"}</span>
                        <span>{rel.publishedAt ? fmtDate(rel.publishedAt) : "—"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* TAB 6: CONTRIBUTORS */}
            <TabsContent value="contributors" className="space-y-4">
              {contributorsLoading ? (
                <div className="py-12 text-center text-xs text-muted-foreground flex justify-center items-center gap-2">
                  <Loader2 className="size-4 animate-spin text-primary" /> Loading contributors...
                </div>
              ) : contributors.length === 0 ? (
                <div className="rounded-xl border hairline bg-card p-8 text-center text-xs text-muted-foreground">
                  No contributors found.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {contributors.map((cnt) => (
                    <div key={cnt.username} className="p-4 bg-card border hairline rounded-xl flex items-center gap-3">
                      {cnt.avatarUrl ? (
                        <img src={cnt.avatarUrl} alt="" className="size-10 rounded-full" />
                      ) : (
                        <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                          {cnt.username?.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <a href={cnt.profileUrl} target="_blank" rel="noreferrer" className="font-semibold text-xs text-foreground hover:underline truncate block">
                          @{cnt.username}
                        </a>
                        <p className="text-[11px] text-muted-foreground">{cnt.contributions} contributions</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* TAB 7: WORKFLOWS */}
            <TabsContent value="workflows" className="space-y-4">
              {workflowsLoading ? (
                <div className="py-12 text-center text-xs text-muted-foreground flex justify-center items-center gap-2">
                  <Loader2 className="size-4 animate-spin text-primary" /> Discovering GitHub Actions Workflows...
                </div>
              ) : workflows.length === 0 ? (
                <div className="rounded-xl border hairline bg-card p-8 text-center text-xs text-muted-foreground">
                  No GitHub Actions workflows configured in this repository.
                </div>
              ) : (
                <div className="rounded-xl border hairline bg-card overflow-hidden">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b hairline text-muted-foreground bg-muted/20 uppercase text-[10px] tracking-wider">
                        <th className="py-3 px-4 font-semibold">Workflow Name</th>
                        <th className="py-3 px-4 font-semibold">Workflow File Path</th>
                        <th className="py-3 px-4 font-semibold">State</th>
                        <th className="py-3 px-4 font-semibold">Created</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border hairline">
                      {workflows.map((wf) => (
                        <tr key={wf.id} className="hover:bg-muted/30 transition-colors">
                          <td className="py-3.5 px-4 font-semibold text-foreground flex items-center gap-2">
                            <Workflow className="size-4 text-primary shrink-0" />
                            <a href={wf.url} target="_blank" rel="noreferrer" className="hover:underline">
                              {wf.name}
                            </a>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-muted-foreground">{wf.path}</td>
                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border bg-success/15 text-success border-success/20">
                              {wf.state || "active"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-muted-foreground">
                            {wf.createdAt ? fmtDate(wf.createdAt) : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="px-4 py-2 bg-muted/20 border-t hairline text-[11px] text-muted-foreground">
                    Workflow Discovery mode. Workflow runs, jobs, and execution logs are managed separately.
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      ) : selectedIntegration ? (
        /* ─────────────────────────────────────────────────────────────
            2. REPOSITORIES DIRECTORY VIEW (For selected integration)
           ───────────────────────────────────────────────────────────── */
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b hairline pb-4">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={() => setSelectedIntegration(null)}
              >
                <ArrowLeft className="size-3.5" /> Back to Connections
              </Button>
              <div className="h-4 w-px bg-border hairline" />
              <div>
                <h2 className="font-display text-lg flex items-center gap-2">
                  <FolderGit2 className="size-5 text-primary" />
                  {selectedIntegration.connectionName} Repositories
                </h2>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                  <Github className="size-3 text-foreground" />
                  Connected User: <span className="font-mono text-foreground">@{selectedIntegration.githubUsername || "user"}</span>
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5"
              onClick={() => fetchRepositories(selectedIntegration.id, repoPage, repoSearch)}
              disabled={reposLoading}
            >
              <RefreshCw className={cn("size-3.5", reposLoading && "animate-spin")} /> Refresh
            </Button>
          </div>

          <div className="flex items-center justify-between gap-4 flex-wrap">
            <form onSubmit={handleRepoSearchSubmit} className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                placeholder="Search accessible repositories..."
                value={repoSearch}
                onChange={(e) => setRepoSearch(e.target.value)}
                className="pl-8 h-9 text-xs"
              />
            </form>
            <div className="text-xs text-muted-foreground">
              Showing {repositories.length} of {repoTotalElements} repositories
            </div>
          </div>

          {reposLoading ? (
            <div className="py-16 text-center text-xs text-muted-foreground flex justify-center items-center gap-2">
              <Loader2 className="size-5 animate-spin text-primary" /> Retrieving repositories dynamically from GitHub REST API...
            </div>
          ) : reposError ? (
            <div className="rounded-xl border hairline bg-card p-8 text-center space-y-3">
              <div className="size-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
                <AlertCircle className="size-5" />
              </div>
              <h3 className="font-semibold text-foreground text-sm">Failed to retrieve GitHub repositories</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">{reposError}</p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => fetchRepositories(selectedIntegration.id, repoPage, repoSearch)}
                className="gap-2"
              >
                <RefreshCw className="size-3.5" /> Try Again
              </Button>
            </div>
          ) : repositories.length === 0 ? (
            <div className="rounded-xl border hairline bg-card p-12 text-center space-y-3">
              <FolderGit2 className="size-10 text-muted-foreground/50 mx-auto" />
              <h3 className="font-semibold text-foreground text-sm">No GitHub repositories found</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                No accessible repositories were returned for this Personal Access Token.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border hairline bg-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b hairline text-muted-foreground bg-muted/20 uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-4 font-semibold">Repository Name</th>
                      <th className="py-3 px-4 font-semibold">Owner</th>
                      <th className="py-3 px-4 font-semibold">Visibility</th>
                      <th className="py-3 px-4 font-semibold">Language</th>
                      <th className="py-3 px-4 font-semibold">Default Branch</th>
                      <th className="py-3 px-4 font-semibold">Updated</th>
                      <th className="py-3 px-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border hairline">
                    {repositories.map((repo) => (
                      <tr key={repo.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-foreground flex items-center gap-2">
                            <FolderGit2 className="size-4 text-primary shrink-0" />
                            <button
                              onClick={() => openRepoDetailsPage(repo)}
                              className="hover:underline flex items-center gap-1 text-left font-semibold text-foreground"
                            >
                              <span>{repo.fullName || repo.name}</span>
                            </button>
                          </div>
                          {repo.description && (
                            <p className="text-[11px] text-muted-foreground truncate max-w-[360px] mt-0.5">
                              {repo.description}
                            </p>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-foreground">
                          {repo.owner || selectedIntegration.githubUsername}
                        </td>
                        <td className="py-3.5 px-4">{getVisibilityBadge(repo.visibility)}</td>
                        <td className="py-3.5 px-4">
                          {repo.language ? (
                            <span className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-[10px] font-medium text-foreground">
                              <Code2 className="size-3 text-primary" /> {repo.language}
                            </span>
                          ) : (
                            <span className="text-muted-foreground italic text-[11px]">—</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-muted-foreground">
                          {repo.defaultBranch || "main"}
                        </td>
                        <td className="py-3.5 px-4 text-muted-foreground">
                          {repo.updatedAt ? fmtDate(repo.updatedAt) : "—"}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-primary hover:text-primary hover:bg-primary/10 font-medium"
                            onClick={() => openRepoDetailsPage(repo)}
                          >
                            View Details →
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ─────────────────────────────────────────────────────────────
            3. CONNECTIONS LISTING (Default view)
           ───────────────────────────────────────────────────────────── */
        <div className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                placeholder="Search connections or usernames..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-9 text-xs"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-44 h-9 text-xs bg-background">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="CONNECTED">Connected</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
                <SelectItem value="DISCONNECTED">Disconnected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-tight text-foreground uppercase text-[11px] tracking-wider text-muted-foreground">
              Connected GitHub Accounts ({filteredIntegrations.length})
            </h2>
          </div>

          {loading ? (
            <div className="py-16 text-center text-xs text-muted-foreground flex justify-center items-center gap-2">
              <Loader2 className="size-5 animate-spin text-primary" /> Loading GitHub connections...
            </div>
          ) : filteredIntegrations.length === 0 ? (
            <div className="rounded-xl border hairline bg-card p-12 text-center space-y-4">
              <div className="size-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                <Github className="size-6" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-base">No GitHub connections found</h3>
                <p className="mt-1 text-xs text-muted-foreground max-w-md mx-auto">
                  Connect your GitHub account to begin importing repositories.
                </p>
              </div>
              <div className="pt-2">
                <Button onClick={openCreateDialog} className="gap-2">
                  <Plus className="size-4" /> Connect GitHub
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredIntegrations.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border hairline bg-card p-5 hover:border-primary/40 transition-all shadow-sm flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-foreground truncate text-base">
                          {item.connectionName}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground">
                          <Github className="size-3.5 shrink-0 text-foreground" />
                          <span className="font-mono text-foreground font-medium truncate">
                            {item.githubUsername ? `@${item.githubUsername}` : "Unverified"}
                          </span>
                        </div>
                      </div>
                      <div className="shrink-0">{getStatusBadge(item.status)}</div>
                    </div>

                    <div className="pt-2 border-t hairline space-y-1.5 text-xs text-muted-foreground">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <Key className="size-3.5" /> Token:
                        </span>
                        <span className="font-mono text-[11px] bg-muted px-2 py-0.5 rounded text-foreground">
                          ghp_************
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <Calendar className="size-3.5" /> Connected:
                        </span>
                        <span className="text-foreground">{fmtDate(item.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t hairline space-y-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full text-xs gap-1.5"
                      onClick={() => openRepositoriesView(item)}
                    >
                      <FolderGit2 className="size-3.5 text-primary" /> Browse Repositories
                    </Button>

                    <div className="flex items-center justify-between gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs gap-1.5 flex-1"
                        onClick={() => handleValidate(item)}
                        disabled={validatingId === item.id}
                      >
                        {validatingId === item.id ? (
                          <>
                            <Loader2 className="size-3.5 animate-spin" /> Validating...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="size-3.5 text-primary" /> Validate
                          </>
                        )}
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => openEditDialog(item)}
                        title="Edit Connection"
                      >
                        <Edit2 className="size-3.5" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          setItemToDelete(item);
                          setDeleteOpen(true);
                        }}
                        title="Delete Connection"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create / Edit Connection Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md bg-card border hairline">
          <DialogHeader>
            <DialogTitle className="font-display text-xl flex items-center gap-2">
              <Github className="size-5 text-primary" />
              {editingItem ? "Edit GitHub Connection" : "Connect GitHub Account"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Provide a GitHub Personal Access Token (PAT) with repository scopes.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="connName" className="text-xs font-semibold">
                Connection Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="connName"
                placeholder="e.g. Acme Organization GitHub"
                value={connectionName}
                onChange={(e) => setConnectionName(e.target.value)}
                className="h-9 text-xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="patToken" className="text-xs font-semibold">
                Personal Access Token (PAT) {!editingItem && <span className="text-destructive">*</span>}
              </Label>
              <Input
                id="patToken"
                type="password"
                placeholder={editingItem ? "Leave empty to keep existing PAT" : "ghp_..."}
                value={personalAccessToken}
                onChange={(e) => setPersonalAccessToken(e.target.value)}
                className="h-9 text-xs font-mono"
                required={!editingItem}
              />
              <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1">
                <ShieldCheck className="size-3 text-success shrink-0" />
                Token will be encrypted before storage and never displayed in plain text.
              </p>
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
                {formLoading ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" /> Validating & Saving...
                  </>
                ) : (
                  editingItem ? "Update Connection" : "Connect & Validate"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete GitHub Connection?"
        description={`Are you sure you want to delete "${itemToDelete?.connectionName}"? This action cannot be undone.`}
        confirmLabel="Delete Connection"
        loading={deleteLoading}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
