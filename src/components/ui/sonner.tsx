import { useEffect, useMemo, useState } from "react";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

function resolveTheme(): "light" | "dark" | "system" {
  if (typeof window === "undefined") return "system";
  const stored = localStorage.getItem("theme") as "light" | "dark" | "system" | null;
  if (!stored || stored === "system") return "system";
  return stored;
}

const Toaster = ({ ...props }: ToasterProps) => {
  const [theme, setTheme] = useState<"light" | "dark" | "system">(() => resolveTheme());

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "theme") setTheme(resolveTheme());
    };
    const media = window.matchMedia?.("(prefers-color-scheme: dark)");
    const onMedia = () => setTheme(resolveTheme());
    window.addEventListener("storage", onStorage);
    media?.addEventListener?.("change", onMedia as any);
    return () => {
      window.removeEventListener("storage", onStorage);
      media?.removeEventListener?.("change", onMedia as any);
    };
  }, []);

  const sonnerTheme = useMemo<ToasterProps["theme"]>(() => theme, [theme]);

  return (
    <Sonner
      theme={sonnerTheme}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg animate-scale-in",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
