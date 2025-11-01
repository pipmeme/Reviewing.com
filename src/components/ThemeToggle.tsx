import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "theme"; // 'light' | 'dark' | 'system'

export function ThemeToggle() {
  const [theme, setTheme] = useState<string>("system");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) || "system";
    setTheme(saved);
    applyTheme(saved);
  }, []);

  const applyTheme = (mode: string) => {
    const root = document.documentElement;
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldDark = mode === "dark" || (mode === "system" && prefersDark);

    root.classList.add("transition-colors");
    root.classList.add("duration-300");
    // small trick to ensure smoothness without lingering class
    window.setTimeout(() => {
      root.classList.remove("transition-colors");
      root.classList.remove("duration-300");
    }, 320);

    root.classList.toggle("dark", shouldDark);
  };

  const cycleTheme = () => {
    const order = ["light", "dark", "system"] as const;
    const idx = Math.max(0, order.indexOf(theme as any));
    const next = order[(idx + 1) % order.length];
    localStorage.setItem(STORAGE_KEY, next);
    setTheme(next);
    applyTheme(next);
  };

  const isDark = document.documentElement.classList.contains("dark");
  const label = theme === "system" ? (isDark ? "System (Dark)" : "System (Light)") : theme === "dark" ? "Dark" : "Light";

  return (
    <Button
      variant="ghost"
      size="sm"
      aria-label={`Toggle theme: ${label}`}
      onClick={cycleTheme}
      className="relative motion-lift"
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle Theme</span>
    </Button>
  );
}

