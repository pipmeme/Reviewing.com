import { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 rounded-2xl border border-dashed bg-background/60 supports-[backdrop-filter]:backdrop-blur-sm animate-fade-in">
      {icon && <div className="mb-4 text-muted-foreground/80">{icon}</div>}
      <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground mt-2 max-w-md">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

