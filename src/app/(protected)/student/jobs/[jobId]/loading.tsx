export default function StudentJobDetailLoading() {
  return (
    <main className="min-h-screen bg-background p-4 sm:p-6 md:p-10 animate-pulse">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Back link skeleton */}
        <div className="h-4 w-36 bg-border/60 rounded" />

        {/* Hero Card skeleton */}
        <div className="rounded-xl border border-border/70 bg-surface/80 p-8 space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-border/70" />
            <div className="space-y-2 flex-1">
              <div className="h-4 w-32 bg-border/50 rounded" />
              <div className="h-7 w-80 bg-border/80 rounded" />
              <div className="h-4 w-52 bg-border/40 rounded" />
            </div>
            <div className="h-10 w-32 bg-border/60 rounded-lg hidden sm:block" />
          </div>

          <div className="h-20 w-full bg-border/40 rounded-xl" />
        </div>

        {/* Eligibility card skeleton */}
        <div className="h-32 w-full rounded-xl border border-border/60 bg-surface/60" />

        {/* Description card skeleton */}
        <div className="h-72 w-full rounded-xl border border-border/60 bg-surface/60" />
      </div>
    </main>
  );
}
