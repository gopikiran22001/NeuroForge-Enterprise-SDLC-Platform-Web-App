import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Rocket,
  Search,
  Calendar,
  FileText,
  CheckCircle2,
  XCircle,
  Loader2,
  Plus,
  ShieldCheck,
  RotateCcw,
  Play,
  Layers,
  Filter,
  Tag,
  GitBranch,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { releaseService, projectService, pipelineService, buildService } from "@/services/api-services";
import { useSession } from "@/lib/session";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { fmtDate } from "@/lib/format";

export const Route = createFileRoute("/releases")({
  head: () => ({
    meta: [
      { title: "Release Management · NeuroForge Nexus" },
      { name: "description", content: "Platform release versioning, approvals, deployments, and rollback tracking." },
    ],
  }),
  component: ReleasesPage,
});

function ReleasesPage() {
  const { user: currentUser } = useSession();
  const [releases, setReleases] = useState([]);
  const [projects, setProjects] = useState([]);
  const [pipelines, setPipelines] = useState([]);
  const [builds, setBuilds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Create Release Dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [projectId, setProjectId] = useState("");
  const [version, setVersion] = useState("v1.2.0");
  const [name, setName] = useState("");
  const [releaseType, setReleaseType] = useState("MINOR");
  const [environment, setEnvironment] = useState("PRODUCTION");
  const [sourceBranch, setSourceBranch] = useState("main");
  const [sourceTag, setSourceTag] = useState("");
  const [sourceCommit, setSourceCommit] = useState("");
  const [pipelineId, setPipelineId] = useState("");
  const [buildId, setBuildId] = useState("");
  const [releaseNotes, setReleaseNotes] = useState("");

  // Rollback Dialog
  const [rollbackOpen, setRollbackOpen] = useState(false);
  const [selectedRelease, setSelectedRelease] = useState(null);
  const [rollbackReason, setRollbackReason] = useState("");
  const [rollbackLoading, setRollbackLoading] = useState(false);

  const canCreate = ["admin", "pm", "devops", "super_admin"].includes(currentUser?.role);
  const canApprove = ["admin", "pm", "super_admin"].includes(currentUser?.role);
  const canDeploy = ["admin", "devops", "super_admin"].includes(currentUser?.role);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [relRes, projRes, pipeRes, buildRes] = await Promise.all([
        releaseService.search({ size: 100 }).catch(() => ({ content: [] })),
        projectService.search({ size: 100 }).catch(() => ({ content: [] })),
        pipelineService.search({ size: 100 }).catch(() => ({ content: [] })),
        buildService.search({ size: 100 }).catch(() => ({ content: [] })),
      ]);
      setReleases(relRes.content || []);
      setProjects(projRes.content || []);
      setPipelines(pipeRes.content || []);
      setBuilds(buildRes.content || []);
    } catch (err) {
      console.error("Failed to load releases:", err);
      toast.error("Failed to load release management data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateRelease = async (e) => {
    e.preventDefault();
    if (!projectId || !version || !name) {
      toast.error("Project, version, and name are required.");
      return;
    }

    setFormLoading(true);
    try {
      await releaseService.create({
        projectId,
        version,
        name,
        releaseType,
        environment,
        sourceBranch,
        sourceTag,
        sourceCommit,
        pipelineId: pipelineId || null,
        buildId: buildId || null,
        releaseNotes,
        status: "DRAFT",
      });
      toast.success(`Release ${version} created successfully.`);
      setCreateOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.message || "Failed to create release");
    } finally {
      setFormLoading(false);
    }
  };

  const handleApprove = async (relId) => {
    try {
      await releaseService.approve(relId);
      toast.success("Release approved for target deployment.");
      fetchData();
    } catch (err) {
      toast.error(err.message || "Failed to approve release");
    }
  };

  const handleDeploy = async (relId, env) => {
    try {
      await releaseService.deploy(relId, env);
      toast.success(`Release deployment initiated to ${env}.`);
      fetchData();
    } catch (err) {
      toast.error(err.message || "Failed to deploy release");
    }
  };

  const handleRollback = async (e) => {
    e.preventDefault();
    if (!selectedRelease) return;
    setRollbackLoading(true);
    try {
      await releaseService.rollback(selectedRelease.id, rollbackReason);
      toast.success(`Rollback executed for release ${selectedRelease.version}.`);
      setRollbackOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.message || "Rollback operation failed");
    } finally {
      setRollbackLoading(false);
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
      case "DEPLOYED":
        return "text-success bg-success/10 border-success/30";
      case "APPROVED":
        return "text-primary bg-primary/10 border-primary/30";
      case "IN_PROGRESS":
        return "text-warning bg-warning/10 border-warning/30";
      case "ROLLED_BACK":
      case "FAILED":
        return "text-destructive bg-destructive/10 border-destructive/30";
      default:
        return "text-muted-foreground bg-muted border-border/30";
    }
  };

  const filtered = releases.filter((r) => {
    const term = search.toLowerCase();
    const matchesSearch =
      !term ||
      r.version?.toLowerCase().includes(term) ||
      r.name?.toLowerCase().includes(term) ||
      r.releaseNotes?.toLowerCase().includes(term) ||
      r.projectCode?.toLowerCase().includes(term);
    const matchesStatus = statusFilter === "ALL" || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const latestProd = releases.find((r) => r.environment === "PRODUCTION" && r.status === "DEPLOYED");
  const activeCount = releases.filter((r) => r.status === "DEPLOYED").length;
  const approvedCount = releases.filter((r) => r.status === "APPROVED").length;

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto space-y-6">
      <header className="flex items-end justify-between gap-4 pb-6 border-b hairline">
        <div>
          <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            Release Management & Deployment Traceability
          </div>
          <h1 className="font-display text-3xl mt-1 flex items-center gap-2">
            <Rocket className="size-6 text-primary" /> Releases
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Cut version releases, approve release gates, deploy to environments, and track rollback availability.
          </p>
        </div>
        {canCreate && (
          <Button size="sm" onClick={() => { setProjectId(projects[0]?.id || ""); setCreateOpen(true); }}>
            <Plus className="size-3.5 mr-1" /> Cut New Release
          </Button>
        )}
      </header>

      {/* KPI Stats Panel */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border hairline bg-card p-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Active Production Version</div>
          <div className="text-2xl font-bold mt-1 text-success font-mono">
            {latestProd ? latestProd.version : "v1.2.0"}
          </div>
        </div>
        <div className="rounded-xl border hairline bg-card p-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Deployed Releases</div>
          <div className="text-2xl font-bold mt-1 text-primary font-mono">{activeCount}</div>
        </div>
        <div className="rounded-xl border hairline bg-card p-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Releases Pending Deployment</div>
          <div className="text-2xl font-bold mt-1 text-warning font-mono">{approvedCount}</div>
        </div>
        <div className="rounded-xl border hairline bg-card p-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Release Artifacts</div>
          <div className="text-2xl font-bold mt-1 font-display">{releases.length}</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Search release version, name, or notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 text-xs"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 w-[160px] text-xs">
              <Filter className="size-3 mr-1 text-muted-foreground" />
              <SelectValue placeholder="Status Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="DRAFT">DRAFT</SelectItem>
              <SelectItem value="APPROVED">APPROVED</SelectItem>
              <SelectItem value="IN_PROGRESS">IN_PROGRESS</SelectItem>
              <SelectItem value="DEPLOYED">DEPLOYED</SelectItem>
              <SelectItem value="ROLLED_BACK">ROLLED_BACK</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Release Timeline / Cards */}
      {loading ? (
        <div className="py-16 text-center text-xs text-muted-foreground flex justify-center items-center gap-2">
          <Loader2 className="size-5 animate-spin text-primary" /> Loading release management data...
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border hairline bg-card p-8 text-center text-xs text-muted-foreground">
          No releases recorded matching current filters. Cut a new release to start tracking.
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((rel) => (
            <div key={rel.id} className="rounded-xl border hairline bg-card p-6 space-y-4">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xl font-bold text-foreground">{rel.version}</span>
                    <span className="text-sm font-semibold text-foreground">({rel.name})</span>
                    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold border uppercase", getEnvBadge(rel.environment))}>
                      {rel.environment}
                    </span>
                    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold border uppercase", getStatusBadge(rel.status))}>
                      {rel.status}
                    </span>
                    {rel.releaseType && (
                      <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[9px] font-mono bg-accent/40 text-muted-foreground uppercase border border-border/20">
                        <Tag className="size-3" /> {rel.releaseType}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 flex items-center gap-3 flex-wrap font-mono">
                    <span>Project: {rel.projectCode || "SDLC"}</span>
                    <span>Pipeline: {rel.pipelineName || "Default CI"}</span>
                    {rel.buildNumber && <span>Build #{rel.buildNumber}</span>}
                    {rel.sourceBranch && <span className="flex items-center gap-1"><GitBranch className="size-3" /> {rel.sourceBranch}</span>}
                  </div>
                </div>

                {/* Release Gate Actions */}
                <div className="flex items-center gap-2">
                  {rel.status === "DRAFT" && canApprove && (
                    <Button size="sm" variant="outline" className="h-8 text-xs border-primary/30 text-primary" onClick={() => handleApprove(rel.id)}>
                      <ShieldCheck className="size-3.5 mr-1 text-primary" /> Approve Release
                    </Button>
                  )}
                  {(rel.status === "APPROVED" || rel.status === "DRAFT") && canDeploy && (
                    <Button size="sm" className="h-8 text-xs" onClick={() => handleDeploy(rel.id, rel.environment)}>
                      <Play className="size-3.5 mr-1" /> Deploy to {rel.environment}
                    </Button>
                  )}
                  {rel.status === "DEPLOYED" && canDeploy && (
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-8 text-xs"
                      onClick={() => { setSelectedRelease(rel); setRollbackReason(""); setRollbackOpen(true); }}
                    >
                      <RotateCcw className="size-3.5 mr-1" /> Rollback
                    </Button>
                  )}
                </div>
              </div>

              {rel.description && (
                <p className="text-xs text-muted-foreground leading-relaxed">{rel.description}</p>
              )}

              {/* Release Notes */}
              <div className="space-y-2 pt-3 border-t border-border/10">
                <h4 className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                  <FileText className="size-3.5" /> Release Notes & Changelog
                </h4>
                <div className="text-xs text-foreground bg-background p-3 rounded-lg border hairline whitespace-pre-wrap font-sans leading-relaxed">
                  {rel.releaseNotes || "No release notes provided for this version artifact."}
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2 font-mono">
                <div>Created by: {rel.createdBy || "System"}</div>
                <div className="flex items-center gap-1">
                  <Calendar className="size-3.5" /> Created: {fmtDate(rel.createdAt)}
                  {rel.deployedAt && <span className="ml-2">· Deployed: {fmtDate(rel.deployedAt)}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cut Release Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg bg-card border hairline">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Cut New Release</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateRelease} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="project">Associated Project</Label>
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
              <Label htmlFor="name">Release Name / Title</Label>
              <Input
                id="name"
                placeholder="e.g. Summer Enterprise Features Update"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={formLoading}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Release Type</Label>
                <Select value={releaseType} onValueChange={setReleaseType} disabled={formLoading}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MAJOR">MAJOR</SelectItem>
                    <SelectItem value="MINOR">MINOR</SelectItem>
                    <SelectItem value="PATCH">PATCH</SelectItem>
                    <SelectItem value="HOTFIX">HOTFIX</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Target Environment</Label>
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
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Associated Pipeline</Label>
                <Select value={pipelineId} onValueChange={setPipelineId} disabled={formLoading}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select pipeline (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {pipelines.map((pl) => (
                      <SelectItem key={pl.id} value={pl.id}>
                        {pl.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Associated Build</Label>
                <Select value={buildId} onValueChange={setBuildId} disabled={formLoading}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select build (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {builds.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        Build #{b.buildNumber} - {b.status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes">Release Notes & Changelog</Label>
              <Textarea
                id="notes"
                placeholder="Enter release notes, features, and bugfixes..."
                value={releaseNotes}
                onChange={(e) => setReleaseNotes(e.target.value)}
                rows={3}
                disabled={formLoading}
              />
            </div>

            <DialogFooter className="pt-4 border-t hairline mt-4">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)} disabled={formLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={formLoading}>
                {formLoading ? <Loader2 className="size-3.5 animate-spin ml-1" /> : "Cut Release Artifact"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Rollback Dialog */}
      <Dialog open={rollbackOpen} onOpenChange={setRollbackOpen}>
        <DialogContent className="max-w-md bg-card border hairline">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-destructive">Confirm Release Rollback</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleRollback} className="space-y-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              You are about to initiate an immediate operational rollback for release{" "}
              <strong className="font-mono text-foreground">{selectedRelease?.version}</strong> on{" "}
              <strong>{selectedRelease?.environment}</strong>.
            </p>

            <div className="space-y-1.5">
              <Label htmlFor="reason">Rollback Reason</Label>
              <Input
                id="reason"
                placeholder="State reason for rollback (e.g. Critical memory spike)..."
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
                {rollbackLoading ? <Loader2 className="size-3.5 animate-spin ml-1" /> : "Execute Operational Rollback"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
