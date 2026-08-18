import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Server,
  Activity,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  PlayCircle,
  Clock,
  RefreshCw,
  Plus,
  Loader2,
  Terminal,
  Copy,
  Download,
  Search,
  Play,
  Check
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
import { deploymentService, buildService, pipelineService } from "@/services/api-services";
import { useSession } from "@/lib/session";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { fmtDate } from "@/lib/format";

export const Route = createFileRoute("/deployments")({
  head: () => ({
    meta: [
      { title: "Deployments · NeuroForge Nexus" },
      { name: "description", content: "Target server environments and deployment history." },
    ],
  }),
  component: DeploymentsPage,
});

export function DeploymentsPage() {
  const { user: currentUser } = useSession();
  const [deployments, setDeployments] = useState([]);
  const [builds, setBuilds] = useState([]);
  const [pipelines, setPipelines] = useState([]);
  const [stats, setStats] = useState({ totalDeployments: 0, successfulDeployments: 0, failedDeployments: 0 });
  const [loading, setLoading] = useState(true);

  // Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [pipelineId, setPipelineId] = useState("");
  const [buildId, setBuildId] = useState("");
  const [environment, setEnvironment] = useState("DEV");
  const [version, setVersion] = useState("v1.0.0");
  const [releaseNotes, setReleaseNotes] = useState("");

  // Logs Terminal Modal State
  const [logsModalOpen, setLogsModalOpen] = useState(false);
  const [selectedDeployment, setSelectedDeployment] = useState(null);
  const [logsContent, setLogsContent] = useState("");
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsSearch, setLogsSearch] = useState("");
  const [copied, setCopied] = useState(false);

  const canDeploy = currentUser?.role === "admin" || currentUser?.role === "devops" || currentUser?.role === "super_admin";

  const fetchData = async () => {
    setLoading(true);
    try {
      const [depRes, buildRes, pipRes, statsRes] = await Promise.all([
        deploymentService.search({ size: 100 }),
        buildService.search({ size: 100 }),
        pipelineService.search({ size: 100 }),
        deploymentService.getStats().catch(() => ({})),
      ]);
      setDeployments(depRes.content || []);
      setBuilds(buildRes.content || []);
      setPipelines(pipRes.content || []);
      setStats(statsRes);
    } catch (err) {
      console.error("Failed to load deployments:", err);
      toast.error("Failed to load deployment data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenLogs = async (dep) => {
    setSelectedDeployment(dep);
    setLogsModalOpen(true);
    setLogsLoading(true);
    setLogsContent("");
    try {
      const res = await deploymentService.getLogs(dep.id);
      const text = typeof res === "string" ? res : (res?.data || res?.logs || dep.logs || "No runtime execution logs recorded.");
      setLogsContent(text);
    } catch (err) {
      setLogsContent(dep.logs || "Failed to load deployment runtime logs.");
    } finally {
      setLogsLoading(false);
    }
  };

  const handleTriggerDeployment = async (e) => {
    e.preventDefault();
    if (!buildId && !pipelineId) {
      toast.error("Please select a Pipeline or Build to deploy.");
      return;
    }

    setFormLoading(true);
    try {
      const res = await deploymentService.create({
        buildId: buildId || undefined,
        pipelineId: pipelineId || undefined,
        environment,
        version: version || "v1.0.0",
        releaseNotes: releaseNotes || "Triggered manual target deployment",
        status: "SUCCESS",
        deployedAt: new Date().toISOString(),
      });
      toast.success(`Deployment to ${environment} initiated successfully!`);
      setDialogOpen(false);
      fetchData();
      if (res && res.id) {
        handleOpenLogs(res);
      }
    } catch (err) {
      toast.error(err.message || "Failed to trigger deployment");
    } finally {
      setFormLoading(false);
    }
  };

  const getEnvBadge = (env) => {
    switch (env) {
      case "PRODUCTION":
        return "bg-success/15 text-success border-success/20";
      case "STAGING":
        return "bg-primary-soft text-primary border-primary/20";
      case "QA":
        return "bg-warning/15 text-warning border-warning/20";
      default:
        return "bg-muted text-muted-foreground border-border/20";
    }
  };

  const getStatusBadge = (st) => {
    switch (st) {
      case "SUCCESS":
        return "text-success bg-success/10";
      case "FAILED":
        return "text-destructive bg-destructive/10";
      case "DEPLOYING":
        return "text-primary bg-primary-soft";
      default:
        return "text-warning bg-warning/10";
    }
  };

  const filteredBuilds = pipelineId
    ? builds.filter((b) => b.pipelineId === pipelineId)
    : builds;

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto space-y-6">
      <header className="flex items-end justify-between gap-4 pb-6 border-b hairline">
        <div>
          <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            Release Deployment
          </div>
          <h1 className="font-display text-3xl mt-1 flex items-center gap-2">
            <Server className="size-6 text-primary" /> Deployments
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage target server environments (DEV, QA, STAGING, PRODUCTION) and deployment history.
          </p>
        </div>
        {canDeploy && (
          <Button size="sm" onClick={() => { setPipelineId(pipelines[0]?.id || ""); setBuildId(builds[0]?.id || ""); setDialogOpen(true); }}>
            <Plus className="size-3.5 mr-1" /> New Deployment
          </Button>
        )}
      </header>

      {/* KPI Overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="rounded-xl border hairline bg-card p-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Deployments</div>
          <div className="text-2xl font-bold mt-1 text-foreground font-mono">{stats.totalDeployments || deployments.length}</div>
        </div>
        <div className="rounded-xl border hairline bg-card p-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Successful</div>
          <div className="text-2xl font-bold mt-1 text-success font-mono">{stats.successfulDeployments || deployments.filter(d => d.status === "SUCCESS").length}</div>
        </div>
        <div className="rounded-xl border hairline bg-card p-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Failed</div>
          <div className="text-2xl font-bold mt-1 text-destructive font-mono">{stats.failedDeployments || deployments.filter(d => d.status === "FAILED").length}</div>
        </div>
      </div>

      {/* Deployments Table */}
      <div className="rounded-xl border hairline bg-card overflow-hidden">
        <div className="p-4 border-b hairline flex items-center justify-between">
          <h2 className="text-sm font-semibold">Deployment Records</h2>
          <Button variant="ghost" size="sm" onClick={fetchData} className="h-8 text-xs gap-1">
            <RefreshCw className={cn("size-3.5", loading && "animate-spin")} /> Refresh
          </Button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-muted-foreground flex justify-center items-center gap-2">
            <Loader2 className="size-4 animate-spin text-primary" /> Loading deployments...
          </div>
        ) : deployments.length === 0 ? (
          <div className="p-12 text-center text-xs text-muted-foreground">
            No deployments recorded yet. Click "New Deployment" to trigger a build deployment.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/30 text-muted-foreground uppercase text-[10px] tracking-wider border-b hairline">
                <tr>
                  <th className="p-3 pl-4">Environment</th>
                  <th className="p-3">Version</th>
                  <th className="p-3">Pipeline / Build</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Deployed At</th>
                  <th className="p-3 text-right pr-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y hairline font-sans">
                {deployments.map((dep) => (
                  <tr key={dep.id} className="hover:bg-muted/20 transition-colors">
                    <td className="p-3 pl-4">
                      <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold border uppercase", getEnvBadge(dep.environment))}>
                        {dep.environment}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-bold text-foreground">{dep.version}</td>
                    <td className="p-3 font-mono">
                      <div>{dep.pipelineName || "CI Pipeline"}</div>
                      <div className="text-[10px] text-muted-foreground">Build #{dep.buildNumber || "-"}</div>
                    </td>
                    <td className="p-3">
                      <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase", getStatusBadge(dep.status))}>
                        {dep.status}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-muted-foreground">{fmtDate(dep.deployedAt || dep.createdAt)}</td>
                    <td className="p-3 text-right pr-4">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs px-2 gap-1"
                        onClick={() => handleOpenLogs(dep)}
                      >
                        <Terminal className="size-3 text-primary" /> Logs
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Deployment Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md bg-card border hairline">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Trigger New Deployment</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleTriggerDeployment} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <Label htmlFor="pipeline" className="font-semibold">Associated Pipeline *</Label>
              <Select
                value={pipelineId}
                onValueChange={(pId) => {
                  const targetP = pId === "NONE" ? "" : pId;
                  setPipelineId(targetP);
                  if (targetP) {
                    const matching = builds.filter((b) => b.pipelineId === targetP);
                    if (matching.length > 0) setBuildId(matching[0].id);
                    else setBuildId("");
                  }
                }}
                disabled={formLoading}
              >
                <SelectTrigger className="bg-background h-9 text-xs">
                  <SelectValue placeholder="Select pipeline..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">-- Select Pipeline --</SelectItem>
                  {pipelines.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} ({p.projectCode || p.provider || "Pipeline"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="build" className="font-semibold">Associated Build</Label>
              <Select value={buildId} onValueChange={(val) => setBuildId(val === "LATEST" ? "" : val)} disabled={formLoading}>
                <SelectTrigger className="bg-background h-9 text-xs">
                  <SelectValue placeholder="Select build..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LATEST">-- Deploy Latest Build / Commit --</SelectItem>
                  {filteredBuilds.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      Build #{b.buildNumber} ({b.pipelineName || "Pipeline"}) - {b.status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="environment" className="font-semibold">Target Environment</Label>
                <Select value={environment} onValueChange={setEnvironment} disabled={formLoading}>
                  <SelectTrigger className="bg-background h-9 text-xs">
                    <SelectValue placeholder="Environment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DEV">DEV</SelectItem>
                    <SelectItem value="QA">QA</SelectItem>
                    <SelectItem value="STAGING">STAGING</SelectItem>
                    <SelectItem value="PRODUCTION">PRODUCTION</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="version" className="font-semibold">Version Tag</Label>
                <Input
                  id="version"
                  placeholder="v1.0.0"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  disabled={formLoading}
                  className="h-9 text-xs font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="releaseNotes" className="font-semibold">Release / Deployment Notes</Label>
              <Input
                id="releaseNotes"
                placeholder="Deployment description..."
                value={releaseNotes}
                onChange={(e) => setReleaseNotes(e.target.value)}
                disabled={formLoading}
                className="h-9 text-xs"
              />
            </div>

            <DialogFooter className="pt-4 border-t hairline mt-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={formLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={formLoading} className="gap-2 bg-primary text-primary-foreground">
                {formLoading ? <Loader2 className="size-3.5 animate-spin" /> : <Play className="size-3.5" />}
                Trigger Deployment
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Runtime Logs Terminal Modal */}
      <Dialog open={logsModalOpen} onOpenChange={setLogsModalOpen}>
        <DialogContent className="max-w-3xl bg-card border hairline overflow-hidden flex flex-col max-h-[85vh]">
          <DialogHeader className="pb-3 border-b hairline">
            <DialogTitle className="font-display text-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="size-5 text-primary" />
                <span>Deployment Runtime Execution Logs</span>
              </div>
              {selectedDeployment && (
                <div className="flex items-center gap-2 text-xs font-mono font-normal mr-6">
                  <span className="bg-muted px-2 py-0.5 rounded">{selectedDeployment.environment}</span>
                  <span className="text-primary font-semibold">{selectedDeployment.version}</span>
                </div>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="p-4 space-y-3 flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="size-3.5 absolute left-3 top-2.5 text-muted-foreground" />
                <Input
                  placeholder="Search log output..."
                  value={logsSearch}
                  onChange={(e) => setLogsSearch(e.target.value)}
                  className="pl-8 h-8 text-xs bg-background"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs gap-1.5"
                  onClick={() => {
                    navigator.clipboard.writeText(logsContent);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                    toast.success("Logs copied to clipboard");
                  }}
                  disabled={!logsContent}
                >
                  {copied ? <Check className="size-3 text-success" /> : <Copy className="size-3" />}
                  {copied ? "Copied" : "Copy Logs"}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs gap-1.5"
                  onClick={() => {
                    const blob = new Blob([logsContent], { type: "text/plain" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `deployment-${selectedDeployment?.environment || "logs"}-${selectedDeployment?.version || "run"}.log`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  disabled={!logsContent}
                >
                  <Download className="size-3" /> Download
                </Button>
              </div>
            </div>

            <div className="flex-1 min-h-[300px] bg-slate-950 text-slate-100 rounded-lg p-4 font-mono text-xs overflow-y-auto leading-relaxed border border-slate-800 selection:bg-primary selection:text-white">
              {logsLoading ? (
                <div className="h-full flex items-center justify-center text-slate-400 gap-2 py-12">
                  <Loader2 className="size-4 animate-spin text-primary" /> Loading live runtime logs...
                </div>
              ) : !logsContent ? (
                <div className="h-full flex items-center justify-center text-slate-500 py-12">
                  No log output generated for this deployment.
                </div>
              ) : (
                logsContent
                  .split("\n")
                  .filter((line) => !logsSearch || line.toLowerCase().includes(logsSearch.toLowerCase()))
                  .map((line, idx) => (
                    <div key={idx} className="hover:bg-slate-900/60 px-1 rounded transition-colors whitespace-pre-wrap">
                      <span className="text-slate-600 select-none mr-3 w-8 inline-block text-right">{idx + 1}</span>
                      <span>{line}</span>
                    </div>
                  ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
