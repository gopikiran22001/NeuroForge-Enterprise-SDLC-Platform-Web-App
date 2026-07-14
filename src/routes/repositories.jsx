import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { GitBranch, Search, Filter, Terminal, Plus, ExternalLink, RefreshCw, GitCommit, Settings, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/repositories")({
  head: () => ({
    meta: [
      { title: "Repositories · NeuroForge Nexus" },
      { name: "description", content: "Platform repository directory and version control metrics." },
    ],
  }),
  component: RepositoriesPage,
});

const INITIAL_REPOS = [
  { id: 1, name: "neuroforge-core-backend", slug: "Backend engine running Spring Boot 3.5 and JPA", language: "Java", stars: 45, mainBranch: "main", branchesCount: 12, commitsCount: 1240, lastCommit: "2026-07-14T10:32:00Z" },
  { id: 2, name: "neuroforge-nexus-frontend", slug: "Enterprise SPA client built with React 19 and Tailwind", language: "JavaScript", stars: 38, mainBranch: "main", branchesCount: 8, commitsCount: 840, lastCommit: "2026-07-14T11:15:00Z" },
  { id: 3, name: "neuroforge-pipelines-runner", slug: "Distributed runner orchestrating containerized builds", language: "Go", stars: 22, mainBranch: "master", branchesCount: 4, commitsCount: 310, lastCommit: "2026-07-12T08:44:00Z" },
  { id: 4, name: "neuroforge-infrastructure-iac", slug: "Terraform manifests deploying cluster environments", language: "HCL", stars: 15, mainBranch: "main", branchesCount: 3, commitsCount: 195, lastCommit: "2026-07-10T15:20:00Z" },
];

function RepositoriesPage() {
  const [repos, setRepos] = useState(INITIAL_REPOS);
  const [search, setSearch] = useState("");
  const [langFilter, setLangFilter] = useState("ALL");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [repoName, setRepoName] = useState("");
  const [repoDesc, setRepoDesc] = useState("");
  const [repoLang, setRepoLang] = useState("Java");

  const handleCreateRepo = (e) => {
    e.preventDefault();
    if (!repoName) {
      toast.error("Repository name is required.");
      return;
    }
    const newRepo = {
      id: repos.length + 1,
      name: repoName,
      slug: repoDesc || "No description provided.",
      language: repoLang,
      stars: 0,
      mainBranch: "main",
      branchesCount: 1,
      commitsCount: 1,
      lastCommit: new Date().toISOString(),
    };
    setRepos([newRepo, ...repos]);
    setDialogOpen(false);
    toast.success("Repository created successfully");
  };

  const filteredRepos = repos.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase()) || r.slug.toLowerCase().includes(search.toLowerCase());
    const matchesLang = langFilter === "ALL" ? true : r.language === langFilter;
    return matchesSearch && matchesLang;
  });

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto space-y-6">
      <header className="flex items-end justify-between gap-4 pb-6 border-b hairline">
        <div>
          <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            Version Control
          </div>
          <h1 className="font-display text-3xl mt-1 flex items-center gap-2">
            <GitBranch className="size-6 text-primary" /> Repositories
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Browse and manage source code repositories connected to this workspace.
          </p>
        </div>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="size-3.5 mr-1" /> New Repository
        </Button>
      </header>

      {/* Stats KPI Panel */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border hairline bg-card p-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Repositories</div>
          <div className="text-2xl font-bold mt-1 font-display">{repos.length}</div>
        </div>
        <div className="rounded-xl border hairline bg-card p-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Primary Language</div>
          <div className="text-2xl font-bold mt-1 text-primary font-display">Java</div>
        </div>
        <div className="rounded-xl border hairline bg-card p-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Branches</div>
          <div className="text-2xl font-bold mt-1 font-display">
            {repos.reduce((sum, r) => sum + r.branchesCount, 0)}
          </div>
        </div>
        <div className="rounded-xl border hairline bg-card p-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Commits</div>
          <div className="text-2xl font-bold mt-1 font-display text-success">
            {repos.reduce((sum, r) => sum + r.commitsCount, 0)}
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Search repositories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 text-xs"
          />
        </div>

        <Select value={langFilter} onValueChange={setLangFilter}>
          <SelectTrigger className="w-40 h-9 text-xs bg-background">
            <Filter className="size-3 mr-1 text-muted-foreground" />
            <SelectValue placeholder="Language" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Languages</SelectItem>
            <SelectItem value="Java">Java</SelectItem>
            <SelectItem value="JavaScript">JavaScript</SelectItem>
            <SelectItem value="Go">Go</SelectItem>
            <SelectItem value="HCL">HCL</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Repos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredRepos.map(repo => (
          <div key={repo.id} className="rounded-xl border hairline bg-card p-5 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-display text-lg font-semibold flex items-center gap-1.5 hover:text-primary transition-colors cursor-pointer">
                    {repo.name} <ExternalLink className="size-3.5 text-muted-foreground" />
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {repo.slug}
                  </p>
                </div>
                <span className={cn(
                  "inline-flex items-center rounded-md border hairline px-1.5 py-0.5 text-[10px] font-medium font-mono",
                  repo.language === "Java" ? "bg-red/10 text-red" :
                  repo.language === "JavaScript" ? "bg-warning/10 text-warning" :
                  repo.language === "Go" ? "bg-cyan/10 text-cyan" :
                  "bg-purple/10 text-purple"
                )}>
                  {repo.language}
                </span>
              </div>

              <div className="mt-4 pt-3 border-t border-border/10 grid grid-cols-3 gap-2 text-[11px] text-muted-foreground">
                <div>
                  <div className="text-[10px] uppercase tracking-wider opacity-70">Main branch</div>
                  <div className="font-medium text-foreground mt-0.5 flex items-center gap-1">
                    <GitBranch className="size-3.5 text-primary" /> {repo.mainBranch}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider opacity-70">Branches</div>
                  <div className="font-medium text-foreground mt-0.5">{repo.branchesCount} branches</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider opacity-70">Commits</div>
                  <div className="font-medium text-foreground mt-0.5">{repo.commitsCount} commits</div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-border/10 flex justify-between items-center text-xs">
              <div className="text-muted-foreground flex items-center gap-1">
                <Clock className="size-3.5" /> Updated: {new Date(repo.lastCommit).toLocaleDateString()}
              </div>

              <Button
                variant="outline"
                size="xs"
                onClick={() => {
                  navigator.clipboard.writeText(`git clone https://git.neuroforge.org/${repo.name}.git`);
                  toast.success("Clone URL copied to clipboard!");
                }}
              >
                Copy clone URL
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md bg-card border hairline">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">New Source Repository</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateRepo} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="repoName">Repository Name</Label>
              <Input
                id="repoName"
                value={repoName}
                onChange={(e) => setRepoName(e.target.value)}
                placeholder="e.g. neuroforge-billing-service"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="repoDesc">Description</Label>
              <Input
                id="repoDesc"
                value={repoDesc}
                onChange={(e) => setRepoDesc(e.target.value)}
                placeholder="Brief description of the codebase"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="repoLang">Primary Language</Label>
              <Select value={repoLang} onValueChange={setRepoLang}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Java">Java</SelectItem>
                  <SelectItem value="JavaScript">JavaScript</SelectItem>
                  <SelectItem value="Go">Go</SelectItem>
                  <SelectItem value="HCL">HCL</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="pt-4 border-t hairline mt-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
