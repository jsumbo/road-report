import { Skeleton } from "@/components/ui/skeleton";

export default function ReportDetailLoading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-6">
      {/* Back link */}
      <Skeleton className="mb-6 h-4 w-24" />

      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-3 w-28" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-7 w-20 rounded-full" />
          <Skeleton className="h-7 w-20 rounded-full" />
        </div>
      </div>

      {/* Body */}
      <div className="grid gap-5 md:grid-cols-3">
        {/* Left */}
        <div className="space-y-5 md:col-span-2">
          <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
            <Skeleton className="mb-3 h-3 w-20" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="mt-2 h-3 w-64" />
          </div>
          <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
            <Skeleton className="mb-3 h-3 w-24" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="mt-2 h-3 w-full" />
            <Skeleton className="mt-2 h-3 w-3/4" />
          </div>
          <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
            <Skeleton className="mb-3 h-3 w-20" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="aspect-video w-full rounded-lg" />
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
            <Skeleton className="mb-3 h-3 w-20" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="rounded-xl border border-border bg-white p-5 shadow-sm space-y-3">
            <Skeleton className="h-3 w-28" />
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full rounded-lg" />
            ))}
            <Skeleton className="h-24 w-full rounded-lg" />
            <Skeleton className="h-8 w-full rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
