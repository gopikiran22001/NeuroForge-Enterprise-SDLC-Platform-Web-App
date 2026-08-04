import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Rocket, Search, Calendar, FileText, Server, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { deploymentService } from "@/services/api-services";
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

function ReleasesPage() {
  const [deployments, setDeployments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchReleases = async () => {
    setLoading(true);
    try {
      const res = await deploymentService.search({ size: 100 });
      setDeployments(res.content || []);
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
    return (
      (d.version && d.version.toLowerCase().includes(term)) ||
      (d.environment && d.environment.toLowerCase().includes(term)) ||
      (d.releaseNotes && d.releaseNotes.toLowerCase().includes(term)) ||
      (d.pipelineName && d.pipelineName.toLowerCase().includes(term))
    );
  });

  const latestProd = deployments.find((d) => d.environment === "PRODUCTION" && d.status === "SUCCESS");
  const latestStaging = deployments.find((d) => d.environment === "STAGING");

  return (
    <div className="p-6 md:p-8 max-w-[1200px] mx-auto space-y-6">
      <header className="flex items-end justify-between gap-4 pb-6 border-b hairline">
        <div>
          <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            Release Management & Deployment History
          </div>
          <h1 className="font-display text-3xl mt-1 flex items-center gap-2">
            <Rocket className="size-6 text-primary" /> Release History
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Version release history derived directly from target environment deployment records.
          </p>
        </div>
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
          <div className="text-2xl font-bold mt-1 font-display">{deployments.length} deployments</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Search version or release notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 text-xs"
          />
        </div>
      </div>

      {/* Release Timeline */}
      {loading ? (
        <div className="py-16 text-center text-xs text-muted-foreground flex justify-center items-center gap-2">
          <Loader2 className="size-5 animate-spin text-primary" /> Loading release history...
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border hairline bg-card p-8 text-center text-xs text-muted-foreground">
          No release history recorded yet. Record deployments to track platform version releases.
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((rel) => (
            <div key={rel.id} className="rounded-xl border hairline bg-card p-6 space-y-4">
              <div className="flex items-start justify-between flex-wrap gap-2">
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
                    <span>· Build #{rel.buildNumber}</span>
                  </h3>
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-1.5 font-mono">
                  <Calendar className="size-3.5" /> Deployed: {fmtDate(rel.deployedAt || rel.createdAt)}
                </div>
              </div>

              <div className="space-y-2 pt-3 border-t border-border/10">
                <h4 className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                  <FileText className="size-3.5" /> Release Notes
                </h4>
                <div className="text-xs text-foreground bg-background p-3 rounded-lg border hairline whitespace-pre-wrap font-sans leading-relaxed">
                  {rel.releaseNotes || "No release notes provided for this deployment."}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
