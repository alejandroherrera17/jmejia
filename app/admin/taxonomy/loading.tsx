import { PageShell } from "@/components/page-shell";
import { TableSkeleton } from "@/components/skeletons/table-skeleton";

export default function TaxonomyLoading() {
  return (
    <PageShell>
      <TableSkeleton />
    </PageShell>
  );
}
