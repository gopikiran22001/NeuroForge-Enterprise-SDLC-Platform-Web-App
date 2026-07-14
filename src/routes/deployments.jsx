import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Server, Activity, ArrowUpRight, CheckCircle2, AlertCircle, PlayCircle, Clock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
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

const INITIAL_ENVIRONMENTS = [
  { id: "production", name: "Production Environment", url: "https://neuroforge-prod.stdace.com", activeRelease: "v4.1.2", healthStatus: "HEALTHY", cpuUsage: 45, memoryUsage: 68, lastDeployed: "2026-07-10T14:32:00Z" },
  { id: "staging", name: "Staging Environment", url: "https://neuroforge-staging.stdace.com", activeRelease: "v4.2.0-rc2", healthStatus: "HEALTHY", cpuUsage: 22, memoryUsage: 54, lastDeployed: "2026-07-14T11:20:00Z" },
  { id: "qa", name: "QA / Testing Sandbox", url: "https://neuroforge-qa.stdace.com", activeRelease: "v4.2.0-beta4", healthStatus: "WARNING", cpuUsage: 89, memoryUsage: 92, lastDeployed: "2026-07-14T12:05:00Z" },
];

function DeploymentsPage() {
  const [envs, setEnvs] = useState(INITIAL_ENVIRONMENTS);
  const [deployingId, setDeployingId] = useState(null);

  const triggerDeploy = (envId, releaseVersion) => {
    setDeployingId(envId);
    toast.info(`Deploying ${releaseVersion} to ${envId.toUpperCase()}...`);
    setTimeout(() => {
      setEnvs(envs.map(env => {
        if (env.id === envId) {
          return {
            ...env,
            activeRelease: releaseVersion,
            healthStatus: "HEALTHY",
            cpuUsage: 10,
            memoryUsage: 40,
            lastDeployed: new Date().toISOString(),
          };
        }
        return env;
      }));
      setDeployingId(null);
      toast.success(`Successfully deployed ${releaseVersion} to ${envId.toUpperCase()}`);
    }, 2000);
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
            Manage target server environments, roll out releases, and monitor hardware load metrics.
          </p>
        </div>
      </header>

      {/* KPI Load overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="rounded-xl border hairline bg-card p-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Production Release</div>
          <div className="text-2xl font-bold mt-1 text-foreground font-mono">v4.1.2</div>
        </div>
        <div className="rounded-xl border hairline bg-card p-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Staging Release</div>
          <div className="text-2xl font-bold mt-1 text-primary font-mono">v4.2.0-rc2</div>
        </div>
        <div className="rounded-xl border hairline bg-card p-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Environment Health</div>
          <div className="text-2xl font-bold mt-1 text-success font-display">2 / 3 Healthy</div>
        </div>
      </div>

      {/* Environments Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {envs.map(env => (
          <div key={env.id} className="rounded-xl border hairline bg-card p-6 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg font-bold">{env.name}</h3>
                <span className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border",
                  env.healthStatus === "HEALTHY" ? "bg-success/15 text-success border-success/20" : "bg-warning/15 text-warning border-warning/20"
                )}>
                  {env.healthStatus}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between border-b border-border/10 pb-1.5">
                  <span className="text-muted-foreground">Domain:</span>
                  <a href={env.url} target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-1 font-mono">
                    {env.id}.neuroforge.org <ArrowUpRight className="size-3" />
                  </a>
                </div>
                <div className="flex justify-between border-b border-border/10 pb-1.5">
                  <span className="text-muted-foreground">Active Release:</span>
                  <span className="font-mono text-foreground font-semibold">{env.activeRelease}</span>
                </div>
                <div className="flex justify-between pb-1.5">
                  <span className="text-muted-foreground">Last Deployed:</span>
                  <span className="text-muted-foreground">{new Date(env.lastDeployed).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Hardware metrics */}
              <div className="space-y-3 pt-3 border-t border-border/10">
                <div>
                  <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
                    <span>CPU Core Allocation</span>
                    <span className="font-mono">{env.cpuUsage}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className={cn(
                      "h-full rounded-full",
                      env.cpuUsage > 80 ? "bg-destructive" : env.cpuUsage > 60 ? "bg-warning" : "bg-success"
                    )} style={{ width: `${env.cpuUsage}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
                    <span>Memory Utilization</span>
                    <span className="font-mono">{env.memoryUsage}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className={cn(
                      "h-full rounded-full",
                      env.memoryUsage > 80 ? "bg-destructive" : env.memoryUsage > 60 ? "bg-warning" : "bg-success"
                    )} style={{ width: `${env.memoryUsage}%` }} />
                  </div>
                </div>
              </div>
            </div>

            <Button
              className="w-full text-xs"
              variant={env.id === "production" ? "secondary" : "default"}
              disabled={deployingId !== null}
              onClick={() => triggerDeploy(env.id, env.id === "production" ? "v4.2.0" : "v4.2.0-rc3")}
            >
              {deployingId === env.id ? (
                <>
                  Deploying <RefreshCw className="size-3.5 ml-2 animate-spin" />
                </>
              ) : (
                <>
                  <PlayCircle className="size-3.5 mr-1" /> Deploy Release
                </>
              )}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
