import { LogOut, User, ShieldCheck, KeyRound, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSession } from "@/lib/session";
import { ROLE_LABEL } from "@/lib/permissions";
import { useNavigate } from "@tanstack/react-router";

export function UserMenu() {
  const { user, setRole, logout } = useSession();
  const navigate = useNavigate();

  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  const handleLogout = async () => {
    await logout();
    navigate({ to: "/login" });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-md pl-1 pr-1.5 h-8 hover:bg-accent/50 transition-colors">
          <div
            className="grid size-6 place-items-center rounded-full text-[10px] font-semibold text-primary-foreground"
            style={{ background: user.avatarColor }}
          >
            {initials}
          </div>
          <ChevronDown className="size-3.5 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <div className="px-2 py-2">
          <div className="text-sm font-medium leading-tight">{user.name}</div>
          <div className="text-[11px] text-muted-foreground">{user.email}</div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate({ to: "/settings" })}>
          <User className="size-3.5" /> Profile
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate({ to: "/settings" })}>
          <ShieldCheck className="size-3.5" /> Security
        </DropdownMenuItem>
        <DropdownMenuItem>
          <KeyRound className="size-3.5" /> API keys
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="size-3.5" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
