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
import { deploymentService, buildService } from "@/services/api-services";
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
  const [stats, setStats] = useState({ totalDeployments: 0, successfulDeployments: 0, failedDeployments: 0 });
  const [loading, setLoading] = useState(true);

  // Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [buildId, setBuildId] = useState("");
  const [environment, setEnvironment] = useState("PRODUCTION");
  const [version, setVersion] = useState("v1.0.0");
  const [releaseNotes, setReleaseNotes] = useState("");
  const [status, setStatus] = useState("SUCCESS");

  const canDeploy = currentUser?.role === "admin" || currentUser?.role === "devops" || currentUser?.role === "super_admin";

  const fetchData = async () => {
    setLoading(true);
    try {
      const [depRes, buildsRes, statsRes] = await Promise.all([
        deploymentService.search({ size: 100 }).catch(() => ({ content: [] })),
        buildService.search({ size: 100 }).catch(() => ({ content: [] })),
        deploymentService.getStats().catch(() => ({ totalDeployments: 0, successfulDeployments: 0, failedDeployments: 0 })),
      ]);
      setDeployments(depRes.content || []);
      setBuilds(buildsRes.content || []);
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
    if (!buildId || !version) {
      toast.error("Build selection and version string are required.");
      return;
    }

    setFormLoading(true);
    try {
      await deploymentService.create({
        buildId,
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
          <Button size="sm" onClick={() => { setBuildId(builds[0]?.id || ""); setDialogOpen(true); }}>
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
                <th className="py-3 pr-4 pl-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    <Loader2 className="size-5 animate-spin mx-auto mb-2 text-primary" /> Loading deployment history...
                  </td>
                </tr>
              ) : deployments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground text-xs">
                    No deployments recorded yet.
                  </td>
                </tr>
              ) : (
                deployments.map((d) => (
                  <tr key={d.id} className="hover:bg-accent/20 transition-colors">
                    <td className="py-3 px-4 font-semibold text-foreground">{d.environment}</td>
                    <td className="py-3 px-3 font-mono font-medium text-primary">{d.version}</td>
                    <td className="py-3 px-3 font-mono text-muted-foreground">#{d.buildNumber || "-"}</td>
                    <td className="py-3 px-3 text-muted-foreground">
                      <span className="font-semibold text-foreground">{d.pipelineName || "Pipeline"}</span>
                      {d.projectCode && <span className="text-[10px] font-mono ml-1 text-muted-foreground">({d.projectCode})</span>}
                    </td>
                    <td className="py-3 px-3 text-muted-foreground">
                      {d.deployedAt ? new Date(d.deployedAt).toLocaleString() : "-"}
                    </td>
                    <td className="py-3 pr-4 pl-3 text-right">
                      <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border", getStatusBadge(d.status))}>
                        {d.status}
                      </span>
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
              <Label htmlFor="build">Associated Build</Label>
              <Select value={buildId} onValueChange={setBuildId} disabled={formLoading}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select build" />
                </SelectTrigger>
                <SelectContent>
                  {builds.map((b) => (
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
                {formLoading ? <Loader2 className="size-3.5 animate-spin ml-1" /> : "Record Deployment"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
