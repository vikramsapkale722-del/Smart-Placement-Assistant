export default function StudentApplicationsLoading() {
  return (
    <main className="min-h-screen bg-background p-4 sm:p-6 md:p-10 space-y-6 animate-pulse">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-60 bg-border/80 rounded-lg" />
              <div className="h-5 w-16 bg-border/50 rounded-full" />
            </div>
            <div className="h-4 w-80 bg-border/40 rounded" />
          </div>
          <div className="h-9 w-32 bg-border/60 rounded-lg" />
        </div>

        {/* Filter bar Skeleton */}
        <div className="h-14 w-full bg-surface border border-border/60 rounded-xl p-3 flex items-center justify-between">
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-8 w-24 bg-border/50 rounded-lg" />
            ))}
          </div>
          <div className="h-8 w-32 bg-border/40 rounded-lg" />
        </div>

        {/* Application Cards Skeleton */}
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-border/60 bg-surface/70 p-6 space-y-5"
            >
              {/* Top row */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-border/70" />
                  <div className="space-y-2">
                    <div className="h-3 w-28 bg-border/60 rounded" />
                    <div className="h-5 w-48 bg-border/80 rounded" />
                    <div className="h-3 w-36 bg-border/40 rounded" />
                  </div>
                </div>
                <div className="space-y-1.5 flex flex-col items-end">
                  <div className="h-6 w-20 bg-border/70 rounded-full" />
                  <div className="h-3 w-24 bg-border/40 rounded" />
                </div>
              </div>

              {/* Timeline skeleton */}
              <div className="h-20 w-full bg-border/30 rounded-xl" />

              {/* Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-border/40">
                <div className="h-3 w-32 bg-border/40 rounded" />
                <div className="h-8 w-36 bg-border/60 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
