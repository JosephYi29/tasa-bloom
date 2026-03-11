import { Skeleton } from "@/components/ui/skeleton";


export default function CandidatesLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <Skeleton className="h-8 w-40 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-9 w-28 rounded-md" />
          <Skeleton className="h-9 w-24 rounded-md" />
          <Skeleton className="h-9 w-24 rounded-md" />
          <Skeleton className="h-9 w-28 rounded-md" />
        </div>
      </div>

      <div className="rounded-lg border border-border overflow-hidden bg-card">
        <div className="w-full text-sm">
          <div className="border-b border-border bg-muted/50 p-4 flex gap-4">
            <Skeleton className="h-4 w-6" />
            <Skeleton className="h-4 w-6" />
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-24 ml-auto" />
          </div>
          
          <div className="bg-card">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 border-b last:border-0 hover:bg-muted/30">
                <Skeleton className="h-4 w-6 text-muted-foreground/30" />
                <Skeleton className="h-4 w-6" />
                <Skeleton className="h-4 w-8" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-16" />
                <div className="flex gap-3 ml-auto">
                  <Skeleton className="h-4 w-10" />
                  <Skeleton className="h-4 w-10" />
                  <Skeleton className="h-4 w-12" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-muted/30 p-2 border-t flex justify-center">
          <Skeleton className="h-3 w-3/4" />
        </div>
      </div>
    </div>
  );
}
