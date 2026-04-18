import { PageShell } from "@/components/page-shell";
import { TableSkeleton } from "@/components/skeletons/table-skeleton";

export default function DashboardLoading() {
  return (
    <PageShell>
      <TableSkeleton />
    </PageShell>
  );
}
