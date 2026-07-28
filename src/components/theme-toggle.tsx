import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  const isDark = resolvedTheme === "dark";
  
  const cycleTheme = () => {
    if (theme === "light") {
      setTheme("dark");
    } else if (theme === "dark") {
      setTheme("light");
    } else {
      setTheme(isDark ? "light" : "dark");
    }
  };
  
  return (
    <button
      onClick={cycleTheme}
      className="bp-tap flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label="Toggle theme"
    >
      {mounted && isDark ? (
        <Sun className="h-4 w-4" />
      ) : mounted ? (
        <Moon className="h-4 w-4" />
      ) : (
        <div className="h-4 w-4" />
      )}
    </button>
  );
}
