import { formatDistanceToNowStrict, format } from "date-fns";
import { useEffect, useState } from "react";
export const nf = new Intl.NumberFormat("en-US");
export const pct = (n, d = 1) => `${n.toFixed(d)}%`;
export function relTime(date) {
  const d = typeof date === "string" ? new Date(date) : date;
  return formatDistanceToNowStrict(d, { addSuffix: true });
}
export function useRelTime(date) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return "just now";
  return relTime(date);
}
export function fmtDate(date, f = "d MMM yyyy") {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, f);
}
export function initials(name) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
