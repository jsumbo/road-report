import { Skeleton } from "@/components/ui/skeleton";

export default function ReportDetailLoading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-6">
      {/* Back link */}
      <Skeleton className="mb-6 h-4 w-32" />

      {/* Badges */}
      <div className="mb-3 flex gap-2">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>

      {/* Title */}
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="mt-2 h-4 w-1/2" />

      {/* Meta row */}
      <div className="mt-4 flex flex-wrap gap-4">
        {[80, 100, 90, 80].map((w, i) => (
          <Skeleton key={i} className="h-3" style={{ width: w }} />
        ))}
      </div>

      {/* Photos */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="aspect-video w-full rounded-xl" />
        ))}
      </div>

      {/* Description */}
      <div className="mt-6 space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>

      {/* Info card */}
      <div className="mt-6 rounded-xl border border-border bg-white p-5 shadow-sm space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-28" />
          </div>
        ))}
      </div>
    </div>
  );
}
