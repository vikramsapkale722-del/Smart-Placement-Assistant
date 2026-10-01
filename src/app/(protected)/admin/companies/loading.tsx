import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';

export default function AdminCompaniesLoading() {
  return (
    <main className="min-h-screen bg-background p-4 sm:p-6 md:p-10" aria-busy="true">
      <div className="w-full max-w-6xl mx-auto space-y-6 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
          <div className="space-y-2">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-8 w-72" />
            <Skeleton className="h-4 w-96 max-w-full" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-6 w-28 rounded-full" />
            <Skeleton className="h-6 w-28 rounded-full" />
          </div>
        </div>

        {/* Filter controls skeleton */}
        <div className="flex justify-between items-center gap-4">
          <Skeleton className="h-10 w-80 rounded-xl" />
          <Skeleton className="h-10 w-72 rounded-lg" />
        </div>

        {/* Card list skeleton */}
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-border">
              <CardContent className="p-5 sm:p-6 flex flex-col md:flex-row justify-between items-center gap-5">
                <div className="flex items-center gap-4 flex-1 w-full">
                  <Skeleton className="w-14 h-14 rounded-xl flex-shrink-0" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-64 max-w-full" />
                  </div>
                </div>
                <Skeleton className="h-9 w-36 rounded-md" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}
