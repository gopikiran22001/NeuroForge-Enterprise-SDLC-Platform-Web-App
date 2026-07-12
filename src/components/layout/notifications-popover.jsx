import { Bell } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { fmtDate } from "@/lib/format";
import { cn } from "@/lib/utils";

// Static notifications data (previously from mock/data.js — now inlined since these are UI-only)
const BASE = new Date("2026-07-03T09:00:00Z").getTime();
function iso(offsetMin) {
  return new Date(BASE + offsetMin * 6e4).toISOString();
}
const NOTIFICATIONS = [
  { id: "n1", title: "Build failed", body: "Atlas Payments #4419 failed on stage", at: iso(-12), unread: true, kind: "danger" },
  { id: "n2", title: "Release approved", body: "FinCore Nexus 2.3-rc.4 approved by Priya", at: iso(-45), unread: true, kind: "success" },
  { id: "n3", title: "New comment on risk", body: "Marcus mentioned you on 'iOS 18 blocker'", at: iso(-120), unread: true, kind: "info" },
  { id: "n4", title: "Sprint starting tomorrow", body: "Platform Core — Sprint 13 kickoff", at: iso(-320), unread: false, kind: "info" },
  { id: "n5", title: "Access review due", body: "Quarterly RBAC review due in 5 days", at: iso(-600), unread: false, kind: "warning" },
];

const KIND_COLOR = {
  info: "bg-info",
  warning: "bg-warning",
  success: "bg-success",
  danger: "bg-destructive",
};
export function NotificationsPopover() {
  const unread = NOTIFICATIONS.filter((n) => n.unread).length;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Notifications" className="relative size-8">
          <Bell className="size-4" />
          {unread > 0 && (
            <span className="absolute top-1 right-1 grid min-w-[16px] h-[16px] place-items-center rounded-full bg-primary text-[9px] font-semibold text-primary-foreground px-1">
              {unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0">
        <div className="flex items-center justify-between border-b hairline px-3 py-2">
          <div className="text-sm font-medium">Notifications</div>
          <button className="text-[11px] text-muted-foreground hover:text-foreground">
            Mark all read
          </button>
        </div>
        <ul className="max-h-96 overflow-auto divide-y divide-[var(--color-hairline)]">
          {NOTIFICATIONS.map((n) => (
            <li key={n.id} className="flex gap-3 px-3 py-2.5 hover:bg-accent/40">
              <span className={cn("mt-1.5 size-1.5 rounded-full shrink-0", KIND_COLOR[n.kind])} />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <div className="text-sm font-medium truncate">{n.title}</div>
                  <div className="text-[11px] text-muted-foreground shrink-0 tnum">
                    {fmtDate(n.at, "d MMM · HH:mm")}
                  </div>
                </div>
                <p className="text-[12px] text-muted-foreground line-clamp-2">{n.body}</p>
              </div>
              {n.unread && <span className="mt-2 size-1.5 rounded-full bg-primary shrink-0" />}
            </li>
          ))}
        </ul>
        <div className="border-t hairline px-3 py-2 text-center">
          <button className="text-[12px] text-muted-foreground hover:text-foreground">
            View all
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
