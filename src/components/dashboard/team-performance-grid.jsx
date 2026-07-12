import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkline } from "@/components/dashboard/delivery-pulse-chart";
import { api } from "@/lib/api";
import { Loader2 } from "lucide-react";

const sparks = [
  [42, 48, 51, 47, 55, 58, 62],
  [38, 41, 39, 44, 46, 45, 48],
  [58, 61, 65, 63, 68, 70, 71],
  [30, 33, 32, 35, 37, 38, 39],
];

export function mapBackendTeamToFrontend(t) {
  if (!t) return null;
  const hash = t.name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const velocity = 35 + (hash % 40);
  const throughput = Math.round(velocity * 0.7);
  const reviewLatencyH = (1.5 + (hash % 80) / 10).toFixed(1);

  const leads = ["Diego Ramos", "Sara Okonkwo", "Lin Zhao", "Yuki Tanaka"];
  const onCall = leads[hash % leads.length];

  return {
    id: t.id,
    name: t.name,
    lead: t.teamLeaderEmail
      ? t.teamLeaderEmail
          .split("@")[0]
          .split(".")
          .map((n) => n.charAt(0).toUpperCase() + n.slice(1))
          .join(" ")
      : "Diego Ramos",
    velocity,
    throughput,
    reviewLatencyH: parseFloat(reviewLatencyH),
    onCall,
    members: t.memberIds ? t.memberIds.length || 8 : 8,
  };
}

export function TeamPerformanceGrid() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const res = await api.get("/api/teams?size=10");
        // PageResponse contains 'content'
        const mapped = (res.content || []).map(mapBackendTeamToFrontend);
        setTeams(mapped);
      } catch (err) {
        console.error("Failed to load dashboard teams:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTeams();
  }, []);

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-muted-foreground text-xs gap-2">
        <Loader2 className="size-6 animate-spin text-primary" />
        Loading team performance grid...
      </div>
    );
  }

  if (teams.length === 0) {
    return <div className="py-20 text-center text-muted-foreground text-sm">No teams found.</div>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {teams.map((t, i) => (
        <motion.div
          key={t.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 + i * 0.05, duration: 0.4 }}
          className="rounded-xl border hairline bg-card p-4"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                Team
              </div>
              <div className="font-medium truncate">{t.name}</div>
            </div>
            <div className="text-[10px] text-muted-foreground tnum">{t.members} members</div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <Stat label="Velocity" value={`${t.velocity}`} />
            <Stat label="Throughput" value={`${t.throughput}`} />
            <Stat label="Review" value={`${t.reviewLatencyH}h`} muted={t.reviewLatencyH > 5} />
            <Stat label="On-call" value={t.onCall.split(" ")[0]} />
          </div>

          <div className="mt-3 h-8 -mx-1">
            <Sparkline data={sparks[i % sparks.length]} />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function Stat({ label, value, muted }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`text-[15px] font-medium tnum ${muted ? "text-warning" : ""}`}>{value}</div>
    </div>
  );
}
