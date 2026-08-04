import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { GitBranch, Search, ExternalLink, FolderKanban, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { projectService } from "@/services/api-services";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/repositories")({
  head: () => ({
    meta: [
      { title: "Project Repositories · NeuroForge Nexus" },
      { name: "description", content: "Project repository directory, SCM providers, and branch metadata." },
    ],
  }),
  component: RepositoriesPage,
});

export function RepositoriesPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [providerFilter, setProviderFilter] = useState("ALL");

  const fetchRepositories = async () => {
    setLoading(true);
    try {
      const res = await projectService.search({ size: 100 });
      setProjects(res.content || []);
    } catch (err) {
      console.error("Failed to load project repositories:", err);
      toast.error("Failed to load project repositories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRepositories();
  }, []);

  const getProviderBadge = (provider) => {
    switch (provider) {
      case "GITHUB":
        return "bg-primary-soft text-primary border-primary/20";
      case "GITLAB":
        return "bg-warning/15 text-warning border-warning/20";
      case "BITBUCKET":
        return "bg-success/15 text-success border-success/20";
      default:
        return "bg-muted text-muted-foreground border-border/20";
    }
  };

  const filtered = projects.filter((p) => {
    const matchesSearch =
      (p.name && p.name.toLowerCase().includes(search.toLowerCase())) ||
      (p.code && p.code.toLowerCase().includes(search.toLowerCase())) ||
      (p.repositoryUrl && p.repositoryUrl.toLowerCase().includes(search.toLowerCase()));

    const matchesProvider =
      providerFilter === "ALL" ||
      (p.repositoryProvider && p.repositoryProvider.toUpperCase() === providerFilter);

    return matchesSearch && matchesProvider;
  });

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto space-y-6">
      <header className="flex items-end justify-between gap-4 pb-6 border-b hairline">
        <div>
          <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            Version Control & Source Metadata
          </div>
          <h1 className="font-display text-3xl mt-1 flex items-center gap-2">
            <GitBranch className="size-6 text-primary" /> Project Repository Directory
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Directory of project source code repositories, SCM providers (GitHub, GitLab, Bitbucket), and default branch targets.
          </p>
        </div>
      </header>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Search projects or repo URLs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 text-xs"
          />
        </div>

        <Select value={providerFilter} onValueChange={setProviderFilter}>
          <SelectTrigger className="w-44 h-9 text-xs bg-background">
            <SelectValue placeholder="All Providers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Providers</SelectItem>
            <SelectItem value="GITHUB">GitHub</SelectItem>
            <SelectItem value="GITLAB">GitLab</SelectItem>
            <SelectItem value="BITBUCKET">Bitbucket</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Directory Table */}
      {loading ? (
        <div className="py-16 text-center text-xs text-muted-foreground flex justify-center items-center gap-2">
          <Loader2 className="size-5 animate-spin text-primary" /> Loading project repositories...
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border hairline bg-card p-8 text-center text-xs text-muted-foreground">
          No project repositories found.
        </div>
      ) : (
        <div className="rounded-xl border hairline bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b hairline text-muted-foreground bg-muted/20 uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4 font-semibold">Project</th>
                  <th className="py-3 px-4 font-semibold">SCM Provider</th>
                  <th className="py-3 px-4 font-semibold">Default Branch</th>
                  <th className="py-3 px-4 font-semibold">Repository URL</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border hairline">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-foreground flex items-center gap-2">
                        <FolderKanban className="size-4 text-primary shrink-0" />
                        <Link to="/projects/$projectId" params={{ projectId: p.id }} className="hover:underline">
                          {p.name}
                        </Link>
                        <span className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                          {p.code}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border", getProviderBadge(p.repositoryProvider))}>
                        {p.repositoryProvider || "GITHUB"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-muted-foreground">
                      {p.defaultBranch || "main"}
                    </td>
                    <td className="py-3.5 px-4 max-w-[320px] truncate">
                      {p.repositoryUrl ? (
                        <a
                          href={p.repositoryUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="font-mono text-primary hover:underline inline-flex items-center gap-1 truncate max-w-full"
                        >
                          <span className="truncate">{p.repositoryUrl}</span>
                          <ExternalLink className="size-3 shrink-0" />
                        </a>
                      ) : (
                        <span className="text-muted-foreground italic">— Not configured</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link to="/projects/$projectId" params={{ projectId: p.id }}>
                        <span className="text-xs text-primary hover:underline font-medium">View Project →</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
