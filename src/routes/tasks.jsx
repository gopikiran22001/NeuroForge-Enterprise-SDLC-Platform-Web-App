import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { 
  ListChecks, Plus, Search, Filter, MessageSquare, Paperclip, Clock, 
  ArrowUpRight, ArrowDownRight, Edit2, Trash2, GitPullRequest, Info, 
  AlertTriangle, CheckCircle, Play, BarChart2, Calendar, FileText, UserPlus,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useSession } from "@/lib/session";
import { taskService, projectService, sprintService, userService } from "@/services/api-services";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from "recharts";

export const Route = createFileRoute("/tasks")({
  validateSearch: (search) => ({
    projectId: search.projectId || undefined,
    sprintId: search.sprintId || undefined,
  }),
  head: () => ({
    meta: [
      { title: "Tasks · NeuroForge Nexus" },
      { name: "description", content: "Interactive Kanban task board and issue tracker." },
    ],
  }),
  component: TasksPage,
});

const COLUMNS = [
  { id: "TODO", title: "To Do", color: "border-t-muted-foreground", bg: "bg-muted/10" },
  { id: "IN_PROGRESS", title: "In Progress", color: "border-t-primary", bg: "bg-primary/5" },
  { id: "REVIEW", title: "Review", color: "border-t-warning", bg: "bg-warning/5" },
  { id: "TESTING", title: "Testing", color: "border-t-indigo-500", bg: "bg-indigo-500/5" },
  { id: "DONE", title: "Done", color: "border-t-success", bg: "bg-success/5" },
  { id: "BLOCKED", title: "Blocked", color: "border-t-destructive", bg: "bg-destructive/5" },
];

function TasksPage() {
  const { projectId: queryProjectId, sprintId: querySprintId } = Route.useSearch();
  const { user: currentUser } = useSession();
  const canEdit = currentUser?.role === "admin" || currentUser?.role === "pm" || currentUser?.role === "super_admin";

  const [projects, setProjects] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [users, setUsers] = useState([]);
  
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedSprintId, setSelectedSprintId] = useState("BACKLOG");
  
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [assigneeFilter, setAssigneeFilter] = useState("ALL");
  
  // Dialog/Form state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewTask, setViewTask] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  
  // Confirmation state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  
  // Task form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("TODO");
  const [priority, setPriority] = useState("MEDIUM");
  const [storyPoints, setStoryPoints] = useState(2);
  const [assigneeId, setAssigneeId] = useState("UNASSIGNED");
  const [labels, setLabels] = useState([]);
  const [newLabel, setNewLabel] = useState("");
  const [dependencies, setDependencies] = useState([]);
  const [blockers, setBlockers] = useState([]);
  
  // Tabs detail subtabs
  const [detailTab, setDetailTab] = useState("overview");
  const [commentText, setCommentText] = useState("");
  const [attachingName, setAttachingName] = useState("");
  const [attachingUrl, setAttachingUrl] = useState("");

  // Parse URL search parameters on mount
  useEffect(() => {
    const initData = async () => {
      try {
        const [projRes, usersRes] = await Promise.all([
          projectService.search({ size: 100 }),
          userService.search({ size: 100 })
        ]);
        const projList = projRes.content || [];
        setProjects(projList);
        setUsers(usersRes.content || []);

        if (projList.length > 0) {
          const defaultProj = queryProjectId || projList[0].id;
          setSelectedProjectId(defaultProj);
          
          // Load sprints for project
          const sprintsRes = await sprintService.search({ projectId: defaultProj, size: 100 });
          const sprintList = sprintsRes.content || [];
          setSprints(sprintList);
          
          if (querySprintId) {
            setSelectedSprintId(querySprintId);
          } else {
            const activeSprint = sprintList.find(s => s.status === "ACTIVE");
            setSelectedSprintId(activeSprint ? activeSprint.id : "BACKLOG");
          }
        }
      } catch (err) {
        console.error("Failed to load initial workspace data:", err);
      }
    };
    initData();
  }, [queryProjectId, querySprintId]);

  // Fetch tasks when project or sprint changes
  const fetchTasks = async () => {
    if (!selectedProjectId) return;
    setLoading(true);
    try {
      const sprintParam = selectedSprintId === "BACKLOG" ? undefined : selectedSprintId;
      const res = await taskService.search({
        projectId: selectedProjectId,
        sprintId: sprintParam,
        size: 100
      });
      setTasks(res.content || []);
    } catch (err) {
      toast.error("Failed to load workspace tasks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [selectedProjectId, selectedSprintId]);

  // Load sprints when project changes
  const handleProjectChange = async (projId) => {
    setSelectedProjectId(projId);
    try {
      const sprintsRes = await sprintService.search({ projectId: projId, size: 100 });
      const sprintList = sprintsRes.content || [];
      setSprints(sprintList);
      const activeSprint = sprintList.find(s => s.status === "ACTIVE");
      setSelectedSprintId(activeSprint ? activeSprint.id : "BACKLOG");
    } catch (err) {
      console.error("Failed to load sprints for project:", err);
    }
  };

  const handleOpenCreate = () => {
    setEditingTask(null);
    setTitle("");
    setDescription("");
    setStatus("TODO");
    setPriority("MEDIUM");
    setStoryPoints(2);
    setAssigneeId("UNASSIGNED");
    setLabels([]);
    setDependencies([]);
    setBlockers([]);
    setDialogOpen(true);
  };

  const handleOpenEdit = (task) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description || "");
    setStatus(task.status || "TODO");
    setPriority(task.priority || "MEDIUM");
    setStoryPoints(task.storyPoints || 0);
    setAssigneeId(task.assigneeId || "UNASSIGNED");
    setLabels(task.labels || []);
    setDependencies(task.dependencies || []);
    setBlockers(task.blockers || []);
    setDialogOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!title) {
      toast.error("Task title is required");
      return;
    }
    setFormLoading(true);
    try {
      const payload = {
        title,
        description,
        status,
        priority,
        storyPoints,
        projectId: selectedProjectId,
        sprintId: selectedSprintId === "BACKLOG" ? null : selectedSprintId,
        assigneeId: assigneeId === "UNASSIGNED" ? null : assigneeId,
        labels,
        dependencies,
        blockers,
      };

      if (editingTask) {
        await taskService.update(editingTask.id, payload);
        toast.success("Task updated successfully");
      } else {
        await taskService.create(payload);
        toast.success("Task created successfully");
      }
      setDialogOpen(false);
      fetchTasks();
    } catch (err) {
      toast.error("Failed to save task");
    } finally {
      setFormLoading(false);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    try {
      const payload = {
        title: task.title,
        description: task.description,
        status: newStatus,
        priority: task.priority,
        storyPoints: task.storyPoints,
        projectId: task.projectId,
        sprintId: task.sprintId,
        assigneeId: task.assigneeId,
        labels: task.labels,
        dependencies: task.dependencies,
        blockers: task.blockers,
      };
      await taskService.update(taskId, payload);
      fetchTasks();
      toast.success(`Task status updated to ${newStatus}`);
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const confirmDelete = (task) => {
    setTaskToDelete(task);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!taskToDelete) return;
    try {
      await taskService.delete(taskToDelete.id);
      toast.success("Task deleted successfully");
      setDeleteOpen(false);
      setTaskToDelete(null);
      fetchTasks();
    } catch (err) {
      toast.error("Failed to delete task");
    }
  };

  const handleAddLabel = () => {
    if (newLabel && !labels.includes(newLabel)) {
      setLabels([...labels, newLabel]);
      setNewLabel("");
    }
  };

  const handleRemoveLabel = (lbl) => {
    setLabels(labels.filter(l => l !== lbl));
  };

  const handlePostComment = async () => {
    if (!commentText || !viewTask) return;
    try {
      const updated = await taskService.addComment(viewTask.id, commentText);
      setViewTask(updated.data || updated);
      setCommentText("");
      fetchTasks();
      toast.success("Comment posted");
    } catch (err) {
      toast.error("Failed to post comment");
    }
  };

  const handleSimulateAttachment = async (e) => {
    e.preventDefault();
    if (!attachingName || !viewTask) return;
    try {
      const updated = await taskService.addAttachment(viewTask.id, {
        name: attachingName,
        size: "2.4 MB",
        url: attachingUrl || "https://neuroforge.org/files/attachment"
      });
      setViewTask(updated.data || updated);
      setAttachingName("");
      setAttachingUrl("");
      fetchTasks();
      toast.success("Attachment added");
    } catch (err) {
      toast.error("Failed to upload attachment");
    }
  };

  // Drag and Drop handlers
  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData("text/plain", taskId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("text/plain");
    if (taskId) {
      handleStatusChange(taskId, targetStatus);
    }
  };

  const filteredTasks = tasks.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase()) || 
                          t.code.toLowerCase().includes(search.toLowerCase());
    const matchesPriority = priorityFilter === "ALL" ? true : t.priority === priorityFilter;
    const matchesAssignee = assigneeFilter === "ALL" ? true : t.assigneeId === assigneeFilter;
    return matchesSearch && matchesPriority && matchesAssignee;
  });

  // Calculate Sprint Info & Stats
  const activeSprint = sprints.find(s => s.id === selectedSprintId);
  const sprintTasks = tasks.filter(t => t.sprintId === selectedSprintId);
  const totalSprintStoryPoints = sprintTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
  const completedSprintStoryPoints = sprintTasks
    .filter(t => t.status === "DONE")
    .reduce((sum, t) => sum + (t.storyPoints || 0), 0);
  const sprintProgress = totalSprintStoryPoints > 0 ? (completedSprintStoryPoints / totalSprintStoryPoints) * 100 : 0;

  // Analytics generation
  const getBurndownData = () => {
    if (!activeSprint) return [];
    const days = 10; // Mock sprint days representation
    const pointsPerDay = totalSprintStoryPoints / (days - 1);
    
    // Distribute actual completion based on task status and index for clean curve
    const doneTasksPoints = sprintTasks.filter(t => t.status === "DONE").reduce((sum, t) => sum + (t.storyPoints || 0), 0);
    
    return Array.from({ length: days }).map((_, idx) => {
      const ideal = Math.max(0, totalSprintStoryPoints - idx * pointsPerDay);
      // Simulate completion progression
      const actualCompletionOffset = idx >= 8 ? doneTasksPoints : (idx / 8) * doneTasksPoints * 0.8;
      const actual = Math.max(0, totalSprintStoryPoints - actualCompletionOffset);
      return {
        name: `Day ${idx + 1}`,
        Ideal: Math.round(ideal),
        Actual: Math.round(actual)
      };
    });
  };

  const getVelocityData = () => {
    return sprints.slice(0, 3).map((s, idx) => ({
      name: s.name,
      Committed: idx === 0 ? 30 : idx === 1 ? 35 : totalSprintStoryPoints || 25,
      Completed: idx === 0 ? 28 : idx === 1 ? 30 : completedSprintStoryPoints || 20
    }));
  };

  const getPriorityDistributionData = () => {
    const priorities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
    const colors = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444"];
    return priorities.map((p, idx) => {
      const count = sprintTasks.filter(t => t.priority === p).length;
      return { name: p, value: count, color: colors[idx] };
    }).filter(p => p.value > 0);
  };

  const getTeamProductivityData = () => {
    return users.map(u => {
      const fullName = `${u.firstName} ${u.lastName}`;
      const completedPoints = sprintTasks
        .filter(t => t.assigneeId === u.id && t.status === "DONE")
        .reduce((sum, t) => sum + (t.storyPoints || 0), 0);
      return { name: fullName, CompletedPoints: completedPoints };
    }).filter(t => t.CompletedPoints > 0);
  };

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4 pb-6 border-b hairline">
        <div>
          <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            Agile Operations
          </div>
          <h1 className="font-display text-3xl mt-1 flex items-center gap-2">
            <ListChecks className="size-6 text-primary" /> Workspace Tasks
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage projects, sprints, Kanban board, and velocity charts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={handleOpenCreate}>
            <Plus className="size-3.5 mr-1" /> Create Task
          </Button>
        </div>
      </header>

      {/* Selectors Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 bg-card p-4 rounded-xl border hairline">
        <div className="space-y-1">
          <Label className="text-[10px] uppercase text-muted-foreground">Select Project</Label>
          <Select value={selectedProjectId} onValueChange={handleProjectChange}>
            <SelectTrigger className="bg-background h-9 text-xs">
              <SelectValue placeholder="Project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-[10px] uppercase text-muted-foreground">Select Sprint</Label>
          <Select value={selectedSprintId} onValueChange={setSelectedSprintId}>
            <SelectTrigger className="bg-background h-9 text-xs">
              <SelectValue placeholder="Sprint" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BACKLOG">Project Backlog</SelectItem>
              {sprints.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name} ({s.status})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-[10px] uppercase text-muted-foreground">Filter Priority</Label>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="bg-background h-9 text-xs">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Priorities</SelectItem>
              <SelectItem value="LOW">Low</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="CRITICAL">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-[10px] uppercase text-muted-foreground">Filter Assignee</Label>
          <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
            <SelectTrigger className="bg-background h-9 text-xs">
              <SelectValue placeholder="Assignee" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Assignees</SelectItem>
              <SelectItem value="UNASSIGNED">Unassigned</SelectItem>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id}>{u.firstName} {u.lastName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="kanban" className="space-y-4">
        <TabsList className="bg-muted">
          <TabsTrigger value="kanban">Kanban Board</TabsTrigger>
          <TabsTrigger value="sprint">Sprint Board</TabsTrigger>
          <TabsTrigger value="analytics">Sprint Analytics</TabsTrigger>
        </TabsList>

        {/* 1. Kanban Board Tab */}
        <TabsContent value="kanban" className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                placeholder="Search board tasks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-9 text-xs bg-card"
              />
            </div>
          </div>

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-muted-foreground text-xs gap-2">
              <Loader2 className="size-6 animate-spin text-primary" />
              Loading board tasks...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 overflow-x-auto pb-4">
              {COLUMNS.map(col => {
                const colTasks = filteredTasks.filter(t => t.status === col.id);
                return (
                  <div 
                    key={col.id} 
                    className={cn("rounded-xl border hairline p-3 flex flex-col min-w-[220px] min-h-[500px]", col.bg)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, col.id)}
                  >
                    <div className="flex items-center justify-between border-b hairline pb-2 mb-3">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{col.title}</span>
                      <span className="text-[10px] font-mono bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">{colTasks.length}</span>
                    </div>

                    <div className="flex-1 space-y-3">
                      {colTasks.length === 0 ? (
                        <div className="h-full border border-dashed rounded-lg hairline flex items-center justify-center py-12 text-muted-foreground text-[10px]">
                          Drop tasks here
                        </div>
                      ) : (
                        colTasks.map(task => {
                          const assignee = users.find(u => u.id === task.assigneeId);
                          const initials = assignee ? `${assignee.firstName[0]}${assignee.lastName[0]}` : "U";

                          return (
                            <div 
                              key={task.id} 
                              draggable
                              onDragStart={(e) => handleDragStart(e, task.id)}
                              className={cn(
                                "rounded-lg border hairline bg-card p-3.5 space-y-2 border-t-2 shadow-sm cursor-grab active:cursor-grabbing transition-all hover:border-primary/40",
                                col.color
                              )}
                              onClick={() => {
                                setViewTask(task);
                                setDetailTab("overview");
                              }}
                            >
                              <div className="flex items-start justify-between gap-1">
                                <span className="text-[9px] font-mono uppercase bg-muted text-muted-foreground px-1 py-0.5 rounded">{task.code}</span>
                                <Badge className="text-[8px] px-1 py-0 uppercase shrink-0" variant={task.priority === "CRITICAL" ? "destructive" : "outline"}>
                                  {task.priority}
                                </Badge>
                              </div>

                              <h4 className="text-xs font-semibold text-foreground leading-snug line-clamp-2">{task.title}</h4>

                              <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-2 border-t border-border/10">
                                <div className="flex items-center gap-1.5">
                                  <div className="grid size-5 place-items-center rounded-full bg-primary-soft text-primary text-[8px] font-bold" title={assignee ? `${assignee.firstName} ${assignee.lastName}` : "Unassigned"}>
                                    {initials}
                                  </div>
                                  <span className="font-mono text-[9px]">{task.storyPoints || 0} SP</span>
                                </div>
                                <span className="flex items-center gap-0.5 text-[9px]">
                                  <MessageSquare className="size-3" /> {task.comments?.length || 0}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* 2. Sprint Board Tab */}
        <TabsContent value="sprint" className="space-y-6">
          {selectedSprintId === "BACKLOG" ? (
            <div className="text-center py-16 border border-dashed rounded-xl hairline text-muted-foreground text-xs space-y-2">
              <Info className="size-8 mx-auto text-muted-foreground" />
              <div>Please select an active Sprint from the filter panel to view Sprint Board metrics.</div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Sprint Goals header */}
              <div className="bg-card border hairline rounded-xl p-6 space-y-4">
                <div className="flex justify-between items-start flex-wrap gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-foreground flex items-center gap-1.5">
                      <Calendar className="size-4 text-primary" /> {activeSprint?.name}
                    </h2>
                    <p className="text-xs text-muted-foreground mt-1">Goal: <span className="text-foreground font-semibold">{activeSprint?.goal || "None defined"}</span></p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-muted-foreground">Sprint Status:</span>
                    <Badge className="ml-2 font-mono uppercase">{activeSprint?.status}</Badge>
                  </div>
                </div>

                <div className="space-y-1.5 pt-3 border-t border-border/10">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Story Points Completion Progress</span>
                    <span className="font-mono">{completedSprintStoryPoints} / {totalSprintStoryPoints} SP ({Math.round(sprintProgress)}%)</span>
                  </div>
                  <Progress value={sprintProgress} className="h-2 bg-muted" />
                </div>
              </div>

              {/* Tasks separation */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Remaining tasks */}
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Remaining Tasks ({sprintTasks.filter(t => t.status !== "DONE").length})</h3>
                  <div className="space-y-2">
                    {sprintTasks.filter(t => t.status !== "DONE").map(t => (
                      <div 
                        key={t.id} 
                        className="bg-card border hairline p-4 rounded-lg flex items-center justify-between gap-3 hover:border-primary/20 cursor-pointer"
                        onClick={() => {
                          setViewTask(t);
                          setDetailTab("overview");
                        }}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-mono uppercase bg-muted text-muted-foreground px-1 py-0.5 rounded">{t.code}</span>
                            <Badge className="text-[8px] py-0" variant="outline">{t.status}</Badge>
                          </div>
                          <h4 className="text-xs font-semibold text-foreground truncate mt-1">{t.title}</h4>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0 font-mono">
                          <span>{t.storyPoints} SP</span>
                          <Button size="xs" variant="secondary" onClick={(e) => { e.stopPropagation(); handleStatusChange(t.id, "DONE"); }}>Done</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Completed tasks */}
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider text-success">Completed Tasks ({sprintTasks.filter(t => t.status === "DONE").length})</h3>
                  <div className="space-y-2">
                    {sprintTasks.filter(t => t.status === "DONE").map(t => (
                      <div 
                        key={t.id} 
                        className="bg-card border hairline p-4 rounded-lg flex items-center justify-between gap-3 hover:border-primary/20 opacity-80 cursor-pointer"
                        onClick={() => {
                          setViewTask(t);
                          setDetailTab("overview");
                        }}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-mono uppercase bg-muted text-muted-foreground px-1 py-0.5 rounded">{t.code}</span>
                            <Badge className="text-[8px] py-0 bg-success/15 text-success border-success/20">DONE</Badge>
                          </div>
                          <h4 className="text-xs font-semibold text-foreground truncate mt-1 line-through">{t.title}</h4>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0 font-mono">
                          <span>{t.storyPoints} SP</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        {/* 3. Sprint Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          {selectedSprintId === "BACKLOG" ? (
            <div className="text-center py-16 border border-dashed rounded-xl hairline text-muted-foreground text-xs space-y-2">
              <Info className="size-8 mx-auto text-muted-foreground" />
              <div>Please select an active Sprint from the filter panel to view Sprint Telemetry.</div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Burndown chart */}
                <div className="bg-card border hairline rounded-xl p-5 space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sprint Burndown Chart (Remaining SP)</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={getBurndownData()}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                        <XAxis dataKey="name" stroke="#888888" fontSize={11} />
                        <YAxis stroke="#888888" fontSize={11} />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="Ideal" stroke="#a1a1aa" strokeDasharray="5 5" />
                        <Line type="monotone" dataKey="Actual" stroke="#3b82f6" strokeWidth={2.5} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Velocity chart */}
                <div className="bg-card border hairline rounded-xl p-5 space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sprint Velocity (Committed vs Completed SP)</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={getVelocityData()}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                        <XAxis dataKey="name" stroke="#888888" fontSize={11} />
                        <YAxis stroke="#888888" fontSize={11} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="Committed" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Completed" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Team productivity */}
                <div className="bg-card border hairline rounded-xl p-5 space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Team Productivity (Completed Story Points)</h3>
                  {getTeamProductivityData().length === 0 ? (
                    <div className="text-xs text-muted-foreground py-10 text-center">No story points completed yet in this sprint.</div>
                  ) : (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={getTeamProductivityData()}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                          <XAxis dataKey="name" stroke="#888888" fontSize={11} />
                          <YAxis stroke="#888888" fontSize={11} />
                          <Tooltip />
                          <Bar dataKey="CompletedPoints" fill="#10b981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* Priority distribution */}
                <div className="bg-card border hairline rounded-xl p-5 space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Story Point Distribution by Priority</h3>
                  {getPriorityDistributionData().length === 0 ? (
                    <div className="text-xs text-muted-foreground py-10 text-center">No tasks inside the active sprint yet.</div>
                  ) : (
                    <div className="h-64 flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={getPriorityDistributionData()}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {getPriorityDistributionData().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit/Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md bg-card border hairline">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {editingTask ? "Edit Agile Task" : "New Agile Task"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="title">Task Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Write integration test suite"
                required
                disabled={formLoading}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="desc">Description</Label>
              <Textarea
                id="desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detailed description of task deliverables..."
                disabled={formLoading}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus} disabled={formLoading}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {COLUMNS.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select value={priority} onValueChange={setPriority} disabled={formLoading}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="CRITICAL">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="storyPoints">Story Points (SP)</Label>
                <Input
                  id="storyPoints"
                  type="number"
                  value={storyPoints}
                  onChange={(e) => setStoryPoints(Number(e.target.value))}
                  required
                  min={0}
                  disabled={formLoading}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Assignee</Label>
                <Select value={assigneeId} onValueChange={setAssigneeId} disabled={formLoading}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select User" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UNASSIGNED">Unassigned</SelectItem>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>{u.firstName} {u.lastName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Labels Input */}
            <div className="space-y-1.5">
              <Label>Labels / Tags</Label>
              <div className="flex gap-2">
                <Input
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="e.g. backend"
                  className="flex-1"
                  disabled={formLoading}
                />
                <Button type="button" size="sm" variant="outline" onClick={handleAddLabel} disabled={formLoading}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-2">
                {labels.map(l => (
                  <Badge key={l} variant="secondary" className="flex items-center gap-1">
                    {l}
                    <button type="button" onClick={() => handleRemoveLabel(l)} className="text-destructive hover:underline font-bold text-[9px]">x</button>
                  </Badge>
                ))}
              </div>
            </div>

            {/* Dependencies & Blockers */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Dependencies</Label>
                <div className="border hairline rounded-lg p-2 max-h-32 overflow-y-auto space-y-1 bg-background text-[11px]">
                  {tasks.filter(t => t.id !== editingTask?.id).map(t => (
                    <div key={t.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={dependencies.includes(t.id)}
                        onChange={(e) => {
                          setDependencies(e.target.checked 
                            ? [...dependencies, t.id]
                            : dependencies.filter(id => id !== t.id)
                          );
                        }}
                      />
                      <label className="truncate">{t.code} - {t.title}</label>
                    </div>
                  ))}
                  {tasks.filter(t => t.id !== editingTask?.id).length === 0 && (
                    <div className="text-muted-foreground italic text-[10px]">No other tasks</div>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Blockers</Label>
                <div className="border hairline rounded-lg p-2 max-h-32 overflow-y-auto space-y-1 bg-background text-[11px]">
                  {tasks.filter(t => t.id !== editingTask?.id).map(t => (
                    <div key={t.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={blockers.includes(t.id)}
                        onChange={(e) => {
                          setBlockers(e.target.checked 
                            ? [...blockers, t.id]
                            : blockers.filter(id => id !== t.id)
                          );
                        }}
                      />
                      <label className="truncate">{t.code} - {t.title}</label>
                    </div>
                  ))}
                  {tasks.filter(t => t.id !== editingTask?.id).length === 0 && (
                    <div className="text-muted-foreground italic text-[10px]">No other tasks</div>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter className="pt-4 border-t hairline mt-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={formLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={formLoading}>
                {formLoading ? <Loader2 className="size-3.5 animate-spin" /> : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Task Details Sheet */}
      <Sheet open={viewTask !== null} onOpenChange={(open) => !open && setViewTask(null)}>
        <SheetContent className="bg-card border-l hairline sm:max-w-xl overflow-y-auto">
          <SheetHeader className="pb-4 border-b hairline flex flex-row justify-between items-start gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs uppercase bg-muted text-muted-foreground px-1.5 py-0.5 rounded">{viewTask?.code}</span>
                <Badge className="text-[10px] py-0" variant={viewTask?.priority === "CRITICAL" ? "destructive" : "outline"}>
                  {viewTask?.priority}
                </Badge>
              </div>
              <SheetTitle className="font-display text-xl mt-1.5">{viewTask?.title}</SheetTitle>
            </div>
            {canEdit && viewTask && (
              <div className="flex gap-1.5 pt-4">
                <Button size="xs" variant="outline" onClick={() => { handleOpenEdit(viewTask); setViewTask(null); }}>
                  <Edit2 className="size-3.5 mr-1" /> Edit
                </Button>
                <Button size="xs" variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={() => confirmDelete(viewTask)}>
                  <Trash2 className="size-3.5 mr-1" /> Delete
                </Button>
              </div>
            )}
          </SheetHeader>

          <Tabs defaultValue="overview" className="mt-6" value={detailTab} onValueChange={setDetailTab}>
            <TabsList className="bg-muted w-full justify-start">
              <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
              <TabsTrigger value="comments" className="text-xs">Comments ({viewTask?.comments?.length || 0})</TabsTrigger>
              <TabsTrigger value="attachments" className="text-xs">Attachments ({viewTask?.attachments?.length || 0})</TabsTrigger>
              <TabsTrigger value="history" className="text-xs">Activity History</TabsTrigger>
            </TabsList>

            {/* A. Overview tab */}
            <TabsContent value="overview" className="space-y-5 mt-4 text-xs">
              <div className="space-y-1">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Description</span>
                <p className="text-foreground leading-relaxed bg-surface p-3 rounded-lg border hairline">{viewTask?.description || "No description provided."}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border/10">
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Status</span>
                  <div className="font-medium text-foreground mt-1">{viewTask?.status}</div>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Story Points</span>
                  <div className="font-medium text-foreground mt-1 font-mono">{viewTask?.storyPoints} SP</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Assignee</span>
                  <div className="font-medium text-foreground mt-1">
                    {viewTask?.assigneeName || "Unassigned"}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Project</span>
                  <div className="font-medium text-foreground mt-1">
                    {viewTask?.projectName}
                  </div>
                </div>
              </div>

              {viewTask?.labels && viewTask.labels.length > 0 && (
                <div className="space-y-1 pt-3 border-t border-border/10">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Labels</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {viewTask.labels.map(l => (
                      <Badge key={l} variant="secondary">{l}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Dependencies & Blockers */}
              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border/10">
                <div>
                  <span className="text-[10px] text-destructive uppercase font-bold tracking-wider flex items-center gap-1">
                    <AlertTriangle className="size-3.5" /> Blocked By
                  </span>
                  <div className="mt-1 space-y-1">
                    {viewTask?.blockers && viewTask.blockers.map(bid => {
                      const bl = tasks.find(t => t.id === bid);
                      return bl ? <div key={bid} className="font-medium text-destructive font-mono">{bl.code} - {bl.title}</div> : null;
                    })}
                    {(!viewTask?.blockers || viewTask.blockers.length === 0) && <div className="text-muted-foreground italic">None</div>}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-primary uppercase font-bold tracking-wider flex items-center gap-1">
                    <GitPullRequest className="size-3.5" /> Depends On
                  </span>
                  <div className="mt-1 space-y-1">
                    {viewTask?.dependencies && viewTask.dependencies.map(did => {
                      const dep = tasks.find(t => t.id === did);
                      return dep ? <div key={did} className="font-medium text-primary font-mono">{dep.code} - {dep.title}</div> : null;
                    })}
                    {(!viewTask?.dependencies || viewTask.dependencies.length === 0) && <div className="text-muted-foreground italic">None</div>}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* B. Comments tab */}
            <TabsContent value="comments" className="space-y-4 mt-4 text-xs">
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {viewTask?.comments?.map((c, idx) => (
                  <div key={c.id || idx} className="bg-muted/30 border hairline p-3 rounded-lg space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                      <span className="font-semibold text-foreground">{c.authorName} ({c.authorEmail})</span>
                      <span>{new Date(c.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-foreground leading-relaxed">{c.text}</p>
                  </div>
                ))}
                {(!viewTask?.comments || viewTask.comments.length === 0) && (
                  <div className="text-muted-foreground text-center py-6 italic">No comments posted yet.</div>
                )}
              </div>

              <div className="space-y-2 pt-3 border-t border-border/10">
                <Label htmlFor="commentText">Post Comment</Label>
                <Textarea
                  id="commentText"
                  placeholder="Type comment details..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                />
                <Button size="sm" className="w-full" onClick={handlePostComment}>Post Comment</Button>
              </div>
            </TabsContent>

            {/* C. Attachments tab */}
            <TabsContent value="attachments" className="space-y-4 mt-4 text-xs">
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {viewTask?.attachments?.map((a, idx) => (
                  <div key={a.id || idx} className="border hairline p-3 rounded-lg flex items-center justify-between gap-3 bg-surface/50">
                    <div>
                      <div className="font-semibold text-foreground">{a.name}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">Size: {a.size} · Uploaded: {new Date(a.createdAt).toLocaleDateString()}</div>
                    </div>
                    <a href={a.url} target="_blank" rel="noreferrer">
                      <Button size="xs" variant="outline">Download</Button>
                    </a>
                  </div>
                ))}
                {(!viewTask?.attachments || viewTask.attachments.length === 0) && (
                  <div className="text-muted-foreground text-center py-6 italic">No attachments uploaded yet.</div>
                )}
              </div>

              <form onSubmit={handleSimulateAttachment} className="space-y-3 pt-3 border-t border-border/10">
                <div className="space-y-1.5">
                  <Label htmlFor="fileName">Upload Attachment (Simulate)</Label>
                  <Input
                    id="fileName"
                    placeholder="e.g. sprint-diagram.png"
                    value={attachingName}
                    onChange={(e) => setAttachingName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="fileUrl">File Target URL (Optional)</Label>
                  <Input
                    id="fileUrl"
                    placeholder="e.g. https://domain.org/diagram.png"
                    value={attachingUrl}
                    onChange={(e) => setAttachingUrl(e.target.value)}
                  />
                </div>
                <Button type="submit" size="sm" variant="secondary" className="w-full">Upload Attachment Metadata</Button>
              </form>
            </TabsContent>

            {/* D. Activity History tab */}
            <TabsContent value="history" className="space-y-3 mt-4 text-xs">
              <div className="relative border-l border-border/40 pl-4 ml-2 space-y-4">
                {viewTask?.activityHistory?.map((log, idx) => (
                  <div key={log.id || idx} className="relative">
                    <span className="absolute -left-[21px] top-1.5 grid size-2 place-items-center rounded-full bg-primary ring-4 ring-background" />
                    <div className="text-[10px] text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</div>
                    <div className="font-semibold text-foreground mt-0.5">{log.action}</div>
                    <div className="text-muted-foreground text-[10px]">Actor: {log.actorName}</div>
                  </div>
                ))}
                {(!viewTask?.activityHistory || viewTask.activityHistory.length === 0) && (
                  <div className="text-muted-foreground italic pl-2">No activity history tracked.</div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation */}
      <ConfirmationDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Agile Task"
        description={`Are you sure you want to delete task ${taskToDelete?.code}? This action is irreversible.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
      />
    </div>
  );
}
