import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Activity, Clock, Terminal, ShieldAlert, Cpu, Heart, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/monitoring")({
  head: () => ({
    meta: [
      { title: "Monitoring · NeuroForge Nexus" },
      { name: "description", content: "Platform system telemetry and alert monitors." },
    ],
  }),
  component: MonitoringPage,
});

const INITIAL_ALERTS = [
  { id: "evt-01", message: "CPU utilization spike on node-04 (production-cluster)", severity: "WARNING", time: "2026-07-14T12:30:00Z" },
  { id: "evt-02", message: "Postgres database replication delay exceeded 500ms", severity: "CRITICAL", time: "2026-07-14T11:45:00Z" },
  { id: "evt-03", message: "SSL certificate for staging.neuroforge.org renewed", severity: "INFO", time: "2026-07-14T09:12:00Z" },
];

function MonitoringPage() {
  const [alerts, setAlerts] = useState(INITIAL_ALERTS);
  const [latency, setLatency] = useState(124);
  const [cpu, setCpu] = useState(48);

  useEffect(() => {
    const timer = setInterval(() => {
      // Simulate real-time metrics changing slightly
      setLatency(prev => Math.max(80, Math.min(220, prev + Math.floor(Math.random() * 31) - 15)));
      setCpu(prev => Math.max(30, Math.min(95, prev + Math.floor(Math.random() * 9) - 4)));
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const triggerSelfCheck = () => {
    toast.success("All systems operational", {
      description: "Diagnostics successfully completed on database, cluster, and ingress layers.",
    });
  };

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto space-y-6">
      <header className="flex items-end justify-between gap-4 pb-6 border-b hairline">
        <div>
          <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            System Diagnostics
          </div>
          <h1 className="font-display text-3xl mt-1 flex items-center gap-2">
            <Activity className="size-6 text-primary" /> Monitoring
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Real-time server telemetry, alert management, and cluster hardware workloads.
          </p>
        </div>
        <Button size="sm" onClick={triggerSelfCheck}>
          Run Diagnostics Self-Check
        </Button>
      </header>

      {/* Stats KPI Panel */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border hairline bg-card p-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Node Ingress Latency</div>
          <div className="text-2xl font-bold mt-1 text-foreground font-mono transition-all">{latency} ms</div>
        </div>
        <div className="rounded-xl border hairline bg-card p-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Average Cluster CPU Load</div>
          <div className="text-2xl font-bold mt-1 text-foreground font-mono transition-all">{cpu}%</div>
        </div>
        <div className="rounded-xl border hairline bg-card p-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Platform Engine Uptime</div>
          <div className="text-2xl font-bold mt-1 text-success font-display">14 days, 6h</div>
        </div>
        <div className="rounded-xl border hairline bg-card p-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Ingress Alerts</div>
          <div className="text-2xl font-bold mt-1 text-warning font-display">1 active</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: System Telemetry metrics */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl border hairline bg-card p-6 space-y-4">
            <h2 className="text-sm font-semibold flex items-center gap-1.5">
              <Cpu className="size-4 text-primary" /> Active Services Status
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg border hairline bg-surface/50">
                <div>
                  <div className="text-xs font-semibold">neuroforge-core-api</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">Primary Spring Boot REST service</div>
                </div>
                <div className="flex items-center gap-1 text-xs text-success font-medium">
                  <CheckCircle2 className="size-3.5" /> Operational
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border hairline bg-surface/50">
                <div>
                  <div className="text-xs font-semibold">postgres-db-primary</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">Relational database persistent pool</div>
                </div>
                <div className="flex items-center gap-1 text-xs text-success font-medium">
                  <CheckCircle2 className="size-3.5" /> Operational
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border hairline bg-surface/50">
                <div>
                  <div className="text-xs font-semibold">redis-cache-cluster</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">Distributed key-value store cache</div>
                </div>
                <div className="flex items-center gap-1 text-xs text-success font-medium">
                  <CheckCircle2 className="size-3.5" /> Operational
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Alert Timeline events */}
        <div className="rounded-xl border hairline bg-card p-6">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-1.5">
            <ShieldAlert className="size-4 text-warning" /> Incident Alerts Log
          </h2>
          <div className="space-y-4">
            {alerts.map(evt => (
              <div key={evt.id} className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className={cn(
                    "text-[8px] px-1 py-0.5 rounded font-bold uppercase",
                    evt.severity === "CRITICAL" ? "bg-destructive/15 text-destructive" :
                    evt.severity === "WARNING" ? "bg-warning/15 text-warning" : "bg-muted text-muted-foreground"
                  )}>{evt.severity}</span>
                  <span className="text-[10px] text-muted-foreground">{new Date(evt.time).toLocaleTimeString()}</span>
                </div>
                <p className="text-foreground leading-snug font-medium">{evt.message}</p>
                <div className="border-b border-border/10 pt-1.5" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
