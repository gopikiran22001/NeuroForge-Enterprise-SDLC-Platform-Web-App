import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Rocket,
  Search,
  Calendar,
  FileText,
  Server,
  CheckCircle2,
  XCircle,
  Loader2,
  Terminal,
  ArrowUpRight,
  Plus,
  Copy,
  Download,
  Check,
  Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { deploymentService, buildService, pipelineService } from "@/services/api-services";
import { useSession } from "@/lib/session";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { fmtDate } from "@/lib/format";

export const Route = createFileRoute("/releases")({
  head: () => ({
    meta: [
      { title: "Release History · NeuroForge Nexus" },
      { name: "description", content: "Platform deployment release history, version tags, and changelogs." },
    ],
  }),
  component: ReleasesPage,
});

export function ReleasesPage() {
  const { user: currentUser } = useSession();
  const [deployments, setDeployments] = useState([]);
  const [builds, setBuilds] = useState([]);
  const [pipelines, setPipelines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [envFilter, setEnvFilter] = useState("ALL");

  // Create / Promote Release Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [pipelineId, setPipelineId] = useState("");
  const [buildId, setBuildId] = useState("");
  const [environment, setEnvironment] = useState("PRODUCTION");
  const [version, setVersion] = useState("v1.0.0");
  const [releaseNotes, setReleaseNotes] = useState("");

  // Logs Modal State
  const [logsModalOpen, setLogsModalOpen] = useState(false);
  const [selectedRelForLogs, setSelectedRelForLogs] = useState(null);
  const [logsContent, setLogsContent] = useState("");
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsSearch, setLogsSearch] = useState("");
  const [copiedLogs, setCopiedLogs] = useState(false);

  const canRelease = currentUser?.role === "admin" || currentUser?.role === "devops" || currentUser?.role === "super_admin";

  const fetchReleases = async () => {
    setLoading(true);
    try {
      const [depRes, buildRes, pipRes] = await Promise.all([
        deploymentService.search({ size: 100 }).catch(() => ({ content: [] })),
        buildService.search({ size: 100 }).catch(() => ({ content: [] })),
        pipelineService.search({ size: 100 }).catch(() => ({ content: [] })),
      ]);
      setDeployments(depRes.content || []);
      setBuilds(buildRes.content || []);
      setPipelines(pipRes.content || []);
    } catch (err) {
      console.error("Failed to load release history:", err);
      toast.error("Failed to load release history from deployments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReleases();
  }, []);

  const handleOpenLogs = async (rel) => {
    setSelectedRelForLogs(rel);
    setLogsModalOpen(true);
    setLogsLoading(true);
    setLogsContent("");
    try {
      const res = await deploymentService.getLogs(rel.id);
      const text = typeof res === "string" ? res : (res?.data || res?.logs || rel.logs || "No runtime logs recorded.");
      setLogsContent(text);
    } catch (err) {
      setLogsContent(rel.logs || "Failed to load release runtime logs.");
    } finally {
      setLogsLoading(false);
    }
  };

  const handleCreateRelease = async (e) => {
    e.preventDefault();
    if (!buildId && !pipelineId) {
      toast.error("Please select a Pipeline or Build for release.");
      return;
    }
    if (!version) {
      toast.error("Release version is required.");
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
        status: "SUCCESS",
        deployedAt: new Date().toISOString(),
      });
      toast.success(`Release ${version} published to ${environment}!`);
      setDialogOpen(false);
      fetchReleases();
    } catch (err) {
      toast.error(err.message || "Failed to publish release");
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

  const filtered = deployments.filter((d) => {
    const term = search.toLowerCase();
    const matchesSearch =
      (d.version && d.version.toLowerCase().includes(term)) ||
      (d.environment && d.environment.toLowerCase().includes(term)) ||
      (d.releaseNotes && d.releaseNotes.toLowerCase().includes(term)) ||
      (d.pipelineName && d.pipelineName.toLowerCase().includes(term));

    const matchesEnv = envFilter === "ALL" || d.environment === envFilter;

    return matchesSearch && matchesEnv;
  });

  const latestProd = deployments.find((d) => d.environment === "PRODUCTION" && d.status === "SUCCESS");
  const latestStaging = deployments.find((d) => d.environment === "STAGING");

  return (
    <div className="p-6 md:p-8 max-w-[1200px] mx-auto space-y-6">
      <header className="flex items-end justify-between gap-4 pb-6 border-b hairline">
        <div>
          <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            Release Management & Version Control
          </div>
          <h1 className="font-display text-3xl mt-1 flex items-center gap-2">
            <Rocket className="size-6 text-primary" /> Release Management
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Version release history derived directly from target environment deployment records.
          </p>
        </div>

        {canRelease && (
          <Button
            size="sm"
            className="h-8 text-xs gap-1.5 bg-primary text-primary-foreground"
            onClick={() => {
              setPipelineId(pipelines[0]?.id || "");
              setBuildId(builds[0]?.id || "");
              setVersion("v1." + (deployments.length + 1) + ".0");
              setReleaseNotes("");
              setEnvironment("PRODUCTION");
              setDialogOpen(true);
            }}
          >
            <Plus className="size-3.5" /> Publish New Release
          </Button>
        )}
      </header>

      {/* KPI Stats Panel */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="rounded-xl border hairline bg-card p-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Active Production Version</div>
          <div className="text-2xl font-bold mt-1 text-success font-mono">
            {latestProd ? latestProd.version : "N/A"}
          </div>
        </div>
        <div className="rounded-xl border hairline bg-card p-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Latest Staging Release</div>
          <div className="text-2xl font-bold mt-1 text-primary font-mono">
            {latestStaging ? latestStaging.version : "N/A"}
          </div>
        </div>
        <div className="rounded-xl border hairline bg-card p-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Releases Recorded</div>
          <div className="text-2xl font-bold mt-1 font-display">{deployments.length} releases</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              placeholder="Search version or release notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9 text-xs"
            />
          </div>

          <Select value={envFilter} onValueChange={setEnvFilter}>
            <SelectTrigger className="w-36 h-9 text-xs bg-background">
              <SelectValue placeholder="Environment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Environments</SelectItem>
              <SelectItem value="PRODUCTION">PRODUCTION</SelectItem>
              <SelectItem value="STAGING">STAGING</SelectItem>
              <SelectItem value="QA">QA</SelectItem>
              <SelectItem value="DEV">DEV</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Release Timeline */}
      {loading ? (
        <div className="py-16 text-center text-xs text-muted-foreground flex justify-center items-center gap-2">
          <Loader2 className="size-5 animate-spin text-primary" /> Loading release history...
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border hairline bg-card p-8 text-center text-xs text-muted-foreground">
          No release history recorded yet. Publish a release to track platform version deployments.
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((rel) => (
            <div key={rel.id} className="rounded-xl border hairline bg-card p-6 space-y-4">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-lg font-bold text-foreground">{rel.version}</span>
                    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold border uppercase", getEnvBadge(rel.environment))}>
                      {rel.environment}
                    </span>
                    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase", getStatusBadge(rel.status))}>
                      {rel.status}
                    </span>
                  </div>
                  <h3 className="text-xs font-mono text-muted-foreground mt-1 flex items-center gap-2">
                    <span>Pipeline: {rel.pipelineName || "CI Pipeline"}</span>
                    <span>· Build #{rel.buildNumber || "-"}</span>
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-xs text-muted-foreground flex items-center gap-1.5 font-mono mr-2">
                    <Calendar className="size-3.5" /> Deployed: {fmtDate(rel.deployedAt || rel.createdAt)}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs px-2.5 gap-1"
                    onClick={() => handleOpenLogs(rel)}
                  >
                    <Terminal className="size-3 text-primary" /> Runtime Logs
                  </Button>

                  {canRelease && rel.environment !== "PRODUCTION" && (
                    <Button
                      size="sm"
                      className="h-7 text-xs px-2.5 gap-1 bg-primary text-primary-foreground"
                      onClick={() => {
                        setPipelineId(rel.pipelineId || pipelines[0]?.id || "");
                        setBuildId(rel.buildId || "");
                        setVersion(rel.version || "v1.0.0");
                        setReleaseNotes(`Promoting version ${rel.version} from ${rel.environment} to PRODUCTION`);
                        setEnvironment("PRODUCTION");
                        setDialogOpen(true);
                      }}
                    >
                      <ArrowUpRight className="size-3" /> Promote to Prod
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-2 pt-3 border-t border-border/10">
                <h4 className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                  <FileText className="size-3.5" /> Release Notes
                </h4>
                <div className="text-xs text-foreground bg-background p-3 rounded-lg border hairline whitespace-pre-wrap font-sans leading-relaxed">
                  {rel.releaseNotes || "No release notes provided for this deployment release."}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Promote Release Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md bg-card border hairline">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Publish Release</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateRelease} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <Label htmlFor="relPipeline" className="font-semibold">Associated Pipeline *</Label>
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
              <Label htmlFor="relBuild" className="font-semibold">Associated Build</Label>
              <Select value={buildId} onValueChange={(val) => setBuildId(val === "LATEST" ? "" : val)} disabled={formLoading}>
                <SelectTrigger className="bg-background h-9 text-xs">
                  <SelectValue placeholder="Select build..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LATEST">-- Deploy Latest Build / Commit --</SelectItem>
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
                <Label htmlFor="relEnv" className="font-semibold">Target Environment</Label>
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
                <Label htmlFor="relVersion" className="font-semibold">Release Version Tag *</Label>
                <Input
                  id="relVersion"
                  placeholder="v1.2.0"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  required
                  disabled={formLoading}
                  className="h-9 text-xs font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="relNotes" className="font-semibold">Release Notes / Changelog</Label>
              <Input
                id="relNotes"
                placeholder="Release changelog summary..."
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
                {formLoading ? <Loader2 className="size-3.5 animate-spin" /> : <Rocket className="size-3.5" />}
                Publish Release
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Release Runtime Logs Modal */}
      <Dialog open={logsModalOpen} onOpenChange={setLogsModalOpen}>
        <DialogContent className="max-w-3xl bg-card border hairline overflow-hidden flex flex-col max-h-[85vh]">
          <DialogHeader className="pb-3 border-b hairline">
            <DialogTitle className="font-display text-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="size-5 text-primary" />
                <span>Release Runtime Execution Logs</span>
              </div>
              {selectedRelForLogs && (
                <div className="flex items-center gap-2 text-xs font-mono font-normal mr-6">
                  <span className="bg-muted px-2 py-0.5 rounded">{selectedRelForLogs.environment}</span>
                  <span className="text-primary font-semibold">{selectedRelForLogs.version}</span>
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
                    toast.success("Release logs copied to clipboard");
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
                    a.download = `release-${selectedRelForLogs?.environment || "logs"}-${selectedRelForLogs?.version || "run"}.log`;
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
                  <Loader2 className="size-4 animate-spin text-primary" /> Loading live release runtime logs...
                </div>
              ) : !logsContent ? (
                <div className="h-full flex items-center justify-center text-slate-500 py-12">
                  No log output generated for this release.
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
