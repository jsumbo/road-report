import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-5 p-4 md:gap-6 md:p-8">
      {/* Title */}
      <div className="space-y-2">
        <Skeleton className="h-7 w-36" />
        <Skeleton className="h-4 w-60" />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-white p-4 shadow-sm md:p-5">
            <Skeleton className="size-8 rounded-lg md:size-9" />
            <Skeleton className="mt-3 h-8 w-14" />
            <Skeleton className="mt-1.5 h-3 w-24" />
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-white p-5 shadow-sm lg:col-span-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="mt-1 h-3 w-24" />
          <Skeleton className="mt-4 h-[220px] w-full rounded-lg" />
        </div>
        <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="mt-1 h-3 w-20" />
          <Skeleton className="mt-4 h-[220px] w-full rounded-full" />
        </div>
      </div>

      {/* County chart */}
      <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
        <Skeleton className="h-4 w-44" />
        <Skeleton className="mt-1 h-3 w-28" />
        <Skeleton className="mt-4 h-[200px] w-full rounded-lg" />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-4 py-4 md:px-5">
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-44" />
          </div>
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="divide-y divide-border">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3.5">
              <Skeleton className="hidden h-3 w-28 md:block" />
              <Skeleton className="h-3 w-32 flex-1" />
              <Skeleton className="hidden h-5 w-20 rounded sm:block" />
              <Skeleton className="h-5 w-14 rounded" />
              <Skeleton className="hidden h-5 w-16 rounded sm:block" />
              <Skeleton className="h-6 w-14 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
