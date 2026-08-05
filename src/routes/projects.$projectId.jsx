import { createFileRoute, Link, notFound, useRouter, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, GitBranch, Users, Calendar, Layers, Edit2, Trash2, Loader2, ExternalLink, Workflow, Github, GitPullRequest, Tag, Star, Clock, FileCode2, Scale } from "lucide-react";
import { fmtDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { projectService, teamService, userService, sprintService, milestoneService, pipelineService, githubIntegrationService } from "@/services/api-services";
import { mapBackendProjectToFrontend } from "@/components/dashboard/active-projects-table";
import { useSession } from "@/lib/session";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";

const PROJECT_STATUSES = ["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"];

export const Route = createFileRoute("/projects/$projectId")({
  loader: async ({ params }) => {
    try {
      const [p, sprintsRes, milestonesRes, usersRes, teamsRes, pipelinesRes, ghDashboardRes] = await Promise.all([
        projectService.getById(params.projectId),
        sprintService.search({ projectId: params.projectId, size: 100 }).catch(() => ({ content: [] })),
        milestoneService.search({ projectId: params.projectId, size: 100 }).catch(() => ({ content: [] })),
        userService.search({ size: 100 }).catch(() => ({ content: [] })),
        teamService.search({ size: 100 }).catch(() => ({ content: [] })),
        pipelineService.search({ projectId: params.projectId, size: 100 }).catch(() => ({ content: [] })),
        projectService.getGitHubDashboard(params.projectId).catch(() => null),
      ]);

      const project = mapBackendProjectToFrontend(p);
      if (!project) throw notFound();

      return {
        rawProject: p,
        project,
        sprints: sprintsRes?.content || [],
        milestones: milestonesRes?.content || [],
        users: usersRes?.content || [],
        teams: teamsRes?.content || [],
        pipelines: pipelinesRes?.content || [],
        ghDashboard: ghDashboardRes || null,
      };
    } catch (err) {
      console.error("Failed to load project details:", err);
      throw notFound();
    }
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.project?.name ?? "Project"} · NeuroForge Platform` },
      {
        name: "description",
        content: `Details, GitHub repository, workflows, and team for ${loaderData?.project?.name}.`,
      },
    ],
  }),
  component: ProjectDetail,
  notFoundComponent: () => (
    <div className="p-10 text-center text-sm text-muted-foreground">Project not found.</div>
  ),
});

function ProjectDetail() {
  const { rawProject, project, sprints, milestones, users, teams, pipelines = [], ghDashboard } = Route.useLoaderData();
  const { user: currentUser } = useSession();
  const navigate = useNavigate();
  const router = useRouter();

  // Dialogue & Form states
  const [editOpen, setEditOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [projectManagerId, setProjectManagerId] = useState("");
  const [selectedTeams, setSelectedTeams] = useState([]);
  const [status, setStatus] = useState("ACTIVE");

  const canEdit = currentUser?.role === "admin" || currentUser?.role === "super_admin";

  // Resolve assigned teams
  const projectTeamIds = rawProject.teamIds ? Array.from(rawProject.teamIds) : [];
  const assignedTeams = teams.filter((t) => projectTeamIds.includes(t.id));

  // Collect unique user IDs assigned to this project
  const assignedUserIds = new Set();
  assignedTeams.forEach((t) => {
    if (t.memberIds) {
      t.memberIds.forEach((id) => assignedUserIds.add(id));
    }
    if (t.teamLeaderId) {
      assignedUserIds.add(t.teamLeaderId);
    }
  });
  if (rawProject.projectManagerId) {
    assignedUserIds.add(rawProject.projectManagerId);
  }

  const assignedUsers = Array.from(assignedUserIds)
    .map((uid) => {
      const u = users.find((user) => user.id === uid);
      if (u) {
        return {
          id: uid,
          name: `${u.firstName} ${u.lastName}`,
          email: u.email,
          role: u.role,
          isPm: uid === rawProject.projectManagerId,
          isLeader: assignedTeams.some((t) => t.teamLeaderId === uid),
        };
      }
      return null;
    })
    .filter(Boolean);

  const getDisplayRole = (u) => {
    if (u.isPm) return "Project Manager";
    if (u.isLeader) return "Team Leader";
    return "Engineer";
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await projectService.delete(rawProject.id);
      toast.success("Project deleted successfully");
      setDeleteOpen(false);
      navigate({ to: "/projects" });
    } catch (err) {
      toast.error(err.message || "Failed to delete project");
    } finally {
      setDeleteLoading(false);
    }
  };

  const repoUrl = rawProject.repositoryUrl || ghDashboard?.repositoryUrl;
  const repoFullName = rawProject.repositoryFullName || ghDashboard?.repositoryFullName;

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto space-y-6">
      <Link
        to="/projects"
        className="inline-flex items-center gap-1 text-[12px] text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-3.5" /> All projects
      </Link>

      <header className="flex flex-wrap items-end justify-between gap-4 pb-6 border-b hairline">
        <div className="flex items-start gap-4">
          <div className="grid size-14 place-items-center rounded-xl bg-primary-soft text-primary text-lg font-semibold shrink-0">
            {project.key ? project.key.charAt(0) : "P"}
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              GitHub-Backed Project · {project.key}
            </div>
            <h1 className="font-display text-3xl mt-1 flex items-center gap-2.5">
              {project.name}
            </h1>
            <p className="mt-1 text-xs text-muted-foreground font-mono flex items-center gap-2">
              <Github className="size-3.5 text-foreground" />
              Repository: <span className="text-foreground font-semibold">{repoFullName || "Not Configured"}</span>
            </p>
          </div>
        </div>

        {/* Quick Links Header Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {repoUrl && (
            <>
              <a href={repoUrl} target="_blank" rel="noreferrer">
                <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
                  <Github className="size-3.5 text-foreground" /> Repository <ExternalLink className="size-3" />
                </Button>
              </a>
              <a href={`${repoUrl}/actions`} target="_blank" rel="noreferrer">
                <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
                  <Workflow className="size-3.5 text-primary" /> Actions <ExternalLink className="size-3" />
                </Button>
              </a>
              <a href={`${repoUrl}/pulls`} target="_blank" rel="noreferrer">
                <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
                  <GitPullRequest className="size-3.5 text-success" /> Pull Requests <ExternalLink className="size-3" />
                </Button>
              </a>
              <a href={`${repoUrl}/releases`} target="_blank" rel="noreferrer">
                <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
                  <Tag className="size-3.5 text-warning" /> Releases <ExternalLink className="size-3" />
                </Button>
              </a>
            </>
          )}

          {canEdit && (
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive h-8 text-xs"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="size-3.5 mr-1" /> Delete
            </Button>
          )}
        </div>
      </header>

      {/* GitHub Repository Health & Dashboard Metrics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 bg-card border hairline rounded-xl space-y-1">
          <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
            <GitPullRequest className="size-3.5 text-success" /> Open Pull Requests
          </span>
          <p className="font-display text-2xl font-semibold text-foreground">
            {ghDashboard?.openPullRequestsCount ?? 0}
          </p>
        </div>
        <div className="p-4 bg-card border hairline rounded-xl space-y-1">
          <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
            <Users className="size-3.5 text-primary" /> Contributors
          </span>
          <p className="font-display text-2xl font-semibold text-foreground">
            {ghDashboard?.contributorCount ?? 0}
          </p>
        </div>
        <div className="p-4 bg-card border hairline rounded-xl space-y-1">
          <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
            <GitBranch className="size-3.5 text-primary" /> Default Branch
          </span>
          <p className="font-mono text-base font-semibold text-foreground truncate">
            {rawProject.defaultBranch || ghDashboard?.defaultBranch || "main"}
          </p>
        </div>
        <div className="p-4 bg-card border hairline rounded-xl space-y-1">
          <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
            <Workflow className="size-3.5 text-primary" /> GitHub Workflow
          </span>
          <p className="font-medium text-xs text-foreground truncate">
            {rawProject.workflowName || ghDashboard?.workflowName || "None"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">

          {/* GitHub Latest Activity Cards (Commit & Release) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Latest Commit Card */}
            <div className="p-5 bg-card border hairline rounded-xl space-y-3">
              <h3 className="font-semibold text-xs text-foreground uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 border-b hairline pb-2">
                <Clock className="size-3.5 text-primary" /> Latest Commit
              </h3>
              {ghDashboard?.latestCommit ? (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-foreground line-clamp-2">
                    {ghDashboard.latestCommit.message}
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                    <span className="font-mono text-primary font-semibold">
                      {ghDashboard.latestCommit.shortSha}
                    </span>
                    <span>{ghDashboard.latestCommit.authorName}</span>
                    <span>{ghDashboard.latestCommit.commitDate ? fmtDate(ghDashboard.latestCommit.commitDate) : ""}</span>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-muted-foreground italic py-2">
                  No commit data fetched yet.
                </div>
              )}
            </div>

            {/* Latest Release Card */}
            <div className="p-5 bg-card border hairline rounded-xl space-y-3">
              <h3 className="font-semibold text-xs text-foreground uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 border-b hairline pb-2">
                <Tag className="size-3.5 text-warning" /> Latest Release
              </h3>
              {ghDashboard?.latestRelease ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded border border-primary/20">
                      {ghDashboard.latestRelease.version}
                    </span>
                    <span className="text-xs font-semibold text-foreground truncate">{ghDashboard.latestRelease.name}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-2">
                    {ghDashboard.latestRelease.description || "No release notes."}
                  </p>
                  <div className="text-[10px] text-muted-foreground pt-1 flex justify-between">
                    <span>By @{ghDashboard.latestRelease.author}</span>
                    <span>{ghDashboard.latestRelease.publishedAt ? fmtDate(ghDashboard.latestRelease.publishedAt) : ""}</span>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-muted-foreground italic py-2">
                  No releases found on GitHub.
                </div>
              )}
            </div>
          </div>

          {/* Sprints Card */}
          <div className="rounded-xl border hairline bg-card p-6">
            <h2 className="text-sm font-semibold flex items-center justify-between">
              <span>Sprints</span>
              <span className="text-[11px] font-normal text-muted-foreground">{sprints.length} total</span>
            </h2>
            {sprints.length === 0 ? (
              <div className="mt-4 py-8 text-center text-xs text-muted-foreground border border-dashed rounded-lg hairline">
                No sprints planned for this project.
              </div>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b hairline text-muted-foreground">
                      <th className="pb-2 font-medium">Sprint</th>
                      <th className="pb-2 font-medium">Goal</th>
                      <th className="pb-2 font-medium">Dates</th>
                      <th className="pb-2 font-medium text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border hairline">
                    {sprints.map((s) => (
                      <tr key={s.id} className="hover:bg-muted/30">
                        <td className="py-2.5 font-medium">{s.name}</td>
                        <td className="py-2.5 text-muted-foreground max-w-[200px] truncate" title={s.goal}>
                          {s.goal || "—"}
                        </td>
                        <td className="py-2.5 text-muted-foreground whitespace-nowrap">
                          {fmtDate(s.startDate)} - {fmtDate(s.endDate)}
                        </td>
                        <td className="py-2.5 text-right">
                          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium bg-primary-soft text-primary">
                            {s.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar cards */}
        <div className="space-y-4 self-start">
          {/* GitHub Actions Workflow Configuration */}
          <div className="rounded-xl border hairline bg-card p-5 space-y-3 text-xs">
            <h3 className="font-semibold text-sm text-foreground uppercase tracking-wider text-muted-foreground border-b hairline pb-2 flex items-center gap-2">
              <Workflow className="size-4 text-primary" /> Workflow Association
            </h3>
            <div className="space-y-2">
              <div>
                <span className="text-muted-foreground">Workflow Name:</span>
                <p className="font-semibold text-foreground">{rawProject.workflowName || "None Associated"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Workflow File:</span>
                <p className="font-mono text-muted-foreground text-[11px]">{rawProject.workflowFile || "N/A"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Provider:</span>
                <p className="font-semibold text-foreground">GITHUB_ACTIONS</p>
              </div>
            </div>
          </div>

          {/* Team Members Card */}
          <div className="rounded-xl border hairline bg-card p-5 space-y-3">
            <h3 className="font-semibold text-sm text-foreground uppercase tracking-wider text-muted-foreground border-b hairline pb-2 flex items-center gap-2">
              <Users className="size-4 text-primary" /> Team Members ({assignedUsers.length})
            </h3>
            <div className="space-y-2.5">
              {assignedUsers.length === 0 ? (
                <div className="text-xs text-muted-foreground text-center py-4">No assigned team members.</div>
              ) : (
                assignedUsers.map((u) => (
                  <div key={u.id} className="flex items-center gap-2.5">
                    <div className="grid size-7 place-items-center rounded-full bg-foreground text-background text-[10px] font-semibold">
                      {u.name
                        .split(" ")
                        .map((p) => p[0])
                        .slice(0, 2)
                        .join("")}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs truncate font-semibold text-foreground">{u.name}</div>
                      <div className="text-[11px] text-muted-foreground">{getDisplayRole(u)}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Project?"
        description={`Are you sure you want to delete project "${project.name}"?`}
        confirmLabel="Delete Project"
        loading={deleteLoading}
        onConfirm={handleDelete}
      />
    </div>
  );
}
