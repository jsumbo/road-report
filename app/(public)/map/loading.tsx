import { Skeleton } from "@/components/ui/skeleton";

export default function MapLoading() {
  return (
    <div className="flex flex-1 flex-col">
      {/* Top bar / legend placeholder */}
      <div className="flex items-center gap-3 border-b border-border bg-white px-4 py-3">
        {[60, 70, 80, 65, 75].map((w) => (
          <Skeleton key={w} className="h-5 rounded-full" style={{ width: w }} />
        ))}
      </div>
      {/* Map area */}
      <Skeleton className="flex-1 rounded-none" style={{ minHeight: 400 }} />
    </div>
  );
}
