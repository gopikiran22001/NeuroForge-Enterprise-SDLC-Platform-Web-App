import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect } from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";
export function AnimatedNumber({ value, decimals = 0, suffix = "", prefix = "" }) {
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => {
    const n = decimals === 0 ? Math.round(v) : Number(v.toFixed(decimals));
    return `${prefix}${n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${suffix}`;
  });
  useEffect(() => {
    const controls = animate(mv, value, { duration: 1.1, ease: [0.22, 1, 0.36, 1] });
    return () => controls.stop();
  }, [value, mv]);
  return <motion.span className="tnum">{rounded}</motion.span>;
}
export function KpiTile({
  label,
  value,
  decimals = 0,
  suffix,
  prefix,
  delta,
  deltaLabel = "vs last mo.",
  positiveIsGood = true,
  spark,
  index = 0,
}) {
  const positive = (delta ?? 0) >= 0;
  const good = positive === positiveIsGood;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="group relative flex flex-col gap-4 rounded-xl border hairline bg-card p-5"
      style={{ boxShadow: "var(--shadow-kpi)" }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">{label}</div>
        {delta !== void 0 && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium tnum",
              good ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive",
            )}
          >
            {positive ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
            {Math.abs(delta)}
            {suffix?.includes("%") ? "pp" : ""}
          </span>
        )}
      </div>
      <div className="font-display text-4xl leading-none">
        <AnimatedNumber value={value} decimals={decimals} suffix={suffix} prefix={prefix} />
      </div>
      <div className="flex items-end justify-between gap-2">
        <div className="text-[11px] text-muted-foreground">{deltaLabel}</div>
        {spark && <div className="h-8 w-24 shrink-0">{spark}</div>}
      </div>
    </motion.div>
  );
}
