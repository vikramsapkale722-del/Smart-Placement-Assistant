export default function StudentJobsLoading() {
  return (
    <main className="min-h-screen bg-background p-4 sm:p-6 md:p-10 space-y-8 animate-pulse">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Breadcrumb skeleton */}
        <div className="h-4 w-32 bg-border/60 rounded" />

        {/* Title skeleton */}
        <div className="space-y-2 pb-4 border-b border-border/60">
          <div className="h-8 w-72 bg-border/80 rounded" />
          <div className="h-4 w-96 bg-border/50 rounded" />
        </div>

        {/* Search bar & filter bar skeleton */}
        <div className="h-10 w-full bg-border/50 rounded-lg" />
        <div className="h-28 w-full bg-border/40 rounded-xl" />

        {/* Grid of job card skeletons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-64 rounded-xl border border-border/60 bg-surface/60 p-5 space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-border/70" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3 w-24 bg-border/60 rounded" />
                  <div className="h-4 w-40 bg-border/80 rounded" />
                </div>
              </div>
              <div className="h-8 w-full bg-border/40 rounded" />
              <div className="h-16 w-full bg-border/30 rounded" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
