import { ChevronsUpDown, Check } from "lucide-react";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
const workspaces = [
  { id: "w1", org: "Acme Corp", name: "Platform Engineering", tier: "Enterprise" },
  { id: "w2", org: "Acme Corp", name: "Data Platform", tier: "Enterprise" },
  { id: "w3", org: "Northwind", name: "Retail Cloud", tier: "Business" },
];
export function WorkspaceSwitcher() {
  const [active, setActive] = useState(workspaces[0]);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="w-full flex items-center gap-2 rounded-md border hairline bg-surface px-2 py-1.5 text-left hover:bg-accent/40 transition-colors">
          <div className="grid size-6 place-items-center rounded bg-foreground text-background text-[10px] font-semibold shrink-0">
            {active.org.slice(0, 1)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[12px] font-medium leading-tight">{active.org}</div>
            <div className="truncate text-[10px] text-muted-foreground leading-tight">
              {active.name}
            </div>
          </div>
          <ChevronsUpDown className="size-3.5 text-muted-foreground shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Workspaces
        </DropdownMenuLabel>
        {workspaces.map((w) => (
          <DropdownMenuItem key={w.id} onSelect={() => setActive(w)} className="gap-2">
            <div className="grid size-6 place-items-center rounded bg-foreground text-background text-[10px] font-semibold">
              {w.org.slice(0, 1)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm">{w.org}</div>
              <div className="text-[11px] text-muted-foreground">
                {w.name} · {w.tier}
              </div>
            </div>
            {active.id === w.id && <Check className="size-3.5" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem>Create workspace</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
