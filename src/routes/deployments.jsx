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
  Check,
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

export const Route = createFileRoute("/deployments")({
  head: () => ({
    meta: [
      { title: "Deployments · NeuroForge Nexus" },
      { name: "description", content: "Environment deployment overview and runtime status." },
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
  const [environment, setEnvironment] = useState("PRODUCTION");
  const [version, setVersion] = useState("v1.0.0");
  const [releaseNotes, setReleaseNotes] = useState("");
  const [status, setStatus] = useState("SUCCESS");

  // Runtime Logs Viewer State
  const [logsModalOpen, setLogsModalOpen] = useState(false);
  const [selectedDeploymentForLogs, setSelectedDeploymentForLogs] = useState(null);
  const [logsContent, setLogsContent] = useState("");
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsSearch, setLogsSearch] = useState("");
  const [copiedLogs, setCopiedLogs] = useState(false);

  const canDeploy = currentUser?.role === "admin" || currentUser?.role === "devops" || currentUser?.role === "super_admin";

  const handleOpenLogs = async (dep) => {
    setSelectedDeploymentForLogs(dep);
    setLogsModalOpen(true);
    setLogsLoading(true);
    setLogsContent("");
    try {
      const res = await deploymentService.getLogs(dep.id);
      const text = typeof res === "string" ? res : (res?.data || res?.logs || dep.logs || "No runtime logs available.");
      setLogsContent(text);
    } catch (err) {
      console.error("Failed to load deployment runtime logs:", err);
      setLogsContent(dep.logs || "Failed to retrieve deployment runtime logs from server.");
    } finally {
      setLogsLoading(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [depRes, buildsRes, pipRes, statsRes] = await Promise.all([
        deploymentService.search({ size: 100 }).catch(() => ({ content: [] })),
        buildService.search({ size: 100 }).catch(() => ({ content: [] })),
        pipelineService.search({ size: 100 }).catch(() => ({ content: [] })),
        deploymentService.getStats().catch(() => ({ totalDeployments: 0, successfulDeployments: 0, failedDeployments: 0 })),
      ]);
      setDeployments(depRes.content || []);
      setBuilds(buildsRes.content || []);
      setPipelines(pipRes.content || []);
      setStats(statsRes || { totalDeployments: 0, successfulDeployments: 0, failedDeployments: 0 });
    } catch (err) {
      console.error("Failed to load deployments data:", err);
      toast.error("Failed to load deployments data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateDeployment = async (e) => {
    e.preventDefault();
    if (!buildId && !pipelineId) {
      toast.error("Please select an Associated Pipeline or Build.");
      return;
    }
    if (!version) {
      toast.error("Version string is required.");
      return;
    }

    setFormLoading(true);
    try {
      await deploymentService.create({
        buildId: buildId || undefined,
        pipelineId: pipelineId || undefined,
        environment,
        version,
        releaseNotes,
        status,
        deployedAt: new Date().toISOString(),
      });
      toast.success(`Deployment recorded successfully to ${environment}`);
      setDialogOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.message || "Failed to record deployment");
    } finally {
      setFormLoading(false);
    }
  };

  const getStatusBadge = (st) => {
    switch (st) {
      case "SUCCESS":
        return "bg-success/15 text-success border-success/20";
      case "FAILED":
        return "bg-destructive/15 text-destructive border-destructive/20";
      case "DEPLOYING":
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

      {/* KPI Load overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="rounded-xl border hairline bg-card p-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Deployments</div>
          <div className="text-2xl font-bold mt-1 text-foreground font-mono">{stats.totalDeployments || deployments.length}</div>
        </div>
        <div className="rounded-xl border hairline bg-card p-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Successful Deployments</div>
          <div className="text-2xl font-bold mt-1 text-success font-display">{stats.successfulDeployments || 0}</div>
        </div>
        <div className="rounded-xl border hairline bg-card p-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Failed / Rolled Back</div>
          <div className="text-2xl font-bold mt-1 text-destructive font-display">{stats.failedDeployments || 0}</div>
        </div>
      </div>

      {/* Deployments Table */}
      <div className="rounded-xl border hairline bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px] text-left">
            <thead>
              <tr className="border-b hairline text-muted-foreground uppercase text-[10px] tracking-wider bg-surface/50">
                <th className="py-3 px-4">Environment</th>
                <th className="py-3 px-3">Version</th>
                <th className="py-3 px-3">Build #</th>
                <th className="py-3 px-3">Project / Pipeline</th>
                <th className="py-3 px-3">Deployed At</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 pr-4 pl-3 text-right">Actions / Runtime Logs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    <Loader2 className="size-5 animate-spin mx-auto mb-2 text-primary" /> Loading deployment history...
                  </td>
                </tr>
              ) : deployments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground text-xs">
                    No deployments recorded yet.
                  </td>
                </tr>
              ) : (
                deployments.map((d) => (
                  <tr key={d.id} className="hover:bg-accent/20 transition-colors">
                    <td className="py-3 px-4 font-semibold text-foreground">
                      <span className="bg-muted px-2 py-0.5 rounded font-mono text-xs">{d.environment}</span>
                    </td>
                    <td className="py-3 px-3 font-mono font-medium text-primary">{d.version}</td>
                    <td className="py-3 px-3 font-mono text-muted-foreground">#{d.buildNumber || "-"}</td>
                    <td className="py-3 px-3 text-muted-foreground">
                      <span className="font-semibold text-foreground">{d.pipelineName || "Pipeline"}</span>
                      {d.projectCode && <span className="text-[10px] font-mono ml-1 text-muted-foreground">({d.projectCode})</span>}
                    </td>
                    <td className="py-3 px-3 text-muted-foreground font-mono text-xs">
                      {d.deployedAt ? new Date(d.deployedAt).toLocaleString() : "-"}
                    </td>
                    <td className="py-3 px-3">
                      <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border", getStatusBadge(d.status))}>
                        {d.status}
                      </span>
                    </td>
                    <td className="py-3 pr-4 pl-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs px-2.5 gap-1"
                          onClick={() => handleOpenLogs(d)}
                        >
                          <Terminal className="size-3 text-primary" /> Logs
                        </Button>
                        {canDeploy && (
                          <Button
                            size="sm"
                            className="h-7 text-xs px-2.5 gap-1 bg-primary text-primary-foreground"
                            onClick={() => {
                              setBuildId(d.buildId || builds[0]?.id || "");
                              setEnvironment(d.environment || "PRODUCTION");
                              setVersion(d.version || "v1.0.0");
                              setDialogOpen(true);
                            }}
                          >
                            <Play className="size-3" /> Deploy
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Deployment Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md bg-card border hairline">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Record Deployment</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateDeployment} className="space-y-4">
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
                <SelectTrigger className="bg-background">
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
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select build..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LATEST">-- Deploy Latest Commit / Build --</SelectItem>
                  {(pipelineId ? builds.filter((b) => b.pipelineId === pipelineId) : builds).map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      Build #{b.buildNumber} ({b.pipelineName || "Pipeline"}) - {b.status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="environment">Target Environment</Label>
                <Select value={environment} onValueChange={setEnvironment} disabled={formLoading}>
                  <SelectTrigger className="bg-background">
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
                <Label htmlFor="version">Release Version</Label>
                <Input
                  id="version"
                  placeholder="v1.2.0"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  required
                  disabled={formLoading}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="status">Deployment Status</Label>
              <Select value={status} onValueChange={setStatus} disabled={formLoading}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SUCCESS">SUCCESS</SelectItem>
                  <SelectItem value="DEPLOYING">DEPLOYING</SelectItem>
                  <SelectItem value="FAILED">FAILED</SelectItem>
                  <SelectItem value="ROLLED_BACK">ROLLED_BACK</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes">Release Notes</Label>
              <Input
                id="notes"
                placeholder="Deployment release summary..."
                value={releaseNotes}
                onChange={(e) => setReleaseNotes(e.target.value)}
                disabled={formLoading}
              />
            </div>

            <DialogFooter className="pt-4 border-t hairline mt-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={formLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={formLoading}>
                {formLoading ? <Loader2 className="size-3.5 animate-spin ml-1" /> : "Trigger Deployment"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Deployment Runtime Logs Modal */}
      <Dialog open={logsModalOpen} onOpenChange={setLogsModalOpen}>
        <DialogContent className="max-w-3xl bg-card border hairline overflow-hidden flex flex-col max-h-[85vh]">
          <DialogHeader className="pb-3 border-b hairline">
            <DialogTitle className="font-display text-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="size-5 text-primary" />
                <span>Runtime Deployment Logs</span>
              </div>
              {selectedDeploymentForLogs && (
                <div className="flex items-center gap-2 text-xs font-mono font-normal mr-6">
                  <span className="bg-muted px-2 py-0.5 rounded">{selectedDeploymentForLogs.environment}</span>
                  <span className="text-primary font-semibold">{selectedDeploymentForLogs.version}</span>
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
                    setCopiedLogs(true);
                    setTimeout(() => setCopiedLogs(false), 2000);
                    toast.success("Deployment logs copied to clipboard");
                  }}
                  disabled={!logsContent}
                >
                  {copiedLogs ? <Check className="size-3 text-success" /> : <Copy className="size-3" />}
                  {copiedLogs ? "Copied" : "Copy Logs"}
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
                    a.download = `deployment-${selectedDeploymentForLogs?.environment || "logs"}-${selectedDeploymentForLogs?.version || "run"}.log`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  disabled={!logsContent}
                >
                  <Download className="size-3" /> Download
                </Button>
              </div>
            </div>

            {/* Terminal Log Display Container */}
            <div className="flex-1 min-h-[300px] bg-slate-950 text-slate-100 rounded-lg p-4 font-mono text-xs overflow-y-auto leading-relaxed border border-slate-800 selection:bg-primary selection:text-white">
              {logsLoading ? (
                <div className="h-full flex items-center justify-center text-slate-400 gap-2 py-12">
                  <Loader2 className="size-4 animate-spin text-primary" /> Loading live runtime deployment logs...
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
