import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Workflow,
  Plus,
  Search,
  Filter,
  Loader2,
  Edit2,
  Trash2,
  Github,
  GitBranch,
  FileCode2,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  Terminal,
  Copy,
  Download,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  GitCommit,
  User,
  Activity,
  BarChart2,
  Layers,
  ArrowLeft,
  Check,
  Play,
  PlayCircle
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
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { pipelineService, projectService, githubIntegrationService } from "@/services/api-services";
import { useSession } from "@/lib/session";
import { toast } from "sonner";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { fmtDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/pipelines")({
  head: () => ({
    meta: [
      { title: "Pipelines & Actions Monitoring · NeuroForge Platform" },
      { name: "description", content: "GitHub Actions workflow pipeline monitoring, jobs, steps, and log viewer." },
    ],
  }),
  component: PipelinesPage,
});

export function PipelinesPage() {
  const { user: currentUser } = useSession();
  const [pipelines, setPipelines] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters for Pipeline list
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [projectFilter, setProjectFilter] = useState("ALL");

  // Create & Edit Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPipeline, setEditingPipeline] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  // Form Fields
  const [name, setName] = useState("");
  const [projectId, setProjectId] = useState("");
  const [provider, setProvider] = useState("GITHUB_ACTIONS");
  const [branch, setBranch] = useState("main");
  const [status, setStatus] = useState("ACTIVE");
  const [description, setDescription] = useState("");

  // Workflow Selection State
  const [availableWorkflows, setAvailableWorkflows] = useState([]);
  const [workflowsLoading, setWorkflowsLoading] = useState(false);
  const [selectedWorkflowIdStr, setSelectedWorkflowIdStr] = useState("");
  const [workflowName, setWorkflowName] = useState("");
  const [workflowFile, setWorkflowFile] = useState("");

  // Detailed Pipeline Monitoring View State
  const [selectedPipeline, setSelectedPipeline] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [monitoringStats, setMonitoringStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Workflow Runs Tab State
  const [workflowRuns, setWorkflowRuns] = useState([]);
  const [runsLoading, setRunsLoading] = useState(false);
  const [runBranchFilter, setRunBranchFilter] = useState("");
  const [runStatusFilter, setRunStatusFilter] = useState("ALL");

  // Selected Workflow Run Details & Jobs
  const [selectedRun, setSelectedRun] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [expandedJobId, setExpandedJobId] = useState(null);

  // Logs Viewer State
  const [logsContent, setLogsContent] = useState("");
  const [logsLoading, setLogsLoading] = useState(false);
  const [logSearch, setLogSearch] = useState("");
  const [copiedLogs, setCopiedLogs] = useState(false);

  // Delete State
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pipelineToDelete, setPipelineToDelete] = useState(null);

  // Commit History & Trigger State
  const [commits, setCommits] = useState([]);
  const [commitsLoading, setCommitsLoading] = useState(false);
  const [triggerLoadingId, setTriggerLoadingId] = useState(null);
  const [triggerDialogOpen, setTriggerDialogOpen] = useState(false);
  const [selectedCommitForTrigger, setSelectedCommitForTrigger] = useState(null);
  const [customCommitSha, setCustomCommitSha] = useState("");
  const [customCommitMsg, setCustomCommitMsg] = useState("");

  const canManage = currentUser?.role === "admin" || currentUser?.role === "devops" || currentUser?.role === "pm" || currentUser?.role === "super_admin";

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pipRes, projRes] = await Promise.all([
        pipelineService.search({
          status: statusFilter !== "ALL" ? statusFilter : undefined,
          projectId: projectFilter !== "ALL" ? projectFilter : undefined,
          size: 100,
        }).catch(() => ({ content: [] })),
        projectService.search({ size: 100 }).catch(() => ({ content: [] })),
      ]);

      setPipelines(pipRes.content || []);
      setProjects(projRes.content || []);
    } catch (err) {
      console.error("Failed to load pipelines data:", err);
      toast.error("Failed to load pipelines");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter, projectFilter]);

  // Open Detailed Monitoring View for selected pipeline
  const openPipelineMonitoring = async (pip) => {
    setSelectedPipeline(pip);
    setSelectedRun(null);
    setJobs([]);
    setLogsContent("");
    setCommits([]);
    setActiveTab("overview");
    setStatsLoading(true);

    fetchCommits(pip);

    try {
      const statsRes = await pipelineService.getMonitoringStats(pip.id);
      setMonitoringStats(statsRes || null);
    } catch (err) {
      console.error("Error loading monitoring stats:", err);
      toast.error("Failed to load pipeline monitoring stats");
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchCommits = async (pip) => {
    if (!pip) return;
    const projObj = projects.find((p) => p.id === pip.projectId);
    if (!projObj || !projObj.githubIntegrationId || !projObj.repositoryOwner || !projObj.repositoryName) return;

    setCommitsLoading(true);
    try {
      const res = await githubIntegrationService.getCommits(
        projObj.githubIntegrationId,
        projObj.repositoryOwner,
        projObj.repositoryName,
        { page: 0, size: 50 }
      );
      setCommits(res.content || []);
    } catch (err) {
      console.error("Failed to load repository commits:", err);
    } finally {
      setCommitsLoading(false);
    }
  };

  const handleTriggerPipelineForCommit = async (commitObj) => {
    if (!selectedPipeline) return;
    const commitSha = commitObj?.sha || commitObj?.id || customCommitSha || "";
    const commitMsg = commitObj?.commit?.message || commitObj?.message || customCommitMsg || "Manual workflow execution trigger";

    setTriggerLoadingId(commitSha || "manual");
    try {
      await pipelineService.trigger(selectedPipeline.id, {
        commitHash: commitSha,
        commitMessage: commitMsg,
        branch: selectedPipeline.branch,
      });

      toast.success(
        `Pipeline triggered for commit ${commitSha ? commitSha.substring(0, 7) : selectedPipeline.branch}!`,
        { description: `Triggered execution build on branch ${selectedPipeline.branch}.` }
      );

      setTriggerDialogOpen(false);
      setSelectedCommitForTrigger(null);
      setCustomCommitSha("");
      setCustomCommitMsg("");

      // Refresh monitoring stats & workflow runs
      fetchWorkflowRuns(selectedPipeline.id);
      openPipelineMonitoring(selectedPipeline);
      setActiveTab("runs");
    } catch (err) {
      toast.error(err.message || "Failed to trigger pipeline execution");
    } finally {
      setTriggerLoadingId(null);
    }
  };

  // Lazy-load Tab Data
  useEffect(() => {
    if (!selectedPipeline) return;

    if (activeTab === "runs" && workflowRuns.length === 0 && !runsLoading) {
      fetchWorkflowRuns(selectedPipeline.id);
    } else if (activeTab === "commits" && commits.length === 0 && !commitsLoading) {
      fetchCommits(selectedPipeline);
    } else if (activeTab === "jobs" && selectedRun && jobs.length === 0 && !jobsLoading) {
      fetchJobs(selectedPipeline.id, selectedRun.id);
    } else if (activeTab === "logs" && selectedRun && !logsContent && !logsLoading) {
      fetchLogs(selectedPipeline.id, selectedRun.id);
    }
  }, [activeTab, selectedPipeline, selectedRun]);

  const fetchWorkflowRuns = async (pipelineId) => {
    setRunsLoading(true);
    try {
      const res = await pipelineService.getWorkflowRuns(pipelineId, {
        branch: runBranchFilter || undefined,
        status: runStatusFilter !== "ALL" ? runStatusFilter : undefined,
        size: 50,
      });
      const content = res.content || [];
      setWorkflowRuns(content);
      if (content.length > 0 && !selectedRun) {
        setSelectedRun(content[0]);
      }
    } catch (err) {
      console.error("Failed to load workflow runs:", err);
      toast.error("Failed to retrieve GitHub Actions workflow runs");
    } finally {
      setRunsLoading(false);
    }
  };

  const fetchJobs = async (pipelineId, runId) => {
    setJobsLoading(true);
    try {
      const res = await pipelineService.getWorkflowRunJobs(pipelineId, runId);
      setJobs(res || []);
    } catch (err) {
      console.error("Failed to load run jobs:", err);
      toast.error("Failed to load workflow run jobs");
    } finally {
      setJobsLoading(false);
    }
  };

  const fetchLogs = async (pipelineId, runId) => {
    setLogsLoading(true);
    try {
      const res = await pipelineService.getWorkflowRunLogs(pipelineId, runId);
      setLogsContent(res || "No log contents received.");
    } catch (err) {
      console.error("Failed to load workflow logs:", err);
      toast.error("Failed to retrieve workflow logs");
      setLogsContent("Error loading logs from GitHub REST API.");
    } finally {
      setLogsLoading(false);
    }
  };

  const handleSelectRunForJobsOrLogs = (run, targetTab) => {
    setSelectedRun(run);
    setJobs([]);
    setLogsContent("");
    setActiveTab(targetTab);
  };

  const handleProjectSelect = async (selectedProjId) => {
    setProjectId(selectedProjId);
    setSelectedWorkflowIdStr("");
    setAvailableWorkflows([]);
    setWorkflowName("");
    setWorkflowFile("");

    const projObj = projects.find((p) => p.id === selectedProjId);
    if (!projObj) return;

    if (projObj.defaultBranch) {
      setBranch(projObj.defaultBranch);
    }

    if (projObj.githubIntegrationId && projObj.repositoryOwner && projObj.repositoryName) {
      setWorkflowsLoading(true);
      try {
        const wfRes = await githubIntegrationService.getWorkflows(
          projObj.githubIntegrationId,
          projObj.repositoryOwner,
          projObj.repositoryName
        );
        const wList = wfRes.content || [];
        setAvailableWorkflows(wList);

        if (projObj.workflowId) {
          setSelectedWorkflowIdStr(String(projObj.workflowId));
          setWorkflowName(projObj.workflowName || "");
          setWorkflowFile(projObj.workflowFile || "");
        } else if (wList.length > 0) {
          setSelectedWorkflowIdStr(String(wList[0].id));
          setWorkflowName(wList[0].name);
          setWorkflowFile(wList[0].path);
        }
      } catch (err) {
        console.error("Error loading project workflows:", err);
      } finally {
        setWorkflowsLoading(false);
      }
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
    setEditingPipeline(null);
    setName("");
    setProvider("GITHUB_ACTIONS");
    setBranch("main");
    setStatus("ACTIVE");
    setDescription("");
    setSelectedWorkflowIdStr("");
    setWorkflowName("");
    setWorkflowFile("");

    const defaultProj = projects[0]?.id || "";
    setProjectId(defaultProj);
    if (defaultProj) {
      handleProjectSelect(defaultProj);
    }
    setDialogOpen(true);
  };

  const handleOpenEdit = async (pip) => {
    setEditingPipeline(pip);
    setName(pip.name);
    setProjectId(pip.projectId);
    setProvider(pip.provider || "GITHUB_ACTIONS");
    setBranch(pip.branch || "main");
    setStatus(pip.status || "ACTIVE");
    setDescription(pip.description || "");
    setSelectedWorkflowIdStr(pip.workflowId ? String(pip.workflowId) : "");
    setWorkflowName(pip.workflowName || "");
    setWorkflowFile(pip.workflowFile || "");

    const projObj = projects.find((p) => p.id === pip.projectId);
    if (projObj && projObj.githubIntegrationId && projObj.repositoryOwner && projObj.repositoryName) {
      setWorkflowsLoading(true);
      try {
        const wfRes = await githubIntegrationService.getWorkflows(
          projObj.githubIntegrationId,
          projObj.repositoryOwner,
          projObj.repositoryName
        );
        setAvailableWorkflows(wfRes.content || []);
      } catch (err) {
        console.error("Failed to load workflows for edit:", err);
      } finally {
        setWorkflowsLoading(false);
      }
    }

    setDialogOpen(true);
  };

  const handleSavePipeline = async (e) => {
    e.preventDefault();
    if (!name.trim() || !projectId || !branch.trim()) {
      toast.error("Pipeline name, project, and branch are required.");
      return;
    }

    setFormLoading(true);
    try {
      const payload = {
        name: name.trim(),
        projectId,
        provider: "GITHUB_ACTIONS",
        branch: branch.trim(),
        status,
        description: description.trim() || undefined,
        workflowId: selectedWorkflowIdStr ? parseInt(selectedWorkflowIdStr, 10) : undefined,
        workflowName: workflowName || undefined,
        workflowFile: workflowFile || undefined,
      };

      if (editingPipeline) {
        await pipelineService.update(editingPipeline.id, payload);
        toast.success("Pipeline updated successfully");
      } else {
        await pipelineService.create(payload);
        toast.success("Pipeline configuration created successfully");
      }

      setDialogOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.message || "Failed to save pipeline configuration");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!pipelineToDelete) return;
    try {
      await pipelineService.delete(pipelineToDelete.id);
      toast.success(`Pipeline "${pipelineToDelete.name}" disabled`);
      setDeleteOpen(false);
      if (selectedPipeline?.id === pipelineToDelete.id) {
        setSelectedPipeline(null);
      }
      setPipelineToDelete(null);
      fetchData();
    } catch (err) {
      toast.error(err.message || "Failed to delete pipeline");
    }
  };

  const copyLogsToClipboard = () => {
    if (!logsContent) return;
    navigator.clipboard.writeText(logsContent);
    setCopiedLogs(true);
    toast.success("Logs copied to clipboard");
    setTimeout(() => setCopiedLogs(false), 2000);
  };

  const downloadLogsFile = () => {
    if (!logsContent) return;
    const blob = new Blob([logsContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `workflow-run-${selectedRun?.runNumber || "logs"}.log`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Logs downloaded");
  };

  const getConclusionBadge = (conclusion, status) => {
    const c = (conclusion || status || "unknown").toLowerCase();
    if (c === "success") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold border bg-success/15 text-success border-success/20">
          <CheckCircle2 className="size-3" /> Success
        </span>
      );
    } else if (c === "failure" || c === "failed") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold border bg-destructive/15 text-destructive border-destructive/20">
          <XCircle className="size-3" /> Failed
        </span>
      );
    } else if (c === "in_progress" || c === "queued" || c === "waiting") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold border bg-primary-soft text-primary border-primary/20">
          <RefreshCw className="size-3 animate-spin" /> {c}
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold border bg-muted text-muted-foreground border-border/40">
          <AlertCircle className="size-3" /> {c}
        </span>
      );
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds || seconds <= 0) return "—";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const filteredLogsLines = logsContent
    ? logsContent.split("\n").filter((line) => !logSearch || line.toLowerCase().includes(logSearch.toLowerCase()))
    : [];

  const filteredPipelines = pipelines.filter((p) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(s) ||
      (p.projectCode && p.projectCode.toLowerCase().includes(s)) ||
      (p.repositoryFullName && p.repositoryFullName.toLowerCase().includes(s)) ||
      (p.workflowName && p.workflowName.toLowerCase().includes(s))
    );
  });

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto space-y-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 pb-6 border-b hairline">
        <div>
          <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            Continuous Integration & Actions Monitoring
          </div>
          <h1 className="font-display text-3xl mt-1 flex items-center gap-2.5">
            <Workflow className="size-7 text-primary" /> GitHub Actions Pipelines
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Monitor, visualize, and inspect GitHub Actions workflow runs, jobs, steps, and execution logs in real time.
          </p>
        </div>
        {canManage && (
          <Button onClick={handleOpenCreate} className="shrink-0 gap-2">
            <Plus className="size-4" /> New Pipeline
          </Button>
        )}
      </header>

      {selectedPipeline ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b hairline pb-4">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={() => setSelectedPipeline(null)}
              >
                <ArrowLeft className="size-3.5" /> Back to Pipelines
              </Button>
              <div className="h-4 w-px bg-border hairline" />
              <div>
                <h2 className="font-display text-xl flex items-center gap-2">
                  <Workflow className="size-5 text-primary" />
                  {selectedPipeline.name}
                </h2>
                <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                  <Github className="size-3 text-foreground" />
                  Repository: <span className="font-mono text-foreground font-semibold">{selectedPipeline.repositoryFullName || "GitHub Repository"}</span>
                  <span className="text-border">•</span>
                  <GitBranch className="size-3 text-primary" /> Branch: <span className="font-mono text-foreground">{selectedPipeline.branch}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5"
                onClick={() => openPipelineMonitoring(selectedPipeline)}
                disabled={statsLoading}
              >
                <RefreshCw className={cn("size-3.5", statsLoading && "animate-spin")} /> Refresh
              </Button>
              <Button
                size="sm"
                className="h-8 text-xs gap-1.5 bg-primary text-primary-foreground"
                onClick={() => setTriggerDialogOpen(true)}
              >
                <Play className="size-3.5" /> Trigger Pipeline
              </Button>
            </div>
          </div>

          {/* Quick Metrics Header Bar */}
          {statsLoading ? (
            <div className="py-6 text-center text-xs text-muted-foreground flex justify-center items-center gap-2">
              <Loader2 className="size-4 animate-spin text-primary" /> Loading pipeline monitoring metrics...
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 bg-card border hairline rounded-xl space-y-1">
                <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                  <BarChart2 className="size-3.5 text-primary" /> Success Rate
                </span>
                <p className="font-display text-2xl font-semibold text-success">
                  {monitoringStats?.successRate != null ? `${monitoringStats.successRate}%` : "—"}
                </p>
              </div>
              <div className="p-4 bg-card border hairline rounded-xl space-y-1">
                <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                  <Activity className="size-3.5 text-primary" /> Total Workflow Runs
                </span>
                <p className="font-display text-2xl font-semibold text-foreground">
                  {monitoringStats?.totalRuns ?? 0}
                </p>
              </div>
              <div className="p-4 bg-card border hairline rounded-xl space-y-1">
                <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                  <Clock className="size-3.5 text-muted-foreground" /> Average Duration
                </span>
                <p className="font-display text-2xl font-semibold text-foreground">
                  {formatDuration(monitoringStats?.averageDurationSeconds)}
                </p>
              </div>
              <div className="p-4 bg-card border hairline rounded-xl space-y-1">
                <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="size-3.5 text-success" /> Latest Status
                </span>
                <div className="pt-0.5">
                  {getConclusionBadge(monitoringStats?.latestStatus)}
                </div>
              </div>
            </div>
          )}

          {/* Multi-Tab Pipeline Monitoring View */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="bg-card border hairline p-1 h-10 w-full justify-start overflow-x-auto gap-1">
              <TabsTrigger value="overview" className="text-xs gap-1.5">
                <Activity className="size-3.5" /> Overview
              </TabsTrigger>
              <TabsTrigger value="commits" className="text-xs gap-1.5">
                <GitCommit className="size-3.5" /> Commit History ({commits.length})
              </TabsTrigger>
              <TabsTrigger value="runs" className="text-xs gap-1.5">
                <Workflow className="size-3.5" /> Workflow Runs ({workflowRuns.length})
              </TabsTrigger>
              <TabsTrigger value="jobs" className="text-xs gap-1.5" disabled={!selectedRun}>
                <Layers className="size-3.5" /> Jobs & Steps {selectedRun ? `(#${selectedRun.runNumber})` : ""}
              </TabsTrigger>
              <TabsTrigger value="logs" className="text-xs gap-1.5" disabled={!selectedRun}>
                <Terminal className="size-3.5" /> Logs Viewer {selectedRun ? `(#${selectedRun.runNumber})` : ""}
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: OVERVIEW */}
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-4">
                  <div className="p-5 bg-card border hairline rounded-xl space-y-3">
                    <h3 className="font-semibold text-xs text-foreground uppercase tracking-wider text-muted-foreground border-b hairline pb-2">
                      Recent Workflow Runs
                    </h3>
                    {monitoringStats?.recentRuns && monitoringStats.recentRuns.length > 0 ? (
                      <div className="space-y-2">
                        {monitoringStats.recentRuns.map((r) => (
                          <div key={r.id} className="p-3 bg-muted/20 border hairline rounded-lg flex items-center justify-between text-xs">
                            <div className="flex items-center gap-3">
                              {getConclusionBadge(r.conclusion, r.status)}
                              <div>
                                <div className="font-semibold text-foreground flex items-center gap-2">
                                  <span>Run #{r.runNumber}</span>
                                  <span className="font-mono text-muted-foreground text-[11px]">{r.headCommitMessage || r.name}</span>
                                </div>
                                <div className="text-[11px] text-muted-foreground flex items-center gap-2 mt-0.5">
                                  <span>Branch: <span className="font-mono text-foreground">{r.headBranch}</span></span>
                                  <span>•</span>
                                  <span>By @{r.actorLogin || "user"}</span>
                                </div>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => handleSelectRunForJobsOrLogs(r, "jobs")}
                            >
                              View Jobs →
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-6 text-center text-xs text-muted-foreground italic">
                        No workflow runs recorded for this pipeline yet.
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-5 bg-card border hairline rounded-xl space-y-3 text-xs">
                    <h3 className="font-semibold text-xs text-foreground uppercase tracking-wider text-muted-foreground border-b hairline pb-2">
                      Pipeline Configuration
                    </h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Workflow Name:</span>
                        <span className="font-semibold text-foreground">{selectedPipeline.workflowName || "Default Workflow"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Workflow File:</span>
                        <span className="font-mono text-muted-foreground text-[11px]">{selectedPipeline.workflowFile || ".github/workflows/..."}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Provider:</span>
                        <span className="font-semibold text-primary">GITHUB_ACTIONS</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        <span className="font-semibold text-success">{selectedPipeline.status}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* TAB: COMMIT HISTORY & TRIGGER */}
            <TabsContent value="commits" className="space-y-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <h3 className="font-semibold text-xs text-foreground uppercase tracking-wider flex items-center gap-2">
                    <GitCommit className="size-4 text-primary" /> Repository Commit History
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Browse complete commit log for branch <span className="font-mono text-foreground font-semibold">{selectedPipeline.branch}</span> and trigger workflow execution for any specific commit.
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs gap-1.5"
                  onClick={() => fetchCommits(selectedPipeline)}
                  disabled={commitsLoading}
                >
                  <RefreshCw className={cn("size-3.5", commitsLoading && "animate-spin")} /> Refresh Commits
                </Button>
              </div>

              {commitsLoading ? (
                <div className="py-12 text-center text-xs text-muted-foreground flex justify-center items-center gap-2">
                  <Loader2 className="size-4 animate-spin text-primary" /> Fetching commit history from GitHub REST API...
                </div>
              ) : commits.length === 0 ? (
                <div className="rounded-xl border hairline bg-card p-8 text-center text-xs text-muted-foreground">
                  No repository commit history retrieved.
                </div>
              ) : (
                <div className="rounded-xl border hairline bg-card overflow-hidden">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b hairline text-muted-foreground bg-muted/20 uppercase text-[10px] tracking-wider">
                        <th className="py-3 px-4 font-semibold">Commit SHA</th>
                        <th className="py-3 px-4 font-semibold">Message</th>
                        <th className="py-3 px-4 font-semibold">Author</th>
                        <th className="py-3 px-4 font-semibold">Date</th>
                        <th className="py-3 px-4 font-semibold text-right">Trigger Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border hairline">
                      {commits.map((c) => {
                        const sha = c.sha || c.id || "";
                        const shortSha = sha.substring(0, 7) || "HEAD";
                        const msg = c.commit?.message || c.message || "Commit update";
                        const authorName = c.commit?.author?.name || c.author?.login || c.author || "Contributor";
                        const authorAvatar = c.author?.avatar_url;
                        const dateStr = c.commit?.author?.date || c.date;

                        const isTriggering = triggerLoadingId === sha;

                        return (
                          <tr key={sha} className="hover:bg-muted/30 transition-colors">
                            <td className="py-3.5 px-4 font-mono font-semibold">
                              <span className="bg-muted px-2 py-0.5 rounded text-foreground inline-flex items-center gap-1">
                                <GitCommit className="size-3 text-primary" />
                                {shortSha}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 max-w-[360px]">
                              <p className="font-semibold text-foreground truncate">{msg}</p>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-1.5">
                                {authorAvatar ? (
                                  <img src={authorAvatar} alt="" className="size-4 rounded-full" />
                                ) : (
                                  <User className="size-3.5 text-muted-foreground" />
                                )}
                                <span className="font-medium text-foreground">{authorName}</span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-muted-foreground font-mono">
                              {dateStr ? fmtDate(dateStr, "d MMM yyyy · HH:mm") : "—"}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <Button
                                size="sm"
                                variant="default"
                                className="h-7 text-xs px-2.5 gap-1.5 bg-primary text-primary-foreground"
                                onClick={() => handleTriggerPipelineForCommit(c)}
                                disabled={isTriggering}
                              >
                                {isTriggering ? (
                                  <Loader2 className="size-3 animate-spin" />
                                ) : (
                                  <Play className="size-3" />
                                )}
                                Trigger Flow
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>

            {/* TAB 2: WORKFLOW RUNS */}
            <TabsContent value="runs" className="space-y-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <Select value={runStatusFilter} onValueChange={(v) => { setRunStatusFilter(v); fetchWorkflowRuns(selectedPipeline.id); }}>
                    <SelectTrigger className="w-36 h-9 text-xs bg-background">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Statuses</SelectItem>
                      <SelectItem value="success">Success</SelectItem>
                      <SelectItem value="failure">Failure</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="queued">Queued</SelectItem>
                    </SelectContent>
                  </Select>

                  <Input
                    placeholder="Filter branch..."
                    value={runBranchFilter}
                    onChange={(e) => setRunBranchFilter(e.target.value)}
                    className="w-40 h-9 text-xs"
                  />
                </div>

                <div className="text-xs text-muted-foreground">
                  Showing {workflowRuns.length} workflow runs
                </div>
              </div>

              {runsLoading ? (
                <div className="py-12 text-center text-xs text-muted-foreground flex justify-center items-center gap-2">
                  <Loader2 className="size-4 animate-spin text-primary" /> Retrieving workflow runs from GitHub Actions REST API...
                </div>
              ) : workflowRuns.length === 0 ? (
                <div className="rounded-xl border hairline bg-card p-8 text-center text-xs text-muted-foreground">
                  No GitHub Actions workflow runs found.
                </div>
              ) : (
                <div className="rounded-xl border hairline bg-card overflow-hidden">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b hairline text-muted-foreground bg-muted/20 uppercase text-[10px] tracking-wider">
                        <th className="py-3 px-4 font-semibold">Run #</th>
                        <th className="py-3 px-4 font-semibold">Workflow / Message</th>
                        <th className="py-3 px-4 font-semibold">Branch / Commit</th>
                        <th className="py-3 px-4 font-semibold">Actor</th>
                        <th className="py-3 px-4 font-semibold">Conclusion</th>
                        <th className="py-3 px-4 font-semibold">Duration</th>
                        <th className="py-3 px-4 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border hairline">
                      {workflowRuns.map((r) => (
                        <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-semibold text-foreground">#{r.runNumber}</td>
                          <td className="py-3.5 px-4 max-w-[280px]">
                            <p className="font-semibold text-foreground truncate">{r.name}</p>
                            <p className="text-[11px] text-muted-foreground truncate mt-0.5">{r.headCommitMessage || r.event}</p>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-muted-foreground">
                            <div className="text-foreground font-semibold flex items-center gap-1">
                              <GitBranch className="size-3 text-primary" /> {r.headBranch}
                            </div>
                            <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                              <GitCommit className="size-3" /> {r.headSha?.substring(0, 7)}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5">
                              {r.actorAvatar && <img src={r.actorAvatar} alt="" className="size-4 rounded-full" />}
                              <span className="font-mono text-muted-foreground">@{r.actorLogin || "actor"}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">{getConclusionBadge(r.conclusion, r.status)}</td>
                          <td className="py-3.5 px-4 text-muted-foreground font-mono">{formatDuration(r.runDurationSeconds)}</td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs px-2"
                                onClick={() => handleSelectRunForJobsOrLogs(r, "jobs")}
                              >
                                View Jobs
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                className="h-7 text-xs px-2"
                                onClick={() => handleSelectRunForJobsOrLogs(r, "logs")}
                              >
                                Logs
                              </Button>
                              {r.htmlUrl && (
                                <a href={r.htmlUrl} target="_blank" rel="noreferrer">
                                  <Button variant="ghost" size="icon" className="size-7" title="Open in GitHub">
                                    <ExternalLink className="size-3.5" />
                                  </Button>
                                </a>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>

            {/* TAB 3: JOBS & STEPS */}
            <TabsContent value="jobs" className="space-y-4">
              {selectedRun && (
                <div className="p-4 bg-muted/20 border hairline rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-foreground text-sm">Run #{selectedRun.runNumber} Jobs</span>
                    <p className="text-muted-foreground text-[11px] font-mono mt-0.5">
                      Branch: {selectedRun.headBranch} • Commit: {selectedRun.headSha?.substring(0, 7)}
                    </p>
                  </div>
                  {getConclusionBadge(selectedRun.conclusion, selectedRun.status)}
                </div>
              )}

              {jobsLoading ? (
                <div className="py-12 text-center text-xs text-muted-foreground flex justify-center items-center gap-2">
                  <Loader2 className="size-4 animate-spin text-primary" /> Loading workflow jobs & steps from GitHub REST API...
                </div>
              ) : jobs.length === 0 ? (
                <div className="rounded-xl border hairline bg-card p-8 text-center text-xs text-muted-foreground">
                  No jobs found for this workflow run.
                </div>
              ) : (
                <div className="space-y-3">
                  {jobs.map((j) => {
                    const isExpanded = expandedJobId === j.id;
                    return (
                      <div key={j.id} className="rounded-xl border hairline bg-card overflow-hidden">
                        <div
                          className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors"
                          onClick={() => setExpandedJobId(isExpanded ? null : j.id)}
                        >
                          <div className="flex items-center gap-3">
                            {isExpanded ? <ChevronDown className="size-4 text-muted-foreground" /> : <ChevronRight className="size-4 text-muted-foreground" />}
                            <div>
                              <h4 className="font-semibold text-foreground text-sm">{j.name}</h4>
                              <p className="text-[11px] text-muted-foreground mt-0.5">
                                Runner: {j.runnerName || "GitHub-hosted"} • {j.stepsCount || 0} Steps • Duration: {formatDuration(j.durationSeconds)}
                              </p>
                            </div>
                          </div>
                          {getConclusionBadge(j.conclusion, j.status)}
                        </div>

                        {/* Expandable Steps */}
                        {isExpanded && j.steps && j.steps.length > 0 && (
                          <div className="p-4 border-t hairline bg-muted/10 space-y-2">
                            <h5 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Execution Steps</h5>
                            <div className="divide-y divide-border hairline rounded-lg border hairline bg-card overflow-hidden">
                              {j.steps.map((s) => (
                                <div key={s.number} className="p-2.5 flex items-center justify-between text-xs">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                      #{s.number}
                                    </span>
                                    <span className="font-medium text-foreground">{s.name}</span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="font-mono text-[11px] text-muted-foreground">{formatDuration(s.durationSeconds)}</span>
                                    {getConclusionBadge(s.conclusion, s.status)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* TAB 4: LOGS VIEWER */}
            <TabsContent value="logs" className="space-y-4">
              <div className="p-4 bg-card border hairline rounded-xl space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Terminal className="size-4 text-primary" />
                    <h3 className="font-semibold text-xs text-foreground uppercase tracking-wider">
                      Workflow Execution Logs {selectedRun ? `(#${selectedRun.runNumber})` : ""}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Search log output..."
                      value={logSearch}
                      onChange={(e) => setLogSearch(e.target.value)}
                      className="w-48 h-8 text-xs bg-background"
                    />
                    <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={copyLogsToClipboard}>
                      {copiedLogs ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />} Copy
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={downloadLogsFile}>
                      <Download className="size-3.5" /> Download
                    </Button>
                  </div>
                </div>

                {logsLoading ? (
                  <div className="py-16 text-center text-xs text-muted-foreground flex justify-center items-center gap-2">
                    <Loader2 className="size-5 animate-spin text-primary" /> Retrieving execution logs from GitHub...
                  </div>
                ) : (
                  <div className="rounded-lg border hairline bg-slate-950 p-4 font-mono text-[11px] text-slate-200 overflow-x-auto max-h-[500px] overflow-y-auto leading-relaxed shadow-inner">
                    {filteredLogsLines.length > 0 ? (
                      filteredLogsLines.map((line, idx) => (
                        <div key={idx} className="flex gap-4 hover:bg-slate-900/50 px-1 rounded">
                          <span className="text-slate-600 select-none w-8 text-right shrink-0">{idx + 1}</span>
                          <span className="whitespace-pre-wrap">{line}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-slate-500 italic py-4 text-center">
                        No log matching filter or log text available.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3 flex-1 max-w-lg">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search pipelines, repositories, or workflows..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-9 text-xs"
                />
              </div>

              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger className="w-44 h-9 text-xs bg-background">
                  <SelectValue placeholder="All Projects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Projects</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36 h-9 text-xs bg-background">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                  <SelectItem value="DISABLED">DISABLED</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="text-xs text-muted-foreground">
              {filteredPipelines.length} Pipelines configured
            </div>
          </div>

          {loading ? (
            <div className="py-16 text-center text-xs text-muted-foreground flex justify-center items-center gap-2">
              <Loader2 className="size-5 animate-spin text-primary" /> Loading pipeline configurations...
            </div>
          ) : filteredPipelines.length === 0 ? (
            <div className="rounded-xl border hairline bg-card p-12 text-center space-y-4">
              <Workflow className="size-10 text-muted-foreground/50 mx-auto" />
              <h3 className="font-semibold text-foreground text-base">No pipelines found</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Click 'New Pipeline' to associate a GitHub Actions workflow with a project.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPipelines.map((pip) => (
                <div
                  key={pip.id}
                  className="rounded-xl border hairline bg-card p-5 hover:border-primary/40 transition-all shadow-sm flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-foreground truncate text-base flex items-center gap-2">
                          <Workflow className="size-4 text-primary shrink-0" />
                          {pip.name}
                        </h3>
                        <span className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-semibold mt-0.5 inline-block">
                          {pip.projectCode || "PROJ"}
                        </span>
                      </div>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold border",
                          pip.status === "ACTIVE"
                            ? "bg-success/15 text-success border-success/20"
                            : "bg-muted text-muted-foreground border-border/40"
                        )}
                      >
                        {pip.status}
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {pip.description || "No description provided."}
                    </p>

                    <div className="pt-2 border-t hairline space-y-1.5 text-xs text-muted-foreground">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <Github className="size-3.5 text-foreground" /> Repository:
                        </span>
                        <span className="font-mono text-foreground font-medium truncate max-w-[160px]">
                          {pip.repositoryFullName || "—"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <GitBranch className="size-3.5 text-primary" /> Branch:
                        </span>
                        <span className="font-mono text-foreground">{pip.branch}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <FileCode2 className="size-3.5 text-primary" /> Workflow:
                        </span>
                        <span className="font-medium text-foreground truncate max-w-[160px]">
                          {pip.workflowName || "Default Workflow"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t hairline space-y-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full text-xs gap-1.5"
                      onClick={() => openPipelineMonitoring(pip)}
                    >
                      <Activity className="size-3.5 text-primary" /> Monitor Workflow Runs →
                    </Button>

                    {canManage && (
                      <div className="flex items-center justify-end gap-1 pt-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          onClick={() => handleOpenEdit(pip)}
                          title="Edit Pipeline"
                        >
                          <Edit2 className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            setPipelineToDelete(pip);
                            setDeleteOpen(true);
                          }}
                          title="Delete Pipeline"
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
        </div>
      )}

      {/* Create / Edit Pipeline Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md bg-card border hairline">
          <DialogHeader>
            <DialogTitle className="font-display text-xl flex items-center gap-2">
              <Workflow className="size-5 text-primary" />
              {editingPipeline ? "Edit Pipeline Configuration" : "New GitHub Actions Pipeline"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSavePipeline} className="space-y-4 py-2 text-xs">
            <div className="space-y-1.5">
              <Label htmlFor="pipName" className="font-semibold">Pipeline Name *</Label>
              <Input
                id="pipName"
                placeholder="e.g. Production CI/CD Build"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={formLoading}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="projSelect" className="font-semibold">Target Project *</Label>
              <Select value={projectId} onValueChange={handleProjectSelect} disabled={formLoading}>
                <SelectTrigger className="bg-background h-9 text-xs">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name} ({p.code})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="workflowSelect" className="font-semibold">GitHub Actions Workflow</Label>
              <Select
                value={selectedWorkflowIdStr}
                onValueChange={handleWorkflowChange}
                disabled={formLoading || workflowsLoading || !projectId}
              >
                <SelectTrigger className="bg-background h-9 text-xs">
                  {workflowsLoading ? (
                    <span className="flex items-center gap-1.5"><Loader2 className="size-3 animate-spin" /> Discovering workflows...</span>
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

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="pipBranch" className="font-semibold">Branch *</Label>
                <Input
                  id="pipBranch"
                  placeholder="main"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  required
                  disabled={formLoading}
                  className="h-9 text-xs font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pipStatus" className="font-semibold">Status *</Label>
                <Select value={status} onValueChange={setStatus} disabled={formLoading}>
                  <SelectTrigger className="bg-background h-9 text-xs">
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
              <Label htmlFor="pipDesc">Description</Label>
              <Input
                id="pipDesc"
                placeholder="Pipeline configuration description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={formLoading}
                className="h-9 text-xs"
              />
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
                {editingPipeline ? "Update Pipeline" : "Save Pipeline"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Disable Pipeline?"
        description={`Are you sure you want to set pipeline "${pipelineToDelete?.name}" to DISABLED?`}
        confirmLabel="Disable Pipeline"
        loading={formLoading}
        onConfirm={handleDeleteConfirm}
      />

      {/* Trigger Pipeline Dialog */}
      <Dialog open={triggerDialogOpen} onOpenChange={setTriggerDialogOpen}>
        <DialogContent className="max-w-md bg-card border hairline">
          <DialogHeader>
            <DialogTitle className="font-display text-xl flex items-center gap-2">
              <PlayCircle className="size-5 text-primary" />
              Trigger Pipeline Execution
            </DialogTitle>
            <DialogDescription className="text-xs">
              Select a commit from repository history or enter a commit SHA to execute pipeline "{selectedPipeline?.name}".
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleTriggerPipelineForCommit(selectedCommitForTrigger || { sha: customCommitSha, message: customCommitMsg });
            }}
            className="space-y-4 py-2 text-xs"
          >
            <div className="space-y-1.5">
              <Label className="font-semibold">Select Commit from History</Label>
              <Select
                value={selectedCommitForTrigger?.sha || ""}
                onValueChange={(shaVal) => {
                  const found = commits.find((c) => (c.sha || c.id) === shaVal);
                  setSelectedCommitForTrigger(found || null);
                  if (found) {
                    setCustomCommitSha(found.sha || "");
                    setCustomCommitMsg(found.commit?.message || "");
                  }
                }}
              >
                <SelectTrigger className="bg-background h-9 text-xs">
                  <SelectValue placeholder="-- Pick a commit from history --" />
                </SelectTrigger>
                <SelectContent>
                  {commits.map((c) => {
                    const sha = c.sha || c.id;
                    const short = sha ? sha.substring(0, 7) : "";
                    const msg = c.commit?.message || c.message || "";
                    return (
                      <SelectItem key={sha} value={sha}>
                        [{short}] {msg.length > 35 ? msg.substring(0, 35) + "..." : msg}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="customSha" className="font-semibold">Commit SHA / Ref</Label>
              <Input
                id="customSha"
                placeholder="e.g. 7f8a9b0 or HEAD"
                value={customCommitSha}
                onChange={(e) => setCustomCommitSha(e.target.value)}
                className="h-9 text-xs font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="customMsg" className="font-semibold">Execution Description / Message</Label>
              <Input
                id="customMsg"
                placeholder="Manual pipeline execution run"
                value={customCommitMsg}
                onChange={(e) => setCustomCommitMsg(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <DialogFooter className="pt-4 border-t hairline mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setTriggerDialogOpen(false)}
                disabled={Boolean(triggerLoadingId)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={Boolean(triggerLoadingId)} className="gap-2 bg-primary text-primary-foreground">
                {triggerLoadingId ? <Loader2 className="size-3.5 animate-spin" /> : <Play className="size-3.5" />}
                Run Pipeline
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
