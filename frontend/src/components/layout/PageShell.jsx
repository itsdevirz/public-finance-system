import { cn } from "@/lib/utils";

export function PageShell({ children, className }) {
  return (
    <div className={cn("page-container animate-in fade-in slide-in-from-bottom-4 duration-500", className)}>
      {children}
    </div>
  );
}

export function PageHeader({ title, description, children }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1">
        <h1 className="page-title mb-0">{title}</h1>
        {description && <p className="text-sm text-muted-foreground pr-3">{description}</p>}
      </div>
      {children && <div className="flex items-center gap-2 animate-in fade-in duration-500 delay-150">{children}</div>}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/30 px-6 py-16 text-center animate-in fade-in zoom-in-95 duration-500">
      {Icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform duration-300 hover:scale-105">
          <Icon className="h-7 w-7" />
        </div>
      )}
      <p className="text-base font-medium text-foreground">{title}</p>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
    </div>
  );
}

export function LoadingSkeleton({ rows = 5 }) {
  return (
    <div className="space-y-3 animate-in fade-in duration-300">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-3">
          <div className="h-10 flex-1 animate-pulse rounded-xl bg-muted" />
        </div>
      ))}
    </div>
  );
}
