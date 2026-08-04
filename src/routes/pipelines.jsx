import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Workflow,
  Play,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Plus,
  Terminal,
  Copy,
  Loader2,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { pipelineService, buildService, projectService } from "@/services/api-services";
import { useSession } from "@/lib/session";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/pipelines")({
  head: () => ({
    meta: [
      { title: "Pipelines & Builds · NeuroForge Nexus" },
      { name: "description", content: "CI/CD automated build pipelines, GitHub Actions workflows, and execution logs." },
    ],
  }),
  component: PipelinesPage,
});

export function PipelinesPage() {
  const { user: currentUser } = useSession();
  const [pipelines, setPipelines] = useState([]);
  const [builds, setBuilds] = useState([]);
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, disabled: 0 });
  const [buildStats, setBuildStats] = useState({ totalBuilds: 0, successfulBuilds: 0, failedBuilds: 0, successRate: 0 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedPipelineId, setSelectedPipelineId] = useState("ALL");

  // Create Pipeline Dialog State
  const [createOpen, setCreateOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [name, setName] = useState("");
  const [projectId, setProjectId] = useState("");
  const [provider, setProvider] = useState("GITHUB_ACTIONS");
  const [branch, setBranch] = useState("main");
  const [status, setStatus] = useState("ACTIVE");
  const [description, setDescription] = useState("");

  // Log Viewer Dialog State
  const [logsOpen, setLogsOpen] = useState(false);
  const [logsLoading, setLogsLoading] = useState(false);
  const [selectedBuild, setSelectedBuild] = useState(null);
  const [buildLogs, setBuildLogs] = useState("");

  const canManage = currentUser?.role === "admin" || currentUser?.role === "devops" || currentUser?.role === "pm" || currentUser?.role === "super_admin";

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pipRes, buildsRes, projRes, pStatsRes, bStatsRes] = await Promise.all([
        pipelineService.search({
          status: statusFilter !== "ALL" ? statusFilter : undefined,
          size: 100,
        }).catch(() => ({ content: [] })),
        buildService.search({
          pipelineId: selectedPipelineId !== "ALL" ? selectedPipelineId : undefined,
          size: 100,
        }).catch(() => ({ content: [] })),
        projectService.search({ size: 100 }).catch(() => ({ content: [] })),
        pipelineService.getStats().catch(() => ({ total: 0, active: 0, disabled: 0 })),
        buildService.getStats().catch(() => ({ totalBuilds: 0, successfulBuilds: 0, failedBuilds: 0, successRate: 0 })),
      ]);

      setPipelines(pipRes.content || []);
      setBuilds(buildsRes.content || []);
      setProjects(projRes.content || []);
      setStats(pStatsRes || { total: 0, active: 0, disabled: 0 });
      setBuildStats(bStatsRes || { totalBuilds: 0, successfulBuilds: 0, failedBuilds: 0, successRate: 0 });
    } catch (err) {
      console.error("Failed to load pipelines data:", err);
      toast.error("Failed to load pipelines and builds");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter, selectedPipelineId]);

  const handleCreatePipeline = async (e) => {
    e.preventDefault();
    if (!name || !projectId || !branch) {
      toast.error("Pipeline name, project, and branch are required.");
      return;
    }

    setFormLoading(true);
    try {
      await pipelineService.create({
        name,
        projectId,
        provider,
        branch,
        status,
        description,
      });
      toast.success("Pipeline created successfully");
      setCreateOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.message || "Failed to create pipeline");
    } finally {
      setFormLoading(false);
    }
  };

  const handleViewLogs = async (b) => {
    setSelectedBuild(b);
    setLogsOpen(true);
    setLogsLoading(true);
    try {
      const logs = await buildService.getLogs(b.id);
      setBuildLogs(logs || "No log content returned.");
    } catch (err) {
      toast.error(err.message || "Failed to retrieve build logs");
      setBuildLogs("Error retrieving log output.");
    } finally {
      setLogsLoading(false);
    }
  };

  const filteredBuilds = builds.filter((b) => {
    const searchLower = search.toLowerCase();
    const matchesSearch =
      (b.pipelineName && b.pipelineName.toLowerCase().includes(searchLower)) ||
      (b.commitHash && b.commitHash.toLowerCase().includes(searchLower)) ||
      (b.commitMessage && b.commitMessage.toLowerCase().includes(searchLower)) ||
      (b.author && b.author.toLowerCase().includes(searchLower));
    return matchesSearch;
  });

  const getStatusIcon = (st) => {
    switch (st) {
      case "SUCCESS":
        return <CheckCircle2 className="size-4 text-success" />;
      case "FAILED":
        return <XCircle className="size-4 text-destructive" />;
      case "RUNNING":
        return <RefreshCw className="size-4 text-primary animate-spin" />;
      default:
        return <AlertCircle className="size-4 text-warning" />;
    }
  };

  const getStatusBadge = (st) => {
    switch (st) {
      case "SUCCESS":
        return "bg-success/15 text-success border-success/20";
      case "FAILED":
        return "bg-destructive/15 text-destructive border-destructive/20";
      case "RUNNING":
        return "bg-primary-soft text-primary border-primary/20";
      default:
        return "bg-warning/15 text-warning border-warning/20";
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto space-y-6">
      <header className="flex items-end justify-between gap-4 pb-6 border-b hairline">
        <div>
          <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            Continuous Integration & Delivery
          </div>
          <h1 className="font-display text-3xl mt-1 flex items-center gap-2">
            <Workflow className="size-6 text-primary" /> Pipelines & Builds
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Monitor GitHub Actions automated build workflows, trigger dispatches, and inspect execution logs.
          </p>
        </div>
        {canManage && (
          <Button size="sm" onClick={() => { setProjectId(projects[0]?.id || ""); setCreateOpen(true); }}>
            <Plus className="size-3.5 mr-1" /> New Pipeline
          </Button>
        )}
      </header>

      {/* KPI Stats Panel */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border hairline bg-card p-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Success Rate</div>
          <div className="text-2xl font-bold mt-1 text-success font-display">
            {buildStats.successRate != null ? buildStats.successRate : 0}%
          </div>
        </div>
        <div className="rounded-xl border hairline bg-card p-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Pipelines</div>
          <div className="text-2xl font-bold mt-1 text-primary font-display">{stats.total || pipelines.length}</div>
        </div>
        <div className="rounded-xl border hairline bg-card p-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Running Jobs</div>
          <div className="text-2xl font-bold mt-1 font-display">
            {builds.filter((b) => b.status === "RUNNING").length}
          </div>
        </div>
        <div className="rounded-xl border hairline bg-card p-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Builds Recorded</div>
          <div className="text-2xl font-bold mt-1 font-display">{buildStats.totalBuilds || builds.length}</div>
        </div>
      </div>

      {/* Active Pipelines Cards */}
      <div className="space-y-3">
        <h3 className="font-display text-base font-semibold text-foreground">Configured Workflows</h3>
        {pipelines.length === 0 ? (
          <div className="rounded-xl border hairline bg-card p-6 text-center text-xs text-muted-foreground">
            No pipelines configured yet. Click 'New Pipeline' to configure a build pipeline.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pipelines.map((pip) => (
              <div key={pip.id} className="rounded-xl border hairline bg-card p-4 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                        {pip.name}
                        <span className="text-[10px] font-mono bg-muted/60 px-1.5 py-0.5 rounded text-muted-foreground">
                          {pip.projectCode || "PROJ"}
                        </span>
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                        Target Branch: {pip.branch}
                      </p>
                    </div>
                    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border", getStatusBadge(pip.lastRunStatus || "NEVER_RUN"))}>
                      {pip.lastRunStatus || "NEVER_RUN"}
                    </span>
                  </div>
                  {pip.description && (
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{pip.description}</p>
                  )}
                </div>

                <div className="pt-3 border-t border-border/10 flex items-center justify-between gap-2 text-xs">
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-primary-soft text-primary font-mono text-[10px] font-semibold">
                    {pip.provider || "GITHUB_ACTIONS"}
                  </div>
                  <span className="text-[10px] uppercase font-mono text-muted-foreground">
                    Status: <span className={pip.status === "ACTIVE" ? "text-success font-semibold" : "text-muted-foreground"}>{pip.status}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Build Execution History Header & Toolbar */}
      <div className="pt-4 border-t hairline space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="font-display text-base font-semibold text-foreground">Build Execution History</h3>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative w-60">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                placeholder="Search builds..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-9 text-xs"
              />
            </div>

            <Select value={selectedPipelineId} onValueChange={setSelectedPipelineId}>
              <SelectTrigger className="w-48 h-9 text-xs bg-background">
                <SelectValue placeholder="Pipeline" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Pipelines</SelectItem>
                {pipelines.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Runs Table */}
        <div className="rounded-xl border hairline bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px] text-left">
              <thead>
                <tr className="border-b hairline text-muted-foreground uppercase text-[10px] tracking-wider bg-surface/50">
                  <th className="py-3 px-4">Build #</th>
                  <th className="py-3 px-3">Pipeline</th>
                  <th className="py-3 px-3">Branch / Commit</th>
                  <th className="py-3 px-3">Author</th>
                  <th className="py-3 px-3">Duration</th>
                  <th className="py-3 px-3">Started</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 pr-4 pl-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-muted-foreground">
                      <Loader2 className="size-5 animate-spin mx-auto mb-2 text-primary" /> Loading build execution history...
                    </td>
                  </tr>
                ) : filteredBuilds.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-muted-foreground text-xs">
                      No build executions recorded. Click 'Sync' on a pipeline to pull GitHub Actions run history.
                    </td>
                  </tr>
                ) : (
                  filteredBuilds.map((b) => (
                    <tr key={b.id} className="hover:bg-accent/20 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-foreground">#{b.buildNumber}</td>
                      <td className="py-3 px-3 font-semibold text-foreground">{b.pipelineName || "Pipeline"}</td>
                      <td className="py-3 px-3">
                        <span className="font-mono text-muted-foreground">{b.branch || "main"}</span>
                        <span className="text-[11px] text-muted-foreground ml-1.5 font-mono">@{b.commitHash ? b.commitHash.substring(0, 7) : "head"}</span>
                      </td>
                      <td className="py-3 px-3 text-muted-foreground">@{b.author || "github-actions"}</td>
                      <td className="py-3 px-3 font-mono text-muted-foreground flex items-center gap-1">
                        <Clock className="size-3.5" /> {b.duration ? `${b.duration}s` : "N/A"}
                      </td>
                      <td className="py-3 px-3 text-muted-foreground">
                        {b.startedAt ? new Date(b.startedAt).toLocaleTimeString() : "-"}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border", getStatusBadge(b.status))}>
                          {getStatusIcon(b.status)}
                          {b.status}
                        </span>
                      </td>
                      <td className="py-3 pr-4 pl-3 text-right">
                        <Button variant="ghost" size="xs" onClick={() => handleViewLogs(b)}>
                          <Terminal className="size-3.5 mr-1" /> View Logs
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Pipeline Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md bg-card border hairline">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">New Pipeline</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreatePipeline} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="pipName">Pipeline Name</Label>
              <Input
                id="pipName"
                placeholder="e.g. core-backend-ci"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={formLoading}
              />
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
                      {p.name} ({p.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="provider">CI/CD Provider</Label>
              <Select value={provider} onValueChange={setProvider} disabled={formLoading}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GITHUB_ACTIONS">GitHub Actions</SelectItem>
                  <SelectItem value="JENKINS">Jenkins</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="branch">Target Branch</Label>
                <Input
                  id="branch"
                  placeholder="main"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  required
                  disabled={formLoading}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={setStatus} disabled={formLoading}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                    <SelectItem value="DISABLED">DISABLED</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="desc">Description</Label>
              <Input
                id="desc"
                placeholder="Brief workflow purpose"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={formLoading}
              />
            </div>

            <DialogFooter className="pt-4 border-t hairline mt-4">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)} disabled={formLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={formLoading}>
                {formLoading ? <Loader2 className="size-3.5 animate-spin ml-1" /> : "Create Pipeline"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Build Logs Viewer Dialog */}
      <Dialog open={logsOpen} onOpenChange={setLogsOpen}>
        <DialogContent className="max-w-3xl bg-card border hairline max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="font-display text-lg flex items-center justify-between pr-6">
              <span className="flex items-center gap-2">
                <Terminal className="size-5 text-primary" /> Build Logs #{selectedBuild?.buildNumber}
              </span>
              <Button
                variant="outline"
                size="xs"
                onClick={() => {
                  navigator.clipboard.writeText(buildLogs);
                  toast.success("Logs copied to clipboard!");
                }}
              >
                <Copy className="size-3 mr-1" /> Copy Logs
              </Button>
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto bg-black/90 border border-white/10 rounded-lg p-4 font-mono text-xs text-green-400 leading-relaxed min-h-[300px]">
            {logsLoading ? (
              <div className="py-16 text-center text-muted-foreground flex justify-center items-center gap-2">
                <Loader2 className="size-5 animate-spin text-primary" /> Loading build log output...
              </div>
            ) : (
              <pre className="whitespace-pre-wrap break-all">{buildLogs}</pre>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
