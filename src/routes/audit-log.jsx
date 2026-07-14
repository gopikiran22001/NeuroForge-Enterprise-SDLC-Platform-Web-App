import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FileClock, Search, Filter, ShieldCheck, Clock, Terminal, User, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { auditLogService } from "@/services/api-services";

export const Route = createFileRoute("/audit-log")({
  head: () => ({
    meta: [
      { title: "Audit Log · NeuroForge Nexus" },
      { name: "description", content: "Platform system activity and tenant audit trails." },
    ],
  }),
  component: AuditLogPage,
});

function AuditLogPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("ALL");
  
  // Pagination
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await auditLogService.search({
        severity: severityFilter,
        search: search || undefined,
        page,
        size: 15,
      });
      setLogs(res.content || []);
      setTotalPages(res.totalPages || 0);
      setTotalElements(res.totalElements || 0);
    } catch (err) {
      toast.error(err.message || "Failed to load system audit trails");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [severityFilter, page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(0);
    fetchData();
  };

  const getSeverityBadge = (sev) => {
    switch (sev) {
      case "CRITICAL": return "bg-destructive/15 text-destructive border-destructive/20";
      case "WARNING": return "bg-warning/15 text-warning border-warning/20";
      default: return "bg-success/15 text-success border-success/20";
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto space-y-6">
      <header className="flex items-end justify-between gap-4 pb-6 border-b hairline">
        <div>
          <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            Compliance & Security
          </div>
          <h1 className="font-display text-3xl mt-1 flex items-center gap-2">
            <FileClock className="size-6 text-primary" /> Audit Log
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            View immutable system events, security configurations, and user administrative activity.
          </p>
        </div>
      </header>

      {/* KPI Stats Panel */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="rounded-xl border hairline bg-card p-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Logged Activities</div>
          <div className="text-2xl font-bold mt-1 font-display">{totalElements} events</div>
        </div>
        <div className="rounded-xl border hairline bg-card p-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Filter Matches</div>
          <div className="text-2xl font-bold mt-1 text-primary font-display">
            {logs.length} on page
          </div>
        </div>
        <div className="rounded-xl border hairline bg-card p-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Audit Status</div>
          <div className="text-2xl font-bold mt-1 text-success font-display">Compliant</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-xs flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              placeholder="Search audit trail..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9 text-xs"
            />
          </div>
          <Button type="submit" size="sm" className="h-9 text-xs">Search</Button>
        </form>

        <Select value={severityFilter} onValueChange={(val) => { setSeverityFilter(val); setPage(0); }}>
          <SelectTrigger className="w-40 h-9 text-xs bg-background">
            <Filter className="size-3 mr-1 text-muted-foreground" />
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Severities</SelectItem>
            <SelectItem value="INFO">INFO</SelectItem>
            <SelectItem value="WARNING">WARNING</SelectItem>
            <SelectItem value="CRITICAL">CRITICAL</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Audit Logs Table */}
      <div className="rounded-xl border hairline bg-card overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-muted-foreground text-xs gap-2">
            <Loader2 className="size-6 animate-spin text-primary" />
            Loading security logs...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px] text-left">
              <thead>
                <tr className="border-b hairline text-muted-foreground uppercase text-[10px] tracking-wider bg-surface/50">
                  <th className="py-3 px-4">Log ID</th>
                  <th className="py-3 px-3">Actor</th>
                  <th className="py-3 px-3">Action performed</th>
                  <th className="py-3 px-3">Target resource</th>
                  <th className="py-3 px-3">IP Address</th>
                  <th className="py-3 px-3">Timestamp</th>
                  <th className="py-3 pr-4 pl-3 text-right">Severity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {logs.map((l) => (
                  <tr key={l.id} className="hover:bg-accent/20 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-foreground text-[11px] truncate max-w-[120px]">{l.id}</td>
                    <td className="py-3 px-3 font-semibold text-foreground">
                      <div className="flex flex-col">
                        <span>{l.actorName}</span>
                        <span className="text-[10px] text-muted-foreground font-normal">{l.actorEmail}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-medium text-foreground">{l.action}</td>
                    <td className="py-3 px-3 text-muted-foreground font-mono text-[11px]">
                      {l.entityType} {l.entityId && `(${l.entityId.substring(0, 8)})`}
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-muted-foreground">{l.ipAddress || "—"}</td>
                    <td className="py-3 px-3 text-muted-foreground">
                      {new Date(l.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 pr-4 pl-3 text-right font-mono">
                      <span className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border",
                        getSeverityBadge(l.severity)
                      )}>
                        {l.severity}
                      </span>
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-muted-foreground text-xs italic">
                      No security audit trails match the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination controls */}
      {!loading && totalPages > 1 && (
        <div className="flex justify-end gap-2 text-xs">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            Previous
          </Button>
          <span className="py-1.5 px-3 border border-input rounded-md bg-card">
            Page {page + 1} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
