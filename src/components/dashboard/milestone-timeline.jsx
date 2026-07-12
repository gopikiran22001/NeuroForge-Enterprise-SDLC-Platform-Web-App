import { useEffect, useState } from "react";
import { fmtDate } from "@/lib/format";
import { differenceInDays, min, max } from "date-fns";
import { api } from "@/lib/api";
import { Loader2 } from "lucide-react";

export function mapBackendMilestoneToFrontend(m) {
  if (!m) return null;
  let progress = 40;
  if (m.status === "COMPLETED") progress = 100;
  else if (m.status === "IN_PROGRESS") progress = 60;
  else if (m.status === "PLANNED") progress = 10;
  else if (m.status === "ON_HOLD") progress = 30;

  const due = m.dueDate || new Date(Date.now() + 15 * 86400000).toISOString();
  const start = m.createdAt || new Date(new Date(due).getTime() - 30 * 86400000).toISOString();

  return {
    id: m.id,
    name: m.name,
    project: m.projectCode || "FinCore Nexus",
    start: start,
    end: due,
    progress: progress,
  };
}

export function MilestoneTimeline() {
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMilestones = async () => {
      try {
        const res = await api.get("/api/milestones?size=5");
        const mapped = (res.content || []).map(mapBackendMilestoneToFrontend);
        setMilestones(mapped);
      } catch (err) {
        console.error("Failed to load dashboard milestones:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMilestones();
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl border hairline bg-card p-4 h-[250px] flex flex-col items-center justify-center text-muted-foreground text-xs gap-2">
        <Loader2 className="size-6 animate-spin text-primary" />
        Loading milestones...
      </div>
    );
  }

  if (milestones.length === 0) {
    return (
      <div className="rounded-xl border hairline bg-card p-4 h-[250px] flex items-center justify-center text-muted-foreground text-sm">
        No upcoming milestones.
      </div>
    );
  }

  const starts = milestones.map((m) => new Date(m.start));
  const ends = milestones.map((m) => new Date(m.end));
  const rangeStart = min(starts);
  const rangeEnd = max(ends);
  const total = Math.max(1, differenceInDays(rangeEnd, rangeStart));

  return (
    <div className="rounded-xl border hairline bg-card p-4">
      <div className="flex items-baseline justify-between">
        <div>
          <h3 className="text-sm font-semibold">Upcoming milestones</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {fmtDate(rangeStart, "MMM d")} — {fmtDate(rangeEnd, "MMM d, yyyy")}
          </p>
        </div>
        <div className="text-[11px] text-muted-foreground tnum">{milestones.length} milestones</div>
      </div>

      <div className="mt-5 space-y-3">
        {milestones.map((m) => {
          const offset = (differenceInDays(new Date(m.start), rangeStart) / total) * 100;
          const width = Math.max(
            6,
            (differenceInDays(new Date(m.end), new Date(m.start)) / total) * 100,
          );
          return (
            <div key={m.id} className="grid grid-cols-[180px_1fr_60px] gap-3 items-center">
              <div className="min-w-0">
                <div className="text-[13px] font-medium truncate">{m.name}</div>
                <div className="text-[11px] text-muted-foreground truncate">{m.project}</div>
              </div>
              <div className="relative h-6">
                <div className="absolute inset-y-0 left-0 right-0 rounded-md bg-muted/60" />
                <div
                  className="absolute inset-y-0 rounded-md bg-primary-soft border hairline overflow-hidden"
                  style={{ left: `${offset}%`, width: `${width}%` }}
                >
                  <div className="h-full bg-primary/70" style={{ width: `${m.progress}%` }} />
                </div>
              </div>
              <div className="text-right text-[11px] text-muted-foreground tnum">{m.progress}%</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
