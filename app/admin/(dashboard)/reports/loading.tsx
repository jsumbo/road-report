import { Skeleton } from "@/components/ui/skeleton";

export default function ReportsLoading() {
  return (
    <div className="flex flex-col gap-5 p-4 md:gap-6 md:p-8">
      {/* Title */}
      <div className="space-y-2">
        <Skeleton className="h-7 w-36" />
        <Skeleton className="h-4 w-56" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {[120, 110, 105, 100].map((w) => (
          <Skeleton key={w} className="h-9 rounded-lg" style={{ width: w }} />
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-white shadow-sm">
        <div className="divide-y divide-border">
          {/* Header */}
          <div className="flex gap-4 bg-muted/30 px-4 py-3">
            {[80, 160, 120, 70, 70, 80].map((w, i) => (
              <Skeleton key={i} className="h-3 rounded" style={{ width: w }} />
            ))}
          </div>
          {/* Rows */}
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3.5">
              <Skeleton className="hidden h-3 w-28 md:block" />
              <Skeleton className="h-3 w-36 flex-1" />
              <Skeleton className="hidden h-3 w-28 sm:block" />
              <Skeleton className="h-5 w-14 rounded" />
              <Skeleton className="hidden h-5 w-16 rounded sm:block" />
              <Skeleton className="hidden h-3 w-20 md:block" />
              <Skeleton className="h-6 w-14 rounded" />
            </div>
          ))}
        </div>
        {/* Pagination placeholder */}
        <div className="flex items-center justify-between border-t border-border px-4 py-3">
          <Skeleton className="h-3 w-36" />
          <div className="flex gap-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-8 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
