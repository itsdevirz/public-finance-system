import { useLocation } from "react-router-dom";
import { Construction } from "lucide-react";
import { PageShell, EmptyState } from "@/components/layout/PageShell";

function titleFromPath(pathname) {
  const last = pathname.split("/").filter(Boolean).pop() ?? "";
  return last.replace(/-/g, " ");
}

export default function Placeholder({ label }) {
  const { pathname } = useLocation();
  const title = label ?? titleFromPath(pathname);

  return (
    <PageShell>
      <EmptyState
        icon={Construction}
        title={title}
        description="این بخش در حال توسعه است"
      />
    </PageShell>
  );
}
