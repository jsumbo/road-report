import Image from "next/image";
import Link from "next/link";
import { MapPin, Building2, ArrowRight } from "lucide-react";
import type { RoadReport } from "@/lib/types";
import { CONDITION_LABELS, SEVERITY_COLORS, SEVERITY_LABELS } from "@/lib/types";
import { cn } from "@/lib/utils";

const PLACEHOLDER_COLORS: Record<string, string> = {
  pothole:           "bg-slate-800",
  flooding:          "bg-blue-800",
  bridge_damage:     "bg-stone-700",
  road_erosion:      "bg-amber-800",
  missing_guardrail: "bg-orange-700",
  landslide:         "bg-red-800",
  damaged_culvert:   "bg-zinc-700",
  other:             "bg-gray-700",
};

export interface ReportCardData extends Pick<RoadReport,
  "id" | "reference_number" | "title" | "county" | "community" |
  "condition_type" | "severity" | "description" | "submitted_at"
> {
  coverPhotoUrl?: string | null;
}

export function RecentReportCard({ report }: { report: ReportCardData }) {
  const bgColor = PLACEHOLDER_COLORS[report.condition_type] ?? "bg-gray-700";
  const conditionLabel = CONDITION_LABELS[report.condition_type];
  const displayTitle = report.title ?? conditionLabel;

  const truncatedDesc = report.description.length > 110
    ? report.description.slice(0, 110).trimEnd() + "…"
    : report.description;

  return (
    <Link href={`/reports/${report.reference_number}`} className="group flex flex-col overflow-hidden rounded-lg border border-border bg-white shadow-sm transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      {/* Cover image */}
      <div className="relative h-44 w-full shrink-0 overflow-hidden">
        {report.coverPhotoUrl ? (
          <Image
            src={report.coverPhotoUrl}
            alt={displayTitle}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
          />
        ) : (
          <div className={cn("flex h-full w-full items-end p-4", bgColor)}>
            <span className="text-xs font-medium text-white/50">{conditionLabel}</span>
          </div>
        )}
        <div className="absolute left-3 top-3">
          <span className={cn(
            "inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold shadow",
            SEVERITY_COLORS[report.severity],
          )}>
            {SEVERITY_LABELS[report.severity]}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-5">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
          {displayTitle}
        </h3>

        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          {truncatedDesc}
        </p>

        <div className="mt-auto pt-4">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Building2 className="size-3.5 shrink-0 text-[var(--nrf-blue)]" />
            <span className="font-medium text-foreground/80">{report.county}</span>
            <span className="mx-1 text-border">·</span>
            <MapPin className="size-3.5 shrink-0 text-[var(--nrf-blue)]" />
            <span>{report.community}</span>
          </div>
          <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-[var(--nrf-blue)] group-hover:underline">
            View details <ArrowRight className="size-3" />
          </div>
        </div>
      </div>
    </Link>
  );
}
