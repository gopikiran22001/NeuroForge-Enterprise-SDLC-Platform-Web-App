import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BarChart3, Search, Filter, Download, FileText, PieChart, TrendingUp, Calendar, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Reports · NeuroForge Nexus" },
      { name: "description", content: "Portfolio reports, metrics, and exporter workspace." },
    ],
  }),
  component: ReportsPage,
});

const INITIAL_REPORTS = [
  { id: "rep-01", name: "Sprint Velocity and Completion Analysis", type: "VELOCITY", format: "PDF", size: "2.4 MB", lastGenerated: "2026-07-14T11:20:00Z" },
  { id: "rep-02", name: "Defect Density and Quality QA Report", type: "QUALITY", format: "XLSX", size: "1.2 MB", lastGenerated: "2026-07-13T10:15:00Z" },
  { id: "rep-03", name: "CI/CD Pipeline Build Success Ratios", type: "DEPLOYMENT", format: "PDF", size: "3.1 MB", lastGenerated: "2026-07-12T16:30:00Z" },
  { id: "rep-04", name: "Platform Tenant Usage and Billing Audits", type: "AUDIT", format: "CSV", size: "840 KB", lastGenerated: "2026-07-10T09:40:00Z" },
];

function ReportsPage() {
  const [reports, setReports] = useState(INITIAL_REPORTS);
  const [search, setSearch] = useState("");

  const handleExport = (reportName, format) => {
    toast.success(`Exporting ${reportName} in ${format}...`, {
      description: "Generating requested data, download will begin shortly.",
    });
  };

  const filteredReports = reports.filter(r => 
    r.name.toLowerCase().includes(search.toLowerCase()) || 
    r.type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 md:p-8 max-w-[1200px] mx-auto space-y-6">
      <header className="flex items-end justify-between gap-4 pb-6 border-b hairline">
        <div>
          <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            Business Intelligence
          </div>
          <h1 className="font-display text-3xl mt-1 flex items-center gap-2">
            <BarChart3 className="size-6 text-primary" /> Reports
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Generate and export custom workspace reports, metrics, and lifecycle analytics.
          </p>
        </div>
      </header>

      {/* KPI Stats Panel */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="rounded-xl border hairline bg-card p-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Generated Reports</div>
          <div className="text-2xl font-bold mt-1 font-display">{reports.length} ready</div>
        </div>
        <div className="rounded-xl border hairline bg-card p-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Active Analytics Modules</div>
          <div className="text-2xl font-bold mt-1 text-primary font-display">4 categories</div>
        </div>
        <div className="rounded-xl border hairline bg-card p-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Storage Consumed</div>
          <div className="text-2xl font-bold mt-1 font-display text-success">7.5 MB</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Search reports..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 text-xs"
          />
        </div>
      </div>

      {/* Reports Listing */}
      <div className="space-y-4">
        {filteredReports.map(rep => (
          <div key={rep.id} className="rounded-xl border hairline bg-card p-5 flex items-center justify-between flex-wrap gap-4 hover:border-primary/20 transition-all">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-lg bg-primary-soft text-primary flex items-center justify-center">
                <FileText className="size-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">{rep.name}</h3>
                <div className="text-[11px] text-muted-foreground mt-0.5 uppercase tracking-wider">
                  Type: {rep.type} · Size: {rep.size} · Format: {rep.format}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <div className="text-muted-foreground flex items-center gap-1">
                <Calendar className="size-3.5" /> Generated: {new Date(rep.lastGenerated).toLocaleDateString()}
              </div>

              <Button
                variant="outline"
                size="xs"
                className="h-8"
                onClick={() => handleExport(rep.name, rep.format)}
              >
                <Download className="size-3.5 mr-1" /> Export {rep.format}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
