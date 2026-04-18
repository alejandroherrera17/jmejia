import { TaxonomyManager } from "@/components/admin/taxonomy-manager";
import { PageShell } from "@/components/page-shell";
import { PageTransition } from "@/components/page-transition";
import { requireRole } from "@/lib/permissions";
import { getTaxonomyOverview } from "@/services/taxonomy-service";

export default async function TaxonomyPage() {
  await requireRole(["ADMIN"]);
  const categories = await getTaxonomyOverview();

  return (
    <PageShell>
      <PageTransition>
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold">Categorias y Subcategorias</h1>
            <p className="text-sm text-muted-foreground">
              CRUD administrativo para mantener la jerarquia del catalogo sin desbordes ni friccion.
            </p>
          </div>
          <TaxonomyManager categories={categories} />
        </div>
      </PageTransition>
    </PageShell>
  );
}
