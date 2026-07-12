import { Search } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { NotificationsPopover } from "@/components/layout/notifications-popover";
import { UserMenu } from "@/components/layout/user-menu";
import { useCommandPalette } from "@/components/shared/command-palette";
export function TopBar() {
  const { setOpen } = useCommandPalette();
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b hairline bg-background/90 backdrop-blur px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="h-5" />
      <Breadcrumbs />

      <div className="ml-auto flex items-center gap-1.5">
        <button
          onClick={() => setOpen(true)}
          className="hidden md:flex items-center gap-2 h-8 w-64 rounded-md border hairline bg-surface-2 pl-2.5 pr-2 text-left text-[12px] text-muted-foreground hover:border-primary/30 transition-colors"
          aria-label="Open command palette"
        >
          <Search className="size-3.5" />
          <span className="flex-1 truncate">Search or jump to…</span>
        </button>
        <NotificationsPopover />
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}
