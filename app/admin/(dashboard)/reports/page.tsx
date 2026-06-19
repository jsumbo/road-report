import { Suspense } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { RoadReport } from "@/lib/types";
import {
  CONDITION_LABELS, SEVERITY_COLORS, SEVERITY_LABELS,
  STATUS_COLORS, STATUS_LABELS,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { MapPin, Calendar, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { ReportsFilters } from "@/components/admin/reports-filters";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = { title: "All Reports" };

const PAGE_SIZE = 25;

interface Filters {
  county?: string;
  type?: string;
  severity?: string;
  status?: string;
  page?: string;
}

async function getFilteredReports(f: Filters) {
  const page = Math.max(1, parseInt(f.page ?? "1", 10));
  const from = (page - 1) * PAGE_SIZE;
  const to   = from + PAGE_SIZE - 1;

  let q = supabase
    .from("road_reports")
    .select(
      "id, reference_number, title, county, community, condition_type, severity, status, submitted_at",
      { count: "exact" },
    )
    .order("submitted_at", { ascending: false })
    .range(from, to);

  if (f.county)   q = q.eq("county", f.county);
  if (f.type)     q = q.eq("condition_type", f.type);
  if (f.severity) q = q.eq("severity", f.severity);
  if (f.status)   q = q.eq("status", f.status);

  const { data, count } = await q;
  return { reports: (data ?? []) as RoadReport[], total: count ?? 0, page };
}

function pageUrl(filters: Filters, page: number) {
  const p = new URLSearchParams();
  if (filters.county)   p.set("county",   filters.county);
  if (filters.type)     p.set("type",     filters.type);
  if (filters.severity) p.set("severity", filters.severity);
  if (filters.status)   p.set("status",   filters.status);
  if (page > 1) p.set("page", String(page));
  const qs = p.toString();
  return `/admin/reports${qs ? `?${qs}` : ""}`;
}

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<Filters>;
}) {
  const filters = await searchParams;
  const { reports, total, page } = await getFilteredReports(filters);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const from = (page - 1) * PAGE_SIZE + 1;
  const to   = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="flex flex-col gap-5 p-4 md:gap-6 md:p-8">

      {/* Header */}
      <div>
        <h1 className="font-[family-name:var(--font-heading)] text-xl font-semibold md:text-2xl">All Reports</h1>
        <p className="mt-1 text-sm text-muted-foreground">Every road-condition submission across Liberia.</p>
      </div>

      {/* Filters — client component needs Suspense for useSearchParams */}
      <Suspense fallback={
        <div className="flex flex-wrap gap-2">
          {[120, 110, 100, 95].map((w) => (
            <Skeleton key={w} className="h-9" style={{ width: w }} />
          ))}
        </div>
      }>
        <ReportsFilters total={total} />
      </Suspense>

      {/* Table */}
      <div className="rounded-xl border border-border bg-white shadow-sm">
        {reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
            <FileText className="size-10 text-muted-foreground/30" />
            <p className="font-medium text-muted-foreground">No reports match your filters.</p>
          </div>
        ) : (
          <>
            {/* Card list — mobile and tablet (below lg) */}
            <div className="divide-y divide-border lg:hidden">
              {reports.map((report) => (
                <div key={report.id} className="flex items-start gap-3 px-4 py-3.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {report.title ?? CONDITION_LABELS[report.condition_type]}
                    </p>
                    <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="size-3 shrink-0" />
                      <span className="truncate">{report.community}, {report.county}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <span className={cn("rounded px-2 py-0.5 text-xs font-medium", SEVERITY_COLORS[report.severity])}>
                        {SEVERITY_LABELS[report.severity]}
                      </span>
                      <span className={cn("rounded px-2 py-0.5 text-xs font-medium", STATUS_COLORS[report.status])}>
                        {STATUS_LABELS[report.status]}
                      </span>
                    </div>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {CONDITION_LABELS[report.condition_type]}
                    </p>
                  </div>
                  <Link
                    href={`/admin/reports/${report.reference_number}`}
                    className="shrink-0 whitespace-nowrap rounded px-2 py-1 text-xs font-medium text-[var(--nrf-blue)] hover:bg-[var(--nrf-blue)]/10"
                  >
                    Review →
                  </Link>
                </div>
              ))}
            </div>

            {/* Table — desktop only (lg+, where content area is ~720px+) */}
            <div className="hidden lg:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30 text-xs font-medium text-muted-foreground">
                    <th className="px-4 py-3 text-left">Title</th>
                    <th className="px-4 py-3 text-left">Condition</th>
                    <th className="px-4 py-3 text-left">Location</th>
                    <th className="px-4 py-3 text-left">Severity</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="hidden px-4 py-3 text-left xl:table-cell">Submitted</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {reports.map((report) => (
                    <tr key={report.id} className="hover:bg-muted/20">
                      <td className="w-[25%] px-4 py-3">
                        <p className="truncate text-xs font-medium text-foreground">
                          {report.title ?? CONDITION_LABELS[report.condition_type]}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {CONDITION_LABELS[report.condition_type]}
                      </td>
                      <td className="w-[25%] px-4 py-3">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <MapPin className="size-3 shrink-0" />
                          <span className="truncate">{report.community}, {report.county}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("rounded px-2 py-0.5 text-xs font-medium whitespace-nowrap", SEVERITY_COLORS[report.severity])}>
                          {SEVERITY_LABELS[report.severity]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("rounded px-2 py-0.5 text-xs font-medium whitespace-nowrap", STATUS_COLORS[report.status])}>
                          {STATUS_LABELS[report.status]}
                        </span>
                      </td>
                      <td className="hidden px-4 py-3 whitespace-nowrap text-xs text-muted-foreground xl:table-cell">
                        <div className="flex items-center gap-1">
                          <Calendar className="size-3" />
                          {new Date(report.submitted_at).toLocaleDateString("en-LR", {
                            day: "numeric", month: "short", year: "numeric",
                          })}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/reports/${report.reference_number}`}
                          className="whitespace-nowrap rounded px-2 py-1 text-xs font-medium text-[var(--nrf-blue)] hover:bg-[var(--nrf-blue)]/10"
                        >
                          Review →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Pagination */}
        {total > PAGE_SIZE && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <p className="text-xs text-muted-foreground">
              Showing {from}–{to} of {total.toLocaleString()}
            </p>
            <div className="flex items-center gap-1">
              <Link
                href={pageUrl(filters, page - 1)}
                aria-disabled={page <= 1}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg border border-border text-xs",
                  page <= 1
                    ? "pointer-events-none opacity-40"
                    : "hover:bg-muted",
                )}
              >
                <ChevronLeft className="size-4" />
              </Link>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const pg = totalPages <= 5 ? i + 1 : page <= 3 ? i + 1 : page + i - 2;
                if (pg < 1 || pg > totalPages) return null;
                return (
                  <Link
                    key={pg}
                    href={pageUrl(filters, pg)}
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg border text-xs font-medium",
                      pg === page
                        ? "border-[var(--nrf-blue)] bg-[var(--nrf-blue)] text-white"
                        : "border-border hover:bg-muted",
                    )}
                  >
                    {pg}
                  </Link>
                );
              })}
              <Link
                href={pageUrl(filters, page + 1)}
                aria-disabled={page >= totalPages}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg border border-border text-xs",
                  page >= totalPages
                    ? "pointer-events-none opacity-40"
                    : "hover:bg-muted",
                )}
              >
                <ChevronRight className="size-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
