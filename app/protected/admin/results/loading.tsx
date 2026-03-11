import { Skeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";

export default function ResultsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
      </div>

      <div className="space-y-4">
        {/* Actions bar mock */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-36 rounded-md" />
            <Skeleton className="h-10 w-32 rounded-md" />
          </div>
        </div>

        {/* Table Mock */}
        <div className="rounded-md border bg-card overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-4 bg-muted/50 p-4 border-b">
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-4 w-32 flex-1" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-24" />
          </div>
          
          {/* Rows */}
          {Array.from({ length: 15 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 border-b last:border-0 hover:bg-muted/30">
              <Skeleton className="h-4 w-8" />
              <div className="flex flex-col gap-1 flex-1">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-4 w-16 ml-auto" />
              <Skeleton className="h-4 w-16 ml-auto" />
              <Skeleton className="h-4 w-16 ml-auto" />
              <Skeleton className="h-4 w-20 ml-auto" />
              <Skeleton className="h-4 w-16 ml-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
