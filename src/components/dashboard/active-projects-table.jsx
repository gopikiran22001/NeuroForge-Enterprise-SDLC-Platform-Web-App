import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowUpDown, Search, Filter, MoreHorizontal, Loader2 } from "lucide-react";
import { fmtDate } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const HEALTH_LABEL = {
  healthy: "Healthy",
  at_risk: "At risk",
  blocked: "Blocked",
};

export function mapBackendProjectToFrontend(p) {
  if (!p) return null;
  // Create deterministic mock details based on the project's properties so the UI keeps its rich metrics
  const hash = p.name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const progress = 25 + (hash % 70);
  const healths = ["healthy", "at_risk", "blocked"];
  const health = healths[hash % healths.length];
  const sprint = 1 + (hash % 18);
  const release = `1.${hash % 10}`;

  // Format project manager email to a clean name
  let pmName = "Priya Nair";
  if (p.projectManagerEmail) {
    pmName = p.projectManagerEmail
      .split("@")[0]
      .split(".")
      .map((n) => n.charAt(0).toUpperCase() + n.slice(1))
      .join(" ");
  }
  const pmInitials = pmName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return {
    id: p.id,
    name: p.name,
    key: p.code || "PRJ",
    pm: pmName,
    pmInitials: pmInitials,
    sprint: sprint,
    progress: progress,
    health: health,
    release: release,
    due: p.endDate || new Date(Date.now() + 30 * 86400000).toISOString(),
    members: p.teamIds ? p.teamIds.length || 7 : 7,
    tasks: 15 + (hash % 50),
  };
}

function HealthChip({ h }) {
  const map = {
    healthy: "bg-success/10 text-success",
    at_risk: "bg-warning/15 text-warning",
    blocked: "bg-destructive/10 text-destructive",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium",
        map[h],
      )}
    >
      <span
        className={cn("size-1.5 rounded-full", {
          "bg-success": h === "healthy",
          "bg-warning": h === "at_risk",
          "bg-destructive": h === "blocked",
        })}
      />
      {HEALTH_LABEL[h]}
    </span>
  );
}

export function ActiveProjectsTable() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [sortBy, setSortBy] = useState("progress");
  const [asc, setAsc] = useState(false);
  const [filters, setFilters] = useState({
    healthy: true,
    at_risk: true,
    blocked: true,
  });

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await api.get("/api/projects?size=100");
        // PageResponse contains 'content'
        const mapped = (res.content || []).map(mapBackendProjectToFrontend);
        setProjects(mapped);
      } catch (err) {
        console.error("Failed to fetch dashboard projects:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const rows = useMemo(() => {
    let r = projects.filter((p) => filters[p.health]);
    if (q) r = r.filter((p) => (p.name + p.key + p.pm).toLowerCase().includes(q.toLowerCase()));
    r = [...r].sort((a, b) => {
      const dir = asc ? 1 : -1;
      if (sortBy === "name") return a.name.localeCompare(b.name) * dir;
      if (sortBy === "due") return (new Date(a.due).getTime() - new Date(b.due).getTime()) * dir;
      return (a.progress - b.progress) * dir;
    });
    return r;
  }, [projects, q, sortBy, asc, filters]);

  const toggleSort = (col) => {
    if (sortBy === col) setAsc(!asc);
    else {
      setSortBy(col);
      setAsc(col === "name");
    }
  };

  return (
    <div className="rounded-xl border hairline bg-card overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b hairline">
        <div>
          <h3 className="text-sm font-semibold">Active projects</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {rows.length} of {projects.length} projects in current portfolio
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search project"
              className="h-8 pl-7 w-56 text-[12px]"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                <Filter className="size-3.5" /> Health
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Show
              </DropdownMenuLabel>
              {Object.keys(HEALTH_LABEL).map((h) => (
                <DropdownMenuCheckboxItem
                  key={h}
                  checked={filters[h]}
                  onCheckedChange={(v) => setFilters((f) => ({ ...f, [h]: !!v }))}
                >
                  {HEALTH_LABEL[h]}
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => setFilters({ healthy: true, at_risk: true, blocked: true })}
              >
                Reset
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-muted-foreground text-xs gap-2">
          <Loader2 className="size-6 animate-spin text-primary" />
          Loading projects...
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground border-b hairline">
                <th className="py-2 pl-4 pr-3 font-medium">
                  <button
                    className="inline-flex items-center gap-1 hover:text-foreground"
                    onClick={() => toggleSort("name")}
                  >
                    Project <ArrowUpDown className="size-3" />
                  </button>
                </th>
                <th className="py-2 px-3 font-medium">PM</th>
                <th className="py-2 px-3 font-medium">Sprint</th>
                <th className="py-2 px-3 font-medium min-w-[160px]">
                  <button
                    className="inline-flex items-center gap-1 hover:text-foreground"
                    onClick={() => toggleSort("progress")}
                  >
                    Progress <ArrowUpDown className="size-3" />
                  </button>
                </th>
                <th className="py-2 px-3 font-medium">Health</th>
                <th className="py-2 px-3 font-medium">Release</th>
                <th className="py-2 px-3 font-medium">
                  <button
                    className="inline-flex items-center gap-1 hover:text-foreground"
                    onClick={() => toggleSort("due")}
                  >
                    Due <ArrowUpDown className="size-3" />
                  </button>
                </th>
                <th className="py-2 pr-4 pl-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-hairline)]">
              {rows.map((p) => (
                <tr key={p.id} className="hover:bg-accent/40 transition-colors">
                  <td className="py-2.5 pl-4 pr-3">
                    <Link
                      to="/projects/$projectId"
                      params={{ projectId: p.id }}
                      className="flex items-center gap-2.5 group"
                    >
                      <div className="grid size-7 place-items-center rounded-md bg-primary-soft text-primary text-[10px] font-semibold shrink-0">
                        {p.key ? p.key.charAt(0) : ""}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-foreground group-hover:underline underline-offset-2 truncate">
                          {p.name}
                        </div>
                        <div className="text-[11px] text-muted-foreground tnum">
                          {p.members} members · {p.tasks} tasks
                        </div>
                      </div>
                    </Link>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2">
                      <div className="grid size-6 place-items-center rounded-full bg-foreground text-background text-[9px] font-semibold">
                        {p.pmInitials}
                      </div>
                      <span className="text-[12px] text-muted-foreground truncate">{p.pm}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 tnum">
                    <span className="inline-flex items-center rounded-md border hairline px-1.5 py-0.5 text-[11px] font-medium">
                      S{p.sprint}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
                        <div
                          className={cn("h-full rounded-full", {
                            "bg-success": p.health === "healthy",
                            "bg-warning": p.health === "at_risk",
                            "bg-destructive": p.health === "blocked",
                          })}
                          style={{ width: `${p.progress}%` }}
                        />
                      </div>
                      <span className="w-8 text-right text-[11px] text-muted-foreground tnum">
                        {p.progress}%
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3">
                    <HealthChip h={p.health} />
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[12px] text-muted-foreground">
                    v{p.release}
                  </td>
                  <td className="py-2.5 px-3 text-[12px] text-muted-foreground tnum">
                    {fmtDate(p.due)}
                  </td>
                  <td className="py-2.5 pr-4 pl-3">
                    <Button variant="ghost" size="icon" className="size-7">
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
