import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Workflow, Play, Search, Filter, Clock, CheckCircle2, XCircle, AlertCircle, RefreshCw, ChevronRight, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/pipelines")({
  head: () => ({
    meta: [
      { title: "Pipelines · NeuroForge Nexus" },
      { name: "description", content: "CI/CD automated build and delivery pipelines." },
    ],
  }),
  component: PipelinesPage,
});

const INITIAL_RUNS = [
  { id: "run-342", pipeline: "core-backend-ci", branch: "main", commit: "a4f21d4", status: "SUCCESS", duration: "3m 45s", trigger: "webhook", startedAt: "2026-07-14T11:20:00Z" },
  { id: "run-341", pipeline: "nexus-frontend-ci", branch: "main", commit: "fe34a2e", status: "RUNNING", duration: "1m 12s", trigger: "manual", startedAt: "2026-07-14T12:05:00Z" },
  { id: "run-340", pipeline: "core-backend-ci", branch: "feature/auth", commit: "67e12d4", status: "FAILED", duration: "2m 10s", trigger: "webhook", startedAt: "2026-07-14T10:15:00Z" },
  { id: "run-339", pipeline: "infrastructure-cd", branch: "main", commit: "98ab45c", status: "SUCCESS", duration: "5m 20s", trigger: "webhook", startedAt: "2026-07-13T16:30:00Z" },
  { id: "run-338", pipeline: "pipelines-runner-ci", branch: "master", commit: "bd234a5", status: "SUCCESS", duration: "1m 55s", trigger: "webhook", startedAt: "2026-07-13T09:40:00Z" },
];

const PIPELINE_NAMES = ["core-backend-ci", "nexus-frontend-ci", "infrastructure-cd", "pipelines-runner-ci"];

function PipelinesPage() {
  const [runs, setRuns] = useState(INITIAL_RUNS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [pipelineFilter, setPipelineFilter] = useState("ALL");
  const [triggerLoading, setTriggerLoading] = useState(false);

  const handleTriggerPipeline = async (pipelineName) => {
    setTriggerLoading(true);
    toast.info(`Triggering build pipeline: ${pipelineName}...`);
    setTimeout(() => {
      const newRun = {
        id: `run-${300 + runs.length + 125}`,
        pipeline: pipelineName,
        branch: "main",
        commit: "dev-" + Math.random().toString(36).substring(2, 9),
        status: "RUNNING",
        duration: "0m 01s",
        trigger: "manual",
        startedAt: new Date().toISOString(),
      };
      setRuns([newRun, ...runs]);
      setTriggerLoading(false);
      toast.success(`Pipeline run ${newRun.id} started successfully!`);
    }, 1200);
  };

  const filteredRuns = runs.filter(r => {
    const matchesSearch = r.pipeline.toLowerCase().includes(search.toLowerCase()) || r.id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "ALL" ? true : r.status === statusFilter;
    const matchesPipeline = pipelineFilter === "ALL" ? true : r.pipeline === pipelineFilter;
    return matchesSearch && matchesStatus && matchesPipeline;
  });

  const getStatusIcon = (st) => {
    switch (st) {
      case "SUCCESS": return <CheckCircle2 className="size-4 text-success" />;
      case "FAILED": return <XCircle className="size-4 text-destructive" />;
      case "RUNNING": return <RefreshCw className="size-4 text-primary animate-spin" />;
      default: return <AlertCircle className="size-4 text-warning" />;
    }
  };

  const getStatusBadge = (st) => {
    switch (st) {
      case "SUCCESS": return "bg-success/15 text-success border-success/20";
      case "FAILED": return "bg-destructive/15 text-destructive border-destructive/20";
      case "RUNNING": return "bg-primary-soft text-primary border-primary/20";
      default: return "bg-warning/15 text-warning border-warning/20";
    }
  };

  const successCount = runs.filter(r => r.status === "SUCCESS").length;
  const totalCompleted = runs.filter(r => r.status !== "RUNNING").length;
  const successRate = totalCompleted > 0 ? ((successCount / totalCompleted) * 100).toFixed(1) : "0.0";

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto space-y-6">
      <header className="flex items-end justify-between gap-4 pb-6 border-b hairline">
        <div>
          <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            Continuous Integration
          </div>
          <h1 className="font-display text-3xl mt-1 flex items-center gap-2">
            <Workflow className="size-6 text-primary" /> Pipelines
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Monitor containerized build pipelines, validation runs, and testing processes.
          </p>
        </div>
        <Select onValueChange={handleTriggerPipeline}>
          <SelectTrigger className="w-52 h-9 text-xs bg-primary text-primary-foreground hover:opacity-90">
            <Play className="size-3.5 mr-1 fill-current" />
            <SelectValue placeholder="Manual Build Trigger" />
          </SelectTrigger>
          <SelectContent>
            {PIPELINE_NAMES.map(p => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </header>

      {/* KPI Stats Panel */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border hairline bg-card p-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Pipeline Health</div>
          <div className="text-2xl font-bold mt-1 text-success font-display">{successRate}%</div>
        </div>
        <div className="rounded-xl border hairline bg-card p-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Running Job</div>
          <div className="text-2xl font-bold mt-1 text-primary font-display">
            {runs.filter(r => r.status === "RUNNING").length}
          </div>
        </div>
        <div className="rounded-xl border hairline bg-card p-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Avg Build Duration</div>
          <div className="text-2xl font-bold mt-1 font-display">3m 12s</div>
        </div>
        <div className="rounded-xl border hairline bg-card p-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Runs today</div>
          <div className="text-2xl font-bold mt-1 font-display">{runs.length}</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Search runs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 text-xs"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36 h-9 text-xs bg-background">
            <Filter className="size-3 mr-1 text-muted-foreground" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="SUCCESS">SUCCESS</SelectItem>
            <SelectItem value="FAILED">FAILED</SelectItem>
            <SelectItem value="RUNNING">RUNNING</SelectItem>
          </SelectContent>
        </Select>

        <Select value={pipelineFilter} onValueChange={setPipelineFilter}>
          <SelectTrigger className="w-48 h-9 text-xs bg-background">
            <SelectValue placeholder="Pipeline" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Pipelines</SelectItem>
            {PIPELINE_NAMES.map(p => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Runs Table */}
      <div className="rounded-xl border hairline bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px] text-left">
            <thead>
              <tr className="border-b hairline text-muted-foreground uppercase text-[10px] tracking-wider bg-surface/50">
                <th className="py-3 px-4">Run ID</th>
                <th className="py-3 px-3">Pipeline Name</th>
                <th className="py-3 px-3">Branch / Commit</th>
                <th className="py-3 px-3">Trigger</th>
                <th className="py-3 px-3">Duration</th>
                <th className="py-3 px-3">Started</th>
                <th className="py-3 pr-4 pl-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {filteredRuns.map((r) => (
                <tr key={r.id} className="hover:bg-accent/20 transition-colors">
                  <td className="py-3 px-4 font-mono font-medium text-foreground">{r.id}</td>
                  <td className="py-3 px-3 font-semibold text-foreground">{r.pipeline}</td>
                  <td className="py-3 px-3">
                    <span className="font-mono text-muted-foreground">{r.branch}</span>
                    <span className="text-[11px] text-muted-foreground ml-1.5 font-mono">@{r.commit}</span>
                  </td>
                  <td className="py-3 px-3 capitalize text-muted-foreground">{r.trigger}</td>
                  <td className="py-3 px-3 font-mono text-muted-foreground flex items-center gap-1">
                    <Clock className="size-3.5" /> {r.duration}
                  </td>
                  <td className="py-3 px-3 text-muted-foreground">
                    {new Date(r.startedAt).toLocaleTimeString()}
                  </td>
                  <td className="py-3 pr-4 pl-3 text-right">
                    <span className={cn(
                      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border",
                      getStatusBadge(r.status)
                    )}>
                      {getStatusIcon(r.status)}
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
