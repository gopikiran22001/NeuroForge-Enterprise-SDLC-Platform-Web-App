import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Rocket, Plus, Search, Filter, Calendar, Tag, ChevronRight, FileText, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/releases")({
  head: () => ({
    meta: [
      { title: "Releases · NeuroForge Nexus" },
      { name: "description", content: "Production version releases and lifecycle changelogs." },
    ],
  }),
  component: ReleasesPage,
});

const INITIAL_RELEASES = [
  { version: "v4.2.0-rc2", name: "Release Candidate 2", status: "STAGING", author: "Priya Patel", publishedAt: "2026-07-14T11:20:00Z", changelog: ["Optimized DB indexes", "Fixed auth token refresh queueing", "Added role sidebar guards"] },
  { version: "v4.2.0-beta4", name: "Beta Release 4", status: "QA", author: "Alex Chen", publishedAt: "2026-07-10T12:05:00Z", changelog: ["Integrated organizational active endpoint", "Added confirmation dialogs", "Fixed register.jsx imports"] },
  { version: "v4.1.2", name: "Production Rollout", status: "PRODUCTION", author: "David Kim", publishedAt: "2026-07-01T08:44:00Z", changelog: ["Migrated UI frame to shadcn sidebar", "Completed JWT security authentication layer", "Polished profile settings dashboard"] },
];

function ReleasesPage() {
  const [releases, setReleases] = useState(INITIAL_RELEASES);
  const [search, setSearch] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [version, setVersion] = useState("");
  const [releaseName, setReleaseName] = useState("");
  const [status, setStatus] = useState("QA");
  const [changelogStr, setChangelogStr] = useState("");

  const handleCreateRelease = (e) => {
    e.preventDefault();
    if (!version || !releaseName) {
      toast.error("Version tag and Release Name are required.");
      return;
    }
    const newRelease = {
      version,
      name: releaseName,
      status,
      author: "Priya Patel",
      publishedAt: new Date().toISOString(),
      changelog: changelogStr.split("\n").filter(line => line.trim() !== ""),
    };
    setReleases([newRelease, ...releases]);
    setDialogOpen(false);
    toast.success(`Release ${version} published successfully!`);
  };

  const getStatusBadge = (st) => {
    switch (st) {
      case "PRODUCTION": return "bg-success/15 text-success border-success/20";
      case "STAGING": return "bg-primary-soft text-primary border-primary/20";
      case "QA": return "bg-warning/15 text-warning border-warning/20";
      default: return "bg-muted text-muted-foreground border-border/20";
    }
  };

  const filteredReleases = releases.filter(r => 
    r.version.toLowerCase().includes(search.toLowerCase()) || 
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 md:p-8 max-w-[1200px] mx-auto space-y-6">
      <header className="flex items-end justify-between gap-4 pb-6 border-b hairline">
        <div>
          <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            Delivery Lifecycle
          </div>
          <h1 className="font-display text-3xl mt-1 flex items-center gap-2">
            <Rocket className="size-6 text-primary" /> Releases
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track tagged builds, release notes, and active deployment targets across the platform.
          </p>
        </div>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="size-3.5 mr-1" /> New Release Version
        </Button>
      </header>

      {/* KPI Stats Panel */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="rounded-xl border hairline bg-card p-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Active Production Version</div>
          <div className="text-2xl font-bold mt-1 text-success font-mono">v4.1.2</div>
        </div>
        <div className="rounded-xl border hairline bg-card p-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Staging Target</div>
          <div className="text-2xl font-bold mt-1 text-primary font-mono">v4.2.0-rc2</div>
        </div>
        <div className="rounded-xl border hairline bg-card p-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Releases</div>
          <div className="text-2xl font-bold mt-1 font-display">{releases.length} tags</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Search release tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 text-xs"
          />
        </div>
      </div>

      {/* Release Timeline */}
      <div className="space-y-6">
        {filteredReleases.map(rel => (
          <div key={rel.version} className="rounded-xl border hairline bg-card p-6 space-y-4">
            <div className="flex items-start justify-between flex-wrap gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-lg font-bold text-foreground">{rel.version}</span>
                  <span className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold border uppercase",
                    getStatusBadge(rel.status)
                  )}>
                    {rel.status}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-foreground mt-1">{rel.name}</h3>
              </div>
              <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Calendar className="size-3.5" /> Published: {new Date(rel.publishedAt).toLocaleDateString()} · By {rel.author}
              </div>
            </div>

            <div className="space-y-2 pt-3 border-t border-border/10">
              <h4 className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                <FileText className="size-3.5" /> Changelog & Features
              </h4>
              <ul className="list-disc pl-4 text-xs text-foreground space-y-1">
                {rel.changelog.map((change, idx) => (
                  <li key={idx} className="leading-relaxed">{change}</li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md bg-card border hairline">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Cut Release Version</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateRelease} className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="version">Version Tag</Label>
                <Input
                  id="version"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  placeholder="e.g. v4.2.0"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="status">Target Environment</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PRODUCTION">Production</SelectItem>
                    <SelectItem value="STAGING">Staging</SelectItem>
                    <SelectItem value="QA">QA Sandbox</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="releaseName">Release Name / Subtitle</Label>
              <Input
                id="releaseName"
                value={releaseName}
                onChange={(e) => setReleaseName(e.target.value)}
                placeholder="e.g. Core Database Patch"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="changelog">Changelog (one entry per line)</Label>
              <textarea
                id="changelog"
                value={changelogStr}
                onChange={(e) => setChangelogStr(e.target.value)}
                placeholder="Added telemetry dashboards&#10;Fixed authentication memory leaks&#10;Updated role constraints"
                rows={4}
                className="w-full text-xs bg-background border border-input rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <DialogFooter className="pt-4 border-t hairline mt-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Publish Release</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
