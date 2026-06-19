export const dynamic = "force-dynamic";

import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft, MapPin, Building2, Calendar, AlertTriangle,
  CheckCircle, Clock, Eye, Wrench, XCircle,
  CircleDot, Waves, Milestone, Mountain, ShieldOff, HelpCircle,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  CONDITION_LABELS, SEVERITY_LABELS, STATUS_LABELS,
  SEVERITY_COLORS, STATUS_COLORS,
  type ConditionType, type ReportStatus, type ReportSeverity,
} from "@/lib/types";
import { cn } from "@/lib/utils";


/* ── Icon maps ── */
const CONDITION_ICONS: Record<ConditionType, React.ElementType> = {
  pothole:           CircleDot,
  flooding:          Waves,
  bridge_damage:     Milestone,
  road_erosion:      Mountain,
  missing_guardrail: ShieldOff,
  landslide:         AlertTriangle,
  damaged_culvert:   Wrench,
  other:             HelpCircle,
};

const STATUS_ICONS: Record<ReportStatus, React.ElementType> = {
  new:         Clock,
  reviewed:    Eye,
  in_progress: Wrench,
  resolved:    CheckCircle,
  closed:      XCircle,
};

const SEVERITY_DOT: Record<ReportSeverity, string> = {
  low:      "bg-green-500",
  medium:   "bg-amber-500",
  high:     "bg-orange-500",
  critical: "bg-red-600",
};

const CONDITION_BG: Record<ConditionType, string> = {
  pothole:           "bg-slate-800",
  flooding:          "bg-blue-800",
  bridge_damage:     "bg-stone-700",
  road_erosion:      "bg-amber-800",
  missing_guardrail: "bg-orange-700",
  landslide:         "bg-red-800",
  damaged_culvert:   "bg-zinc-700",
  other:             "bg-gray-700",
};

async function getReport(slug: string) {
  const { data } = await supabase
    .from("road_reports")
    .select("*, road_report_photos(*)")
    .eq("reference_number", slug)
    .single();
  return data;
}

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: slug } = await params;
  const report = await getReport(slug);
  if (!report) notFound();

  const photos: { public_url: string }[] = report.road_report_photos ?? [];
  const conditionType = report.condition_type as ConditionType;
  const severity = report.severity as ReportSeverity;
  const status = report.status as ReportStatus;

  const ConditionIcon = CONDITION_ICONS[conditionType] ?? HelpCircle;
  const StatusIcon = STATUS_ICONS[status] ?? Clock;

  const displayTitle =
    report.title ?? CONDITION_LABELS[conditionType];

  const submitted = new Date(report.submitted_at).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const heroPhoto = photos[0];

  return (
    <div className="-mt-20 min-h-screen bg-[var(--nrf-off-white)]">
      {/* ── Hero — image extends behind navbar ── */}
      <div className="relative h-80 w-full overflow-hidden bg-[var(--nrf-ink)] md:h-[26rem]">
        {heroPhoto ? (
          <Image
            src={heroPhoto.public_url}
            alt={displayTitle}
            fill
            priority
            className="object-cover opacity-80"
            sizes="100vw"
          />
        ) : (
          <div className={cn("h-full w-full", CONDITION_BG[conditionType])} />
        )}
        {/* Top scrim — keeps back link readable over image */}
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--nrf-ink)]/60 via-transparent to-transparent" />
        {/* Bottom scrim — darkens behind title/badges */}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--nrf-ink)]/80 via-transparent to-transparent" />

        {/* Back nav — overlaid on image */}
        <div className="absolute left-0 right-0 top-0 px-4 pt-24 md:px-8">
          <div className="mx-auto max-w-5xl">
            <Link
              href="/reports"
              className="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white"
            >
              <ArrowLeft className="size-4" />
              All reports
            </Link>
          </div>
        </div>

        {/* Hero text */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-6 md:px-8">
          <div className="mx-auto max-w-5xl">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-semibold shadow",
                  SEVERITY_COLORS[severity],
                )}
              >
                <span className={cn("size-1.5 rounded-full", SEVERITY_DOT[severity])} />
                {SEVERITY_LABELS[severity]} severity
              </span>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-semibold shadow",
                  STATUS_COLORS[status],
                )}
              >
                <StatusIcon className="size-3" />
                {STATUS_LABELS[status]}
              </span>
            </div>
            <h1 className="font-[family-name:var(--font-heading)] text-2xl font-semibold leading-snug text-white md:text-3xl">
              {displayTitle}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-white/70">
              <span className="flex items-center gap-1.5">
                <Building2 className="size-4" />
                {report.county} County
              </span>
              <span className="text-white/30">·</span>
              <span className="flex items-center gap-1.5">
                <MapPin className="size-4" />
                {report.community}
              </span>
              <span className="text-white/30">·</span>
              <span className="flex items-center gap-1.5">
                <Calendar className="size-4" />
                {submitted}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="px-4 py-8 md:px-8 md:py-10">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-6 lg:grid-cols-3">

            {/* Left column */}
            <div className="space-y-6 lg:col-span-2">

              {/* Photos */}
              {photos.length > 0 && (
                <div className="overflow-hidden rounded-lg border border-border bg-white">
                  <div
                    className={cn(
                      "grid gap-0.5",
                      photos.length === 1
                        ? "grid-cols-1"
                        : photos.length === 2
                        ? "grid-cols-2"
                        : "grid-cols-2 sm:grid-cols-3",
                    )}
                  >
                    {photos.map((photo, i) => (
                      <div
                        key={i}
                        className={cn(
                          "relative overflow-hidden",
                          photos.length === 1 ? "aspect-[16/9]" : "aspect-square",
                        )}
                      >
                        <Image
                          src={photo.public_url}
                          alt={`Photo ${i + 1}`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 100vw, 50vw"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="rounded-lg border border-border bg-white p-6">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <AlertTriangle className="size-4 text-[var(--nrf-blue)]" />
                  What was reported
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {report.description}
                </p>
              </div>
            </div>

            {/* Right sidebar */}
            <div className="space-y-4">

              {/* Condition details card */}
              <div className="rounded-lg border border-border bg-white p-5">
                <h2 className="mb-4 text-sm font-semibold text-foreground">Report details</h2>
                <ul className="space-y-4">

                  <li className="flex items-start gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-[var(--nrf-blue)]/10">
                      <ConditionIcon className="size-4 text-[var(--nrf-blue)]" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Condition type</p>
                      <p className="text-sm font-medium text-foreground">
                        {CONDITION_LABELS[conditionType]}
                      </p>
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-[var(--nrf-blue)]/10">
                      <AlertTriangle className="size-4 text-[var(--nrf-blue)]" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Severity</p>
                      <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                        <span className={cn("size-2 rounded-full", SEVERITY_DOT[severity])} />
                        {SEVERITY_LABELS[severity]}
                      </p>
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-[var(--nrf-blue)]/10">
                      <StatusIcon className="size-4 text-[var(--nrf-blue)]" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Status</p>
                      <p className="text-sm font-medium text-foreground">
                        {STATUS_LABELS[status]}
                      </p>
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-[var(--nrf-blue)]/10">
                      <Building2 className="size-4 text-[var(--nrf-blue)]" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Location</p>
                      <p className="text-sm font-medium text-foreground">
                        {report.community}
                      </p>
                      <p className="text-xs text-muted-foreground">{report.county} County</p>
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-[var(--nrf-blue)]/10">
                      <Calendar className="size-4 text-[var(--nrf-blue)]" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Submitted</p>
                      <p className="text-sm font-medium text-foreground">{submitted}</p>
                    </div>
                  </li>

                  {report.latitude && report.longitude && (
                    <li className="flex items-start gap-3">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-[var(--nrf-blue)]/10">
                        <MapPin className="size-4 text-[var(--nrf-blue)]" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">GPS coordinates</p>
                        <p className="font-mono text-xs text-muted-foreground">
                          {report.latitude.toFixed(5)}, {report.longitude.toFixed(5)}
                        </p>
                        <a
                          href={`https://maps.google.com/?q=${report.latitude},${report.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-0.5 text-xs text-[var(--nrf-blue)] hover:underline"
                        >
                          Open in Google Maps ↗
                        </a>
                      </div>
                    </li>
                  )}
                </ul>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
