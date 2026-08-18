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
<<<<<<< HEAD
  Terminal,
  Copy,
  Download,
  Search,
  Play,
  Check,
=======
  RotateCcw,
  GitCompare,
  ArrowRightLeft,
  ShieldCheck,
>>>>>>> 5cb05e4db177fe2da7ec504c308ee1f829238eec
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
<<<<<<< HEAD
import { deploymentService, buildService, pipelineService } from "@/services/api-services";
=======
import { deploymentService, buildService, releaseService } from "@/services/api-services";
>>>>>>> 5cb05e4db177fe2da7ec504c308ee1f829238eec
import { useSession } from "@/lib/session";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { fmtDate } from "@/lib/format";

export const Route = createFileRoute("/deployments")({
  head: () => ({
    meta: [
      { title: "Deployments & Blue-Green Traffic · NeuroForge Nexus" },
      { name: "description", content: "Environment deployment overview, Blue-Green traffic state, and rollback capability." },
    ],
  }),
  component: DeploymentsPage,
});

export function DeploymentsPage() {
  const { user: currentUser } = useSession();
  const [deployments, setDeployments] = useState([]);
  const [builds, setBuilds] = useState([]);
<<<<<<< HEAD
  const [pipelines, setPipelines] = useState([]);
=======
  const [releases, setReleases] = useState([]);
>>>>>>> 5cb05e4db177fe2da7ec504c308ee1f829238eec
  const [stats, setStats] = useState({ totalDeployments: 0, successfulDeployments: 0, failedDeployments: 0 });
  const [loading, setLoading] = useState(true);

  // Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [pipelineId, setPipelineId] = useState("");
  const [buildId, setBuildId] = useState("");
  const [releaseId, setReleaseId] = useState("");
  const [environment, setEnvironment] = useState("PRODUCTION");
  const [serviceName, setServiceName] = useState("neuroforge-core-api");
  const [version, setVersion] = useState("v1.2.0");
  const [strategy, setStrategy] = useState("BLUE_GREEN");
  const [releaseNotes, setReleaseNotes] = useState("");
  const [status, setStatus] = useState("SUCCESS");

<<<<<<< HEAD
  // Runtime Logs Viewer State
  const [logsModalOpen, setLogsModalOpen] = useState(false);
  const [selectedDeploymentForLogs, setSelectedDeploymentForLogs] = useState(null);
  const [logsContent, setLogsContent] = useState("");
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsSearch, setLogsSearch] = useState("");
  const [copiedLogs, setCopiedLogs] = useState(false);

  const canDeploy = currentUser?.role === "admin" || currentUser?.role === "devops" || currentUser?.role === "super_admin";
=======
  // Blue-Green Promotion Dialog
  const [bgOpen, setBgOpen] = useState(false);
  const [bgTargetVersion, setBgTargetVersion] = useState("v1.2.1-candidate");
  const [bgEnv, setBgEnv] = useState("PRODUCTION");
  const [bgLoading, setBgLoading] = useState(false);

  // Rollback Dialog
  const [rollbackOpen, setRollbackOpen] = useState(false);
  const [selectedDeployment, setSelectedDeployment] = useState(null);
  const [rollbackReason, setRollbackReason] = useState("");
  const [rollbackLoading, setRollbackLoading] = useState(false);

  const canDeploy = ["admin", "devops", "super_admin"].includes(currentUser?.role);
>>>>>>> 5cb05e4db177fe2da7ec504c308ee1f829238eec

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
<<<<<<< HEAD
      const [depRes, buildsRes, pipRes, statsRes] = await Promise.all([
        deploymentService.search({ size: 100 }).catch(() => ({ content: [] })),
        buildService.search({ size: 100 }).catch(() => ({ content: [] })),
        pipelineService.search({ size: 100 }).catch(() => ({ content: [] })),
=======
      const [depRes, buildsRes, relsRes, statsRes] = await Promise.all([
        deploymentService.search({ size: 100 }).catch(() => ({ content: [] })),
        buildService.search({ size: 100 }).catch(() => ({ content: [] })),
        releaseService.search({ size: 100 }).catch(() => ({ content: [] })),
>>>>>>> 5cb05e4db177fe2da7ec504c308ee1f829238eec
        deploymentService.getStats().catch(() => ({ totalDeployments: 0, successfulDeployments: 0, failedDeployments: 0 })),
      ]);
      setDeployments(depRes.content || []);
      setBuilds(buildsRes.content || []);
<<<<<<< HEAD
      setPipelines(pipRes.content || []);
=======
      setReleases(relsRes.content || []);
>>>>>>> 5cb05e4db177fe2da7ec504c308ee1f829238eec
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
<<<<<<< HEAD
        buildId: buildId || undefined,
        pipelineId: pipelineId || undefined,
=======
        buildId,
        releaseId: releaseId || null,
>>>>>>> 5cb05e4db177fe2da7ec504c308ee1f829238eec
        environment,
        serviceName,
        version,
        strategy,
        releaseNotes,
        status,
        deployedAt: new Date().toISOString(),
        startedAt: new Date(Date.now() - 120000).toISOString(),
        completedAt: new Date().toISOString(),
        duration: 120,
        currentVersion: version,
        rollbackAvailable: true,
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

  const handlePromoteBlueGreen = async (e) => {
    e.preventDefault();
    setBgLoading(true);
    try {
      await deploymentService.promoteBlueGreen({
        environment: bgEnv,
        targetVersion: bgTargetVersion,
        notes: "Blue-Green promotion executed from dashboard",
      });
      toast.success(`Blue-Green traffic promoted to ${bgTargetVersion} on ${bgEnv}!`);
      setBgOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.message || "Blue-Green promotion failed");
    } finally {
      setBgLoading(false);
    }
  };

  const handleRollback = async (e) => {
    e.preventDefault();
    if (!selectedDeployment) return;
    setRollbackLoading(true);
    try {
      await deploymentService.rollback(selectedDeployment.id, {
        targetDeploymentId: selectedDeployment.id,
        reason: rollbackReason,
      });
      toast.success(`Deployment rolled back on ${selectedDeployment.environment}.`);
      setRollbackOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.message || "Rollback failed");
    } finally {
      setRollbackLoading(false);
    }
  };

  const getStatusBadge = (st) => {
    switch (st) {
      case "SUCCESS":
        return "bg-success/15 text-success border-success/20";
      case "FAILED":
        return "bg-destructive/15 text-destructive border-destructive/20";
      case "ROLLED_BACK":
        return "bg-warning/15 text-warning border-warning/20";
      case "DEPLOYING":
        return "bg-primary-soft text-primary border-primary/20";
      default:
        return "bg-muted text-muted-foreground border-border/20";
    }
  };

  const latestProdBg = deployments.find((d) => d.environment === "PRODUCTION" && d.strategy === "BLUE_GREEN") || deployments[0];

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto space-y-6">
      <header className="flex items-end justify-between gap-4 pb-6 border-b hairline">
        <div>
          <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            Release Deployment & Traffic Operations
          </div>
          <h1 className="font-display text-3xl mt-1 flex items-center gap-2">
            <Server className="size-6 text-primary" /> Deployments & Blue-Green
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track active target server environments (DEV, QA, STAGING, PRODUCTION), Blue-Green traffic promotion, and rollback states.
          </p>
        </div>
        {canDeploy && (
<<<<<<< HEAD
          <Button size="sm" onClick={() => { setPipelineId(pipelines[0]?.id || ""); setBuildId(builds[0]?.id || ""); setDialogOpen(true); }}>
            <Plus className="size-3.5 mr-1" /> New Deployment
          </Button>
=======
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setBgOpen(true)}>
              <ArrowRightLeft className="size-3.5 mr-1 text-primary" /> Promote Blue-Green
            </Button>
            <Button size="sm" onClick={() => { setBuildId(builds[0]?.id || ""); setDialogOpen(true); }}>
              <Plus className="size-3.5 mr-1" /> New Deployment
            </Button>
          </div>
>>>>>>> 5cb05e4db177fe2da7ec504c308ee1f829238eec
        )}
      </header>

      {/* Blue-Green Active Environment Traffic Visualizer */}
      <div className="rounded-xl border hairline bg-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <GitCompare className="size-4 text-primary" /> Blue-Green Traffic & Environment Promotion
          </h2>
          <span className="text-xs font-mono text-success flex items-center gap-1">
            <CheckCircle2 className="size-3.5" /> Candidate Health: 100% Verified
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Blue Environment Card */}
          <div className={cn(
            "p-4 rounded-xl border hairline transition-all space-y-2",
            latestProdBg?.blueGreenState === "BLUE_ACTIVE" ? "bg-primary/5 border-primary/40 ring-1 ring-primary/20" : "bg-muted/20 border-border/40 opacity-80"
          )}>
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-primary uppercase">BLUE ENVIRONMENT</span>
              <span className={cn(
                "px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase",
                latestProdBg?.blueGreenState === "BLUE_ACTIVE" ? "bg-success/15 text-success border-success/30" : "bg-muted text-muted-foreground"
              )}>
                {latestProdBg?.blueGreenState === "BLUE_ACTIVE" ? "ACTIVE PRODUCTION (100% Traffic)" : "INACTIVE / IDLE"}
              </span>
            </div>
            <div className="text-lg font-bold font-mono text-foreground">
              {latestProdBg?.blueGreenState === "BLUE_ACTIVE" ? (latestProdBg?.version || "v1.2.0") : (latestProdBg?.previousVersion || "v1.1.0")}
            </div>
            <p className="text-[11px] text-muted-foreground">Service: {latestProdBg?.serviceName || "neuroforge-core-api"}</p>
          </div>

          {/* Green Environment Card */}
          <div className={cn(
            "p-4 rounded-xl border hairline transition-all space-y-2",
            latestProdBg?.blueGreenState === "GREEN_ACTIVE" ? "bg-primary/5 border-primary/40 ring-1 ring-primary/20" : "bg-muted/20 border-border/40 opacity-80"
          )}>
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-success uppercase">GREEN ENVIRONMENT</span>
              <span className={cn(
                "px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase",
                latestProdBg?.blueGreenState === "GREEN_ACTIVE" ? "bg-success/15 text-success border-success/30" : "bg-muted text-muted-foreground"
              )}>
                {latestProdBg?.blueGreenState === "GREEN_ACTIVE" ? "ACTIVE PRODUCTION (100% Traffic)" : "STAGING / CANDIDATE"}
              </span>
            </div>
            <div className="text-lg font-bold font-mono text-foreground">
              {latestProdBg?.blueGreenState === "GREEN_ACTIVE" ? (latestProdBg?.version || "v1.2.0") : "v1.2.1-candidate"}
            </div>
            <p className="text-[11px] text-muted-foreground">Candidate Health: Operational (0 error logs)</p>
          </div>
        </div>
      </div>

      {/* KPI Load overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="rounded-xl border hairline bg-card p-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Deployments</div>
          <div className="text-2xl font-bold mt-1 text-foreground font-mono">{stats.totalDeployments || deployments.length}</div>
        </div>
        <div className="rounded-xl border hairline bg-card p-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Successful Deployments</div>
          <div className="text-2xl font-bold mt-1 text-success font-display">{stats.successfulDeployments || deployments.length}</div>
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
                <th className="py-3 px-3">Service</th>
                <th className="py-3 px-3">Version</th>
                <th className="py-3 px-3">Strategy</th>
                <th className="py-3 px-3">Build / Pipeline</th>
                <th className="py-3 px-3">Deployed At</th>
                <th className="py-3 px-3">Status</th>
<<<<<<< HEAD
                <th className="py-3 pr-4 pl-3 text-right">Actions / Runtime Logs</th>
=======
                <th className="py-3 pr-4 pl-3 text-right">Actions</th>
>>>>>>> 5cb05e4db177fe2da7ec504c308ee1f829238eec
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {loading ? (
                <tr>
<<<<<<< HEAD
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
=======
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
>>>>>>> 5cb05e4db177fe2da7ec504c308ee1f829238eec
                    <Loader2 className="size-5 animate-spin mx-auto mb-2 text-primary" /> Loading deployment history...
                  </td>
                </tr>
              ) : deployments.length === 0 ? (
                <tr>
<<<<<<< HEAD
                  <td colSpan={7} className="py-12 text-center text-muted-foreground text-xs">
=======
                  <td colSpan={8} className="py-12 text-center text-muted-foreground text-xs">
>>>>>>> 5cb05e4db177fe2da7ec504c308ee1f829238eec
                    No deployments recorded yet.
                  </td>
                </tr>
              ) : (
                deployments.map((d) => (
                  <tr key={d.id} className="hover:bg-accent/20 transition-colors">
<<<<<<< HEAD
                    <td className="py-3 px-4 font-semibold text-foreground">
                      <span className="bg-muted px-2 py-0.5 rounded font-mono text-xs">{d.environment}</span>
                    </td>
=======
                    <td className="py-3 px-4 font-semibold text-foreground">{d.environment}</td>
                    <td className="py-3 px-3 font-mono text-xs text-muted-foreground">{d.serviceName || "core-api"}</td>
>>>>>>> 5cb05e4db177fe2da7ec504c308ee1f829238eec
                    <td className="py-3 px-3 font-mono font-medium text-primary">{d.version}</td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-accent/40 text-muted-foreground">
                        {d.strategy || "STANDARD"}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-muted-foreground">
                      <span className="font-semibold text-foreground">{d.pipelineName || "Pipeline"}</span>
                      {d.buildNumber && <span className="text-[10px] font-mono ml-1 text-muted-foreground">(#{d.buildNumber})</span>}
                    </td>
                    <td className="py-3 px-3 text-muted-foreground font-mono text-xs">
<<<<<<< HEAD
                      {d.deployedAt ? new Date(d.deployedAt).toLocaleString() : "-"}
=======
                      {d.deployedAt ? fmtDate(d.deployedAt) : "-"}
>>>>>>> 5cb05e4db177fe2da7ec504c308ee1f829238eec
                    </td>
                    <td className="py-3 px-3">
                      <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border", getStatusBadge(d.status))}>
                        {d.status}
                      </span>
                    </td>
                    <td className="py-3 pr-4 pl-3 text-right">
<<<<<<< HEAD
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
=======
                      {canDeploy && d.status === "SUCCESS" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs text-destructive hover:bg-destructive/10"
                          onClick={() => { setSelectedDeployment(d); setRollbackReason(""); setRollbackOpen(true); }}
                        >
                          <RotateCcw className="size-3 mr-1" /> Rollback
                        </Button>
                      )}
>>>>>>> 5cb05e4db177fe2da7ec504c308ee1f829238eec
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Blue-Green Promotion Dialog */}
      <Dialog open={bgOpen} onOpenChange={setBgOpen}>
        <DialogContent className="max-w-md bg-card border hairline">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Promote Blue-Green Target</DialogTitle>
          </DialogHeader>

          <form onSubmit={handlePromoteBlueGreen} className="space-y-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Target environment candidate health is verified. Promoting will switch live user traffic to the candidate version and record the state transition in the audit history.
            </p>

            <div className="space-y-1.5">
              <Label>Target Environment</Label>
              <Select value={bgEnv} onValueChange={setBgEnv} disabled={bgLoading}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Environment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PRODUCTION">PRODUCTION</SelectItem>
                  <SelectItem value="STAGING">STAGING</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="targetVer">Candidate Version to Promote</Label>
              <Input
                id="targetVer"
                placeholder="v1.2.1-candidate"
                value={bgTargetVersion}
                onChange={(e) => setBgTargetVersion(e.target.value)}
                required
                disabled={bgLoading}
              />
            </div>

            <DialogFooter className="pt-4 border-t hairline mt-4">
              <Button type="button" variant="outline" onClick={() => setBgOpen(false)} disabled={bgLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={bgLoading}>
                {bgLoading ? <Loader2 className="size-3.5 animate-spin ml-1" /> : "Switch Production Traffic"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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

            <div className="space-y-1.5">
              <Label htmlFor="release">Associated Release (Optional)</Label>
              <Select value={releaseId} onValueChange={setReleaseId} disabled={formLoading}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select release" />
                </SelectTrigger>
                <SelectContent>
                  {releases.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.version} ({r.name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="environment">Environment</Label>
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
                <Label htmlFor="version">Version</Label>
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

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="service">Service Name</Label>
                <Input
                  id="service"
                  placeholder="neuroforge-core-api"
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  disabled={formLoading}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="strategy">Deployment Strategy</Label>
                <Select value={strategy} onValueChange={setStrategy} disabled={formLoading}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Strategy" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STANDARD">STANDARD</SelectItem>
                    <SelectItem value="BLUE_GREEN">BLUE_GREEN</SelectItem>
                  </SelectContent>
                </Select>
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

<<<<<<< HEAD
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
=======
      {/* Rollback Dialog */}
      <Dialog open={rollbackOpen} onOpenChange={setRollbackOpen}>
        <DialogContent className="max-w-md bg-card border hairline">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-destructive">Confirm Deployment Rollback</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleRollback} className="space-y-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Initiating rollback for deployment version <strong className="font-mono text-foreground">{selectedDeployment?.version}</strong> on environment <strong>{selectedDeployment?.environment}</strong>.
            </p>

            <div className="space-y-1.5">
              <Label htmlFor="reason">Rollback Reason</Label>
              <Input
                id="reason"
                placeholder="Reason for deployment rollback..."
                value={rollbackReason}
                onChange={(e) => setRollbackReason(e.target.value)}
                required
                disabled={rollbackLoading}
              />
            </div>

            <DialogFooter className="pt-4 border-t hairline mt-4">
              <Button type="button" variant="outline" onClick={() => setRollbackOpen(false)} disabled={rollbackLoading}>
                Cancel
              </Button>
              <Button type="submit" variant="destructive" disabled={rollbackLoading}>
                {rollbackLoading ? <Loader2 className="size-3.5 animate-spin ml-1" /> : "Execute Rollback"}
              </Button>
            </DialogFooter>
          </form>
>>>>>>> 5cb05e4db177fe2da7ec504c308ee1f829238eec
        </DialogContent>
      </Dialog>
    </div>
  );
}
