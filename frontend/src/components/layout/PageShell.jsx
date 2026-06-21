import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const shellVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
};

export function PageShell({ children, className }) {
  return (
    <motion.div
      variants={shellVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={cn("page-container", className)}
    >
      {children}
    </motion.div>
  );
}

export function PageHeader({ title, description, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
    >
      <div className="space-y-1">
        <h1 className="page-title mb-0">{title}</h1>
        {description && <p className="text-sm text-muted-foreground pr-3">{description}</p>}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </motion.div>
  );
}

export function EmptyState({ icon: Icon, title, description }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/30 px-6 py-16 text-center"
    >
      {Icon && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.2 }}
          className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"
        >
          <Icon className="h-7 w-7" />
        </motion.div>
      )}
      <p className="text-base font-medium text-foreground">{title}</p>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
    </motion.div>
  );
}

export function LoadingSkeleton({ rows = 5 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05, duration: 0.3 }}
          className="flex gap-3"
        >
          <div className="h-10 flex-1 animate-pulse rounded-xl bg-muted" />
        </motion.div>
      ))}
    </div>
  );
}
