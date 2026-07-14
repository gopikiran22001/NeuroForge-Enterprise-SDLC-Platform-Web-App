import { createFileRoute, Link } from "@tanstack/react-router";
import { useSession } from "@/lib/session";
import { fmtDate } from "@/lib/format";
import { KpiTile } from "@/components/dashboard/kpi-tile";
import { Sparkline } from "@/components/dashboard/delivery-pulse-chart";
import { ActiveProjectsTable } from "@/components/dashboard/active-projects-table";
import { TeamPerformanceGrid } from "@/components/dashboard/team-performance-grid";
import { MilestoneTimeline } from "@/components/dashboard/milestone-timeline";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { organizationService, userService } from "@/services/api-services";
import {
  ArrowRight,
  ShieldCheck,
  Layers,
  UsersRound,
  FolderKanban,
  Cpu,
  Check,
  X,
  Building2,
  Server,
  Clock,
  ShieldAlert,
  Globe,
  Users,
  Activity,
  CheckCircle2,
  ListFilter,
  AlertCircle,
  Database,
  ArrowUpRight,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { NeuroForgeLogo } from "@/components/neuroforge-logo";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: ({ data }) => ({
    meta: [
      { title: "NeuroForge Nexus — Enterprise SDLC Platform" },
      {
        name: "description",
        content: "Plan, ship, and operate software at scale from a single integrated cockpit.",
      },
    ],
  }),
  component: RootIndex,
});

function RootIndex() {
  const { user } = useSession();
  if (user) {
    return <Dashboard />;
  }
  return <LandingPage />;
}

function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between selection:bg-primary/30">
      {/* Navbar */}
      <header className="border-b border-border/40 backdrop-blur-md sticky top-0 z-50 bg-background/80">
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="grid size-8 place-items-center shrink-0 text-primary">
              <NeuroForgeLogo className="size-7" />
            </div>
            <span className="text-lg font-semibold text-foreground">NeuroForge Nexus</span>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/login">Sign in</Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-16 md:pt-32 md:pb-28 w-full">
        <div className="max-w-[1400px] mx-auto px-6 relative z-10">
          <div className="max-w-3xl text-center mx-auto space-y-6">
            <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold bg-primary-soft text-primary border border-primary/20">
              <span className="size-1.5 rounded-full bg-primary animate-pulse" />
              Enterprise-Grade Software Development Lifecycle Platform
            </div>

            <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight leading-[1.08]">
              Enterprise SDLC Cockpit. <br />
              <span className="text-muted-foreground italic">Build at Scale.</span>
            </h1>

            <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Plan sprints, track milestone deliveries, manage secure role-based directories, and
              trace build lifecycles in a single platform.
            </p>

            <div className="pt-4 flex flex-wrap justify-center gap-3">
              <Button size="lg" asChild>
                <Link to="/register">
                  Register Account <ArrowRight className="size-4 ml-2" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/login">Sign in to workspace</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Floating background blobs */}
        <div className="pointer-events-none absolute -left-20 top-20 size-[350px] rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 top-40 size-[450px] rounded-full bg-primary/15 blur-3xl" />
      </section>

      {/* Features grid */}
      <section id="features" className="py-16 border-t border-border/30 bg-muted/20">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="text-center max-w-lg mx-auto mb-12">
            <h2 className="font-display text-3xl font-semibold">Comprehensive SDLC Integration</h2>
            <p className="text-sm text-muted-foreground mt-2">
              Engineered to trace quality, compliance, and velocity across your software lifecycle.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 italic">
            <FeatureCard
              icon={FolderKanban}
              title="Project Services"
              description="Coordinate delivery portfolios, status parameters, and lead allocations."
            />
            <FeatureCard
              icon={UsersRound}
              title="Team Directories"
              description="Define cross-functional units, assign leads, and configure user memberships."
            />
            <FeatureCard
              icon={ShieldCheck}
              title="RBAC Security"
              description="Configure robust role maps (Admin, PM, Developer, Tester, DevOps) with Keycloak IAM."
            />
            <FeatureCard
              icon={Layers}
              title="Agile Sprints"
              description="Plan iterations, align milestones, and monitor velocity thresholds."
            />
          </div>
        </div>
      </section>

      {/* Technology Stack Grid */}
      <section id="stack" className="py-16 border-t border-border/30">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-12 items-center">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-1 text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                <Cpu className="size-3.5" /> High Performance Architecture
              </div>
              <h2 className="font-display text-4xl font-bold">Cutting-Edge Tech Stack</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                NeuroForge Nexus is architected on high-performance cloud frameworks to ensure
                sub-millisecond response latency and absolute data consistency.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <StackTile label="Frontend" value="React / Vite" />
              <StackTile label="Backend" value="Java 25 / Spring Boot 4" />
              <StackTile label="Database" value="PostgreSQL / Neon" />
              <StackTile label="Security & IAM" value="Keycloak" />
              <StackTile label="Messaging" value="Apache Kafka" />
              <StackTile label="Uptime" value="99.99% Target" />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/30 py-8 bg-muted/40">
        <div className="max-w-[1400px] mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <NeuroForgeLogo className="size-4 text-muted-foreground" />
            <span>© 2026 NeuroForge Nexus. All rights reserved.</span>
          </div>
          <div>Built with React, Java 25 & Spring Boot 4</div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description }) {
  return (
    <div className="rounded-xl border border-border/40 bg-card p-6 space-y-4 hover:border-primary/25 transition-all">
      <div className="size-10 grid place-items-center rounded-lg bg-primary-soft text-primary">
        <Icon className="size-5" />
      </div>
      <h3 className="font-display font-semibold text-lg">{title}</h3>
      <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

function StackTile({ label, value }) {
  return (
    <div className="rounded-lg border border-border/30 bg-muted/10 p-4">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-sm font-semibold text-foreground mt-1">{value}</div>
    </div>
  );
}

function DeveloperTasksTable() {
  const tasks = [
    { id: "1", key: "NF-12", title: "Implement JWT validation middleware", status: "IN_PROGRESS", priority: "HIGH", due: "Tomorrow" },
    { id: "2", key: "NF-18", title: "Write user registration unit tests", status: "TODO", priority: "MEDIUM", due: "In 3 days" },
    { id: "3", key: "NF-22", title: "Resolve Vite page reload loop", status: "COMPLETED", priority: "CRITICAL", due: "Completed" },
  ];
  return (
    <div className="rounded-xl border border-border/40 bg-card p-6">
      <h2 className="text-sm font-semibold mb-4">My Assigned Tasks</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="border-b border-border/30 text-muted-foreground uppercase pb-2">
              <th className="py-2 pr-3 text-left">Key</th>
              <th className="py-2 px-3 text-left">Title</th>
              <th className="py-2 px-3 text-left">Priority</th>
              <th className="py-2 px-3 text-left">Status</th>
              <th className="py-2 pl-3 text-right">Due Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/20">
            {tasks.map(t => (
              <tr key={t.id} className="hover:bg-accent/10 transition-colors">
                <td className="py-3 pr-3 font-mono text-primary font-semibold">{t.key}</td>
                <td className="py-3 px-3 font-medium text-foreground truncate max-w-[200px]">{t.title}</td>
                <td className="py-3 px-3">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                    t.priority === "CRITICAL" ? "bg-destructive/15 text-destructive" :
                    t.priority === "HIGH" ? "bg-warning/15 text-warning" : "bg-muted text-muted-foreground"
                  }`}>{t.priority}</span>
                </td>
                <td className="py-3 px-3 font-medium">{t.status.replace("_", " ")}</td>
                <td className="py-3 pl-3 text-right text-muted-foreground">{t.due}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DeveloperPipelines() {
  const pipelines = [
    { repo: "NeuroForge-Core", branch: "main", commit: "a3f5b72", status: "SUCCESS", time: "2m ago" },
    { repo: "NeuroForge-Frontend", branch: "feature/auth", commit: "9c8e1a5", status: "RUNNING", time: "Just now" },
  ];
  return (
    <div className="rounded-xl border border-border/40 bg-card p-6">
      <h2 className="text-sm font-semibold mb-4">Active Build Pipelines</h2>
      <div className="space-y-4">
        {pipelines.map((p, i) => (
          <div key={i} className="flex items-center justify-between p-3 border border-border/20 rounded-lg bg-background/40">
            <div>
              <div className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                <span className="font-mono text-muted-foreground font-normal">{p.repo}</span>
                <span className="text-[10px] px-1 bg-muted rounded font-mono font-normal">{p.branch}</span>
              </div>
              <div className="text-[10px] text-muted-foreground mt-1 font-mono">Commit: {p.commit} · {p.time}</div>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1 ${
              p.status === "SUCCESS" ? "bg-success/15 text-success" : "bg-primary-soft text-primary animate-pulse"
            }`}>
              <span className={`size-1.5 rounded-full ${p.status === "SUCCESS" ? "bg-success" : "bg-primary animate-ping"}`} />
              {p.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TesterDefectsTable() {
  const defects = [
    { id: "1", key: "BUG-87", title: "API Gateway returns 504 Gateway Timeout during auth peak", severity: "CRITICAL", status: "OPEN" },
    { id: "2", key: "BUG-92", title: "Password toggle icon not aligned in mobile layout", severity: "LOW", status: "RESOLVED" },
    { id: "3", key: "BUG-99", title: "Theme toggle resets preference after page refresh", severity: "HIGH", status: "OPEN" },
  ];
  return (
    <div className="rounded-xl border border-border/40 bg-card p-6">
      <h2 className="text-sm font-semibold mb-4">Defect Backlog</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="border-b border-border/30 text-muted-foreground uppercase pb-2">
              <th className="py-2 pr-3 text-left">ID</th>
              <th className="py-2 px-3 text-left">Title</th>
              <th className="py-2 px-3 text-left">Severity</th>
              <th className="py-2 pl-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/20">
            {defects.map(d => (
              <tr key={d.id} className="hover:bg-accent/10 transition-colors">
                <td className="py-3 pr-3 font-mono text-destructive font-semibold">{d.key}</td>
                <td className="py-3 px-3 font-medium text-foreground truncate max-w-[200px]">{d.title}</td>
                <td className="py-3 px-3">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                    d.severity === "CRITICAL" ? "bg-destructive/15 text-destructive" :
                    d.severity === "HIGH" ? "bg-warning/15 text-warning" : "bg-muted text-muted-foreground"
                  }`}>{d.severity}</span>
                </td>
                <td className="py-3 pl-3 text-right">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                    d.status === "OPEN" ? "bg-warning/10 text-warning" : "bg-success/15 text-success"
                  }`}>{d.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TesterRunsList() {
  const suites = [
    { name: "Regression Suite", passed: 184, failed: 2, total: 190, duration: "12m 4s", progress: 98 },
    { name: "Sanity Verification", passed: 45, failed: 0, total: 45, duration: "3m ago", progress: 100 },
  ];
  return (
    <div className="rounded-xl border border-border/40 bg-card p-6">
      <h2 className="text-sm font-semibold mb-4">Recent Test Executions</h2>
      <div className="space-y-4">
        {suites.map((s, i) => (
          <div key={i} className="space-y-2 p-3 border border-border/20 rounded-lg bg-background/40">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs text-foreground">{s.name}</span>
              <span className="text-[10px] text-muted-foreground">{s.duration}</span>
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>{s.passed} passed · {s.failed} failed</span>
              <span>{s.progress}% complete</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full ${s.failed > 0 ? "bg-destructive" : "bg-success"}`}
                style={{ width: `${s.progress}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DevOpsEnvironments() {
  const envs = [
    { name: "Production", version: "v4.2.0", latency: "42ms", cpu: "28%", status: "HEALTHY" },
    { name: "Staging", version: "v4.3.0-rc2", latency: "68ms", cpu: "42%", status: "HEALTHY" },
    { name: "QA / Dev", version: "v4.3.0-rc5", latency: "120ms", cpu: "78%", status: "WARNING" },
  ];
  return (
    <div className="rounded-xl border border-border/40 bg-card p-6">
      <h2 className="text-sm font-semibold mb-4">Environment Status</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {envs.map((env, i) => (
          <div key={i} className="p-4 border border-border/20 rounded-xl bg-background/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs text-foreground">{env.name}</span>
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${
                env.status === "HEALTHY" ? "bg-success/15 text-success" : "bg-warning/15 text-warning"
              }`}>{env.status}</span>
            </div>
            <div className="space-y-1 text-[11px] text-muted-foreground">
              <div className="flex justify-between"><span>Version:</span><span className="font-mono font-medium text-foreground">{env.version}</span></div>
              <div className="flex justify-between"><span>Latency:</span><span className="font-medium text-foreground">{env.latency}</span></div>
              <div className="flex justify-between"><span>CPU Usage:</span><span className="font-medium text-foreground">{env.cpu}</span></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DevOpsPipelineHistory() {
  const runs = [
    { id: "#2490", workflow: "Main Release Pipeline", duration: "8m 40s", triggeredBy: "DevOps Bot", status: "SUCCESS" },
    { id: "#2489", workflow: "Dev Branch CI Trigger", duration: "3m 15s", triggeredBy: "Amit Verma", status: "SUCCESS" },
    { id: "#2488", workflow: "QA Deployment Script", duration: "12m 8s", triggeredBy: "Priya Nair", status: "FAILED" },
  ];
  return (
    <div className="rounded-xl border border-border/40 bg-card p-6">
      <h2 className="text-sm font-semibold mb-4">Build Logs & History</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="border-b border-border/30 text-muted-foreground uppercase pb-2">
              <th className="py-2 pr-3 text-left">Run</th>
              <th className="py-2 px-3 text-left">Workflow</th>
              <th className="py-2 px-3 text-left">Triggered By</th>
              <th className="py-2 px-3 text-left">Duration</th>
              <th className="py-2 pl-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/20">
            {runs.map(r => (
              <tr key={r.id} className="hover:bg-accent/10 transition-colors">
                <td className="py-3 pr-3 font-mono font-semibold text-foreground">{r.id}</td>
                <td className="py-3 px-3 font-medium text-foreground truncate max-w-[150px]">{r.workflow}</td>
                <td className="py-3 px-3 text-muted-foreground">{r.triggeredBy}</td>
                <td className="py-3 px-3 text-muted-foreground">{r.duration}</td>
                <td className="py-3 pl-3 text-right">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                    r.status === "SUCCESS" ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"
                  }`}>{r.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Dashboard() {
  const { user } = useSession();
  const [counts, setCounts] = useState({
    projects: 0,
    users: 0,
    teams: 0,
    milestones: 0,
    sprints: 0,
    organizations: 0,
  });

  // State for Lists (Recent view / Approvals)
  const [orgs, setOrgs] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [projects, setProjects] = useState([]);
  const [pendingOrgs, setPendingOrgs] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const userFirstName = user && user.name ? user.name.split(" ")[0] : "User";
  const userRole = user ? user.role : "developer";

  const fetchPageOrCatch = async (url) => {
    try {
      const res = await api.get(url);
      return res.content || (Array.isArray(res) ? res : []);
    } catch (e) {
      console.warn("Failed to fetch", url, e);
      return [];
    }
  };

  const fetchData = async () => {
    try {
      if (userRole === "super_admin") {
        const [orgsData, usersData, projData, pendingUsersData] = await Promise.all([
          fetchPageOrCatch("/api/organizations?size=100"),
          fetchPageOrCatch("/api/users?size=100"),
          fetchPageOrCatch("/api/projects?size=100"),
          fetchPageOrCatch("/api/users/pending?size=100"),
        ]);
        setOrgs(orgsData);
        setUsersList(usersData);
        setProjects(projData);
        setPendingOrgs(orgsData.filter((o) => o.status === "PENDING_APPROVAL"));
        setPendingUsers(pendingUsersData.filter((u) => u.role === "ORG_ADMIN" || u.role === "admin"));
      } else {
        const [projRes, userRes, teamRes, milRes, sprRes, pendingUsersData] = await Promise.all([
          api.get("/api/projects?size=100").catch(() => ({ content: [], totalElements: 0 })),
          api.get("/api/users?size=100").catch(() => ({ content: [], totalElements: 0 })),
          api.get("/api/teams?size=100").catch(() => ({ content: [], totalElements: 0 })),
          api.get("/api/milestones?size=100").catch(() => ({ content: [], totalElements: 0 })),
          api.get("/api/sprints?size=100").catch(() => ({ content: [], totalElements: 0 })),
          userRole === "admin" ? fetchPageOrCatch("/api/users/pending?size=100") : Promise.resolve([]),
        ]);

        setProjects(projRes.content || []);
        setUsersList(userRes.content || []);
        setPendingUsers(pendingUsersData);

        setCounts({
          projects: projRes.totalElements || projRes.content?.length || 0,
          users: userRes.totalElements || userRes.content?.length || 0,
          teams: teamRes.totalElements || teamRes.content?.length || 0,
          milestones: milRes.totalElements || milRes.content?.length || 0,
          sprints: sprRes.totalElements || sprRes.content?.length || 0,
          organizations: 0,
        });
      }
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userRole]);

  const handleApproveOrg = async (orgId) => {
    setActionLoading(true);
    try {
      await organizationService.approve(orgId);
      toast.success("Organization and Owner approved successfully!");
      fetchData();
    } catch (err) {
      toast.error(err.message || "Failed to approve organization");
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveUser = async (userId) => {
    setActionLoading(true);
    try {
      await userService.approve(userId);
      toast.success("User approved successfully!");
      fetchData();
    } catch (err) {
      toast.error(err.message || "Failed to approve user");
    } finally {
      setActionLoading(false);
    }
  };

  // Role-based details
  let subtext = "Acme Corp · Platform Engineering";
  if (userRole === "super_admin") {
    subtext = "Global Platform Administrator Command Cockpit";
  } else if (userRole === "admin") {
    subtext = "System Administration Workspace Cockpit";
  } else if (userRole === "pm") {
    subtext = "Product & Delivery Management Dashboard";
  } else if (userRole === "developer") {
    subtext = "Active Dev Tasks & Automated Test Pipelines";
  } else if (userRole === "tester") {
    subtext = "Defects Logging, Validation Suites & Release Health";
  } else if (userRole === "devops") {
    subtext = "CI/CD Infrastructure & Deployment Monitoring";
  }

  const renderKpiAndPanels = () => {
    switch (userRole) {
      case "super_admin":
        return (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <KpiTile index={0} label="Organizations" value={orgs.length} spark={<Sparkline data={[orgs.length]} />} />
              <KpiTile index={1} label="Pending Approvals" value={pendingOrgs.length + pendingUsers.length} spark={<Sparkline data={[pendingOrgs.length + pendingUsers.length]} color="var(--color-chart-2)" />} />
              <KpiTile index={2} label="Active Users" value={usersList.filter(u => u.status === 'ACTIVE').length} spark={<Sparkline data={[usersList.filter(u => u.status === 'ACTIVE').length]} color="var(--color-chart-3)" />} />
              <KpiTile index={3} label="Total Projects" value={projects.length} spark={<Sparkline data={[projects.length]} color="var(--color-chart-4)" />} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 space-y-4">
                <div className="rounded-xl border border-border/40 bg-card p-6 space-y-4">
                  <h2 className="text-sm font-semibold flex items-center gap-1.5">
                    <ShieldCheck className="size-4 text-primary" /> Platform Approval Queue
                  </h2>
                  {pendingOrgs.length === 0 && pendingUsers.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No pending organization or user approvals.</p>
                  ) : (
                    <div className="divide-y divide-border/20">
                      {pendingOrgs.map(org => (
                        <div key={org.id} className="flex items-center justify-between py-3">
                          <div>
                            <div className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                              <Building2 className="size-3.5 text-muted-foreground" /> {org.name}
                            </div>
                            <div className="text-[10px] text-muted-foreground mt-0.5">
                              Slug: /{org.slug} · Type: {org.type}
                            </div>
                          </div>
                          <Button 
                            size="xs" 
                            disabled={actionLoading}
                            onClick={() => handleApproveOrg(org.id)}
                          >
                            Approve Organization
                          </Button>
                        </div>
                      ))}
                      {pendingUsers.map(u => (
                        <div key={u.id} className="flex items-center justify-between py-3">
                          <div>
                            <div className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                              <Users className="size-3.5 text-muted-foreground" /> {u.firstName} {u.lastName}
                            </div>
                            <div className="text-[10px] text-muted-foreground mt-0.5">
                              Email: {u.email} · Role: ORG_ADMIN
                            </div>
                          </div>
                          <Button 
                            size="xs" 
                            variant="secondary"
                            disabled={actionLoading}
                            onClick={() => handleApproveUser(u.id)}
                          >
                            Approve Admin
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-border/40 bg-card p-6">
                  <h2 className="text-sm font-semibold mb-4">Recent Organizations</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-border/30 text-muted-foreground uppercase pb-2">
                          <th className="py-2 pr-3">Name</th>
                          <th className="py-2 px-3">Type</th>
                          <th className="py-2 px-3">Status</th>
                          <th className="py-2 pl-3 text-right">Created</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/20">
                        {orgs.slice(0, 5).map(org => (
                          <tr key={org.id} className="hover:bg-accent/10 transition-colors">
                            <td className="py-3 pr-3 font-medium text-foreground">{org.name}</td>
                            <td className="py-3 px-3 uppercase text-[10px]">{org.type}</td>
                            <td className="py-3 px-3">
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${
                                org.status === "ACTIVE" ? "bg-success/15 text-success" : "bg-warning/15 text-warning"
                              }`}>{org.status}</span>
                            </td>
                            <td className="py-3 pl-3 text-right text-muted-foreground">{fmtDate(org.createdAt, "d MMM")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-xl border border-border/40 bg-card p-6 space-y-4">
                  <h2 className="text-sm font-semibold flex items-center gap-1.5">
                    <Cpu className="size-4 text-primary" /> Platform Overview
                  </h2>
                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between pb-1 border-b border-border/10">
                      <span className="text-muted-foreground">Platform Engine:</span>
                      <span className="font-medium">NeuroForge Enterprise</span>
                    </div>
                    <div className="flex justify-between pb-1 border-b border-border/10">
                      <span className="text-muted-foreground">Status:</span>
                      <span className="text-success font-medium flex items-center gap-1">
                        <CheckCircle2 className="size-3.5" /> Healthy
                      </span>
                    </div>
                    <div className="flex justify-between pb-1 border-b border-border/10">
                      <span className="text-muted-foreground">Uptime Target:</span>
                      <span className="font-medium text-foreground">99.99%</span>
                    </div>
                    <div className="flex justify-between pb-1 border-b border-border/10">
                      <span className="text-muted-foreground">API Version:</span>
                      <span className="font-mono">v4.2.0</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Database:</span>
                      <span className="font-mono text-[10px] text-foreground truncate max-w-[150px]">PostgreSQL</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-border/40 bg-card p-6">
                  <h2 className="text-sm font-semibold mb-4">Recent Users</h2>
                  <div className="space-y-3">
                    {usersList.slice(0, 5).map(u => (
                      <div key={u.id} className="flex items-center justify-between text-xs">
                        <div>
                          <div className="font-medium text-foreground">{u.firstName} {u.lastName}</div>
                          <div className="text-[10px] text-muted-foreground">{u.email}</div>
                        </div>
                        <span className="text-[10px] uppercase bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                          {u.role ? u.role.replace("ROLE_", "") : "Member"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        );
      case "developer":
        return (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
              <KpiTile index={0} label="Assigned tasks" value={8} spark={<Sparkline data={[12, 10, 9, 8]} />} />
              <KpiTile index={1} label="Active repos" value={4} spark={<Sparkline data={[3, 3, 4, 4]} color="var(--color-chart-2)" />} />
              <KpiTile index={2} label="Build pipelines" value={2} spark={<Sparkline data={[1, 3, 2, 2]} color="var(--color-chart-3)" />} />
              <KpiTile index={3} label="Open sprints" value={counts.sprints} spark={<Sparkline data={[counts.sprints]} color="var(--color-chart-4)" />} />
              <KpiTile index={4} label="Code coverage" value="92.4%" spark={<Sparkline data={[89, 90, 91, 92]} color="var(--color-chart-5)" />} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <DeveloperTasksTable />
              </div>
              <div>
                <DeveloperPipelines />
              </div>
            </div>
          </>
        );
      case "tester":
        return (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
              <KpiTile index={0} label="Open defects" value={14} spark={<Sparkline data={[18, 16, 15, 14]} />} />
              <KpiTile index={1} label="Test cases run" value={247} spark={<Sparkline data={[210, 230, 240, 247]} color="var(--color-chart-2)" />} />
              <KpiTile index={2} label="Passed rate" value="98.2%" spark={<Sparkline data={[97, 98, 98, 98]} color="var(--color-chart-3)" />} />
              <KpiTile index={3} label="Release status" value="Stable" spark={<Sparkline data={[1, 1, 1, 1]} color="var(--color-chart-4)" />} />
              <KpiTile index={4} label="Blocked cases" value={3} spark={<Sparkline data={[5, 4, 4, 3]} color="var(--color-chart-5)" />} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <TesterDefectsTable />
              </div>
              <div>
                <TesterRunsList />
              </div>
            </div>
          </>
        );
      case "devops":
        return (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
              <KpiTile index={0} label="Deployments today" value={6} spark={<Sparkline data={[2, 4, 5, 6]} />} />
              <KpiTile index={1} label="Pipeline health" value="99.1%" spark={<Sparkline data={[98, 98, 99, 99]} color="var(--color-chart-2)" />} />
              <KpiTile index={2} label="Avg build time" value="4m 12s" spark={<Sparkline data={[290, 270, 260, 252]} color="var(--color-chart-3)" />} />
              <KpiTile index={3} label="Infra status" value="Healthy" spark={<Sparkline data={[1, 1, 1, 1]} color="var(--color-chart-4)" />} />
              <KpiTile index={4} label="Cluster pods" value={48} spark={<Sparkline data={[42, 45, 47, 48]} color="var(--color-chart-5)" />} />
            </div>
            <div className="grid grid-cols-1 gap-4">
              <DevOpsEnvironments />
              <DevOpsPipelineHistory />
            </div>
          </>
        );
      case "admin":
        return (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
              <KpiTile index={0} label="Active projects" value={counts.projects} spark={<Sparkline data={[counts.projects]} />} />
              <KpiTile index={1} label="Users" value={counts.users} spark={<Sparkline data={[counts.users]} color="var(--color-chart-2)" />} />
              <KpiTile index={2} label="Teams" value={counts.teams} spark={<Sparkline data={[counts.teams]} color="var(--color-chart-3)" />} />
              <KpiTile index={3} label="Milestones" value={counts.milestones} spark={<Sparkline data={[counts.milestones]} color="var(--color-chart-4)" />} />
              <KpiTile index={4} label="Sprints" value={counts.sprints} spark={<Sparkline data={[counts.sprints]} color="var(--color-chart-5)" />} />
            </div>

            {pendingUsers && pendingUsers.length > 0 && (
              <div className="border border-primary/20 bg-primary-soft/10 rounded-xl p-6 space-y-4">
                <h2 className="text-sm font-semibold flex items-center gap-1.5">
                  <Users className="size-4 text-primary" /> Pending User Join Requests ({pendingUsers.length})
                </h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {pendingUsers.map(u => (
                    <div key={u.id} className="flex items-center justify-between p-3 border border-border/40 bg-card rounded-lg text-xs">
                      <div>
                        <div className="font-semibold text-foreground">{u.firstName} {u.lastName}</div>
                        <div className="text-muted-foreground text-[10px] mt-0.5">{u.email}</div>
                      </div>
                      <Button 
                        size="xs" 
                        disabled={actionLoading}
                        onClick={() => handleApproveUser(u.id)}
                      >
                        Approve
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4">
              <ActiveProjectsTable />
            </div>
            <section>
              <div className="flex items-baseline justify-between mb-3">
                <h2 className="text-sm font-semibold">Team performance</h2>
              </div>
              <TeamPerformanceGrid />
            </section>
          </>
        );
      case "pm":
      default:
        return (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <KpiTile index={0} label="My Projects" value={counts.projects} spark={<Sparkline data={[counts.projects]} />} />
              <KpiTile index={1} label="Team Count" value={counts.teams} spark={<Sparkline data={[counts.teams]} color="var(--color-chart-2)" />} />
              <KpiTile index={2} label="Milestones Tracked" value={counts.milestones} spark={<Sparkline data={[counts.milestones]} color="var(--color-chart-3)" />} />
              <KpiTile index={3} label="Sprints Conducted" value={counts.sprints} spark={<Sparkline data={[counts.sprints]} color="var(--color-chart-4)" />} />
            </div>
            <div className="grid grid-cols-1 gap-4">
              <ActiveProjectsTable />
            </div>
            <section>
              <div className="flex items-baseline justify-between mb-3">
                <h2 className="text-sm font-semibold">Team performance</h2>
              </div>
              <TeamPerformanceGrid />
            </section>
          </>
        );
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            {subtext}
          </div>
          <h1 className="font-display text-4xl mt-1.5">
            {greeting}, <span className="italic">{userFirstName}</span>.
          </h1>
          <p className="mt-1 text-sm text-muted-foreground tnum">
            {fmtDate(new Date(), "EEEE, d MMMM yyyy")}
          </p>
        </div>
        <QuickActions />
      </div>

      {renderKpiAndPanels()}

      {userRole !== "super_admin" && (
        <div className="grid grid-cols-1 gap-4">
          <MilestoneTimeline />
        </div>
      )}

      <footer className="pt-6 pb-2 text-center text-[11px] text-muted-foreground">
        NeuroForge Nexus · v4.2.0 · region us-east-1
      </footer>
    </div>
  );
}
