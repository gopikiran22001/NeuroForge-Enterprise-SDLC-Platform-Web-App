import { Moon, Sun } from "lucide-react";
import { useSession } from "@/lib/session";
import { Button } from "@/components/ui/button";
export function ThemeToggle() {
  const { theme, toggleTheme } = useSession();
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="size-8"
    >
      {theme === "light" ? <Moon className="size-4" /> : <Sun className="size-4" />}
    </Button>
  );
}
