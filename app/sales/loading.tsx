import { PageShell } from "@/components/page-shell";

export default function SalesLoading() {
  return (
    <PageShell>
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="h-8 w-44 animate-pulse rounded-2xl bg-muted" />
          <div className="h-4 w-96 max-w-full animate-pulse rounded-xl bg-muted/80" />
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.12fr_0.88fr]">
          <div className="rounded-[2rem] border border-border/60 bg-card/80 p-6">
            <div className="mb-5 h-16 animate-pulse rounded-[1.5rem] bg-muted/80" />
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="h-24 animate-pulse rounded-[1.5rem] bg-muted/70"
                />
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-border/60 bg-card/80 p-6">
            <div className="space-y-4">
              <div className="h-32 animate-pulse rounded-[1.5rem] bg-muted/80" />
              <div className="h-40 animate-pulse rounded-[1.5rem] bg-muted/70" />
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="h-24 animate-pulse rounded-[1.5rem] bg-muted/70" />
                <div className="h-24 animate-pulse rounded-[1.5rem] bg-muted/70" />
              </div>
              <div className="h-48 animate-pulse rounded-[1.5rem] bg-muted/80" />
              <div className="h-14 animate-pulse rounded-[1.5rem] bg-muted/80" />
              <div className="h-14 animate-pulse rounded-[1.5rem] bg-muted/70" />
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
