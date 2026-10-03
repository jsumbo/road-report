export const dynamic = "force-dynamic";

import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { RoadReport } from "@/lib/types";
import {
  CONDITION_LABELS, SEVERITY_COLORS, SEVERITY_LABELS,
  STATUS_COLORS, STATUS_LABELS,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  MapPin, Calendar, AlertTriangle, Clock, CheckCircle,
  FileText, ShieldAlert, ArrowRight, ClipboardList, ThumbsUp, TrendingUp,
} from "lucide-react";
import {
  ReportsTimelineChart, StatusDonutChart, CountyBarChart,
  type MonthlyPoint, type StatusPoint, type CountyPoint,
} from "@/components/admin/dashboard-charts";

export const metadata = { title: "Reports Dashboard" };

/* ── Aggregation helpers ── */
function countBy<T extends string>(arr: T[]): Record<string, number> {
  return arr.reduce<Record<string, number>>((acc, v) => {
    acc[v] = (acc[v] ?? 0) + 1;
    return acc;
  }, {});
}

function topN<T extends string>(arr: T[], n: number) {
  return Object.entries(countBy(arr))
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([value, count]) => ({ value: value as T, count }));
}

/* ── Data fetchers ── */
async function getReports(): Promise<RoadReport[]> {
  const { data } = await supabase
    .from("road_reports")
    .select("id, reference_number, title, county, community, condition_type, severity, status, submitted_at")
    .order("submitted_at", { ascending: false })
    .limit(100);
  return (data ?? []) as RoadReport[];
}

async function getStatCounts() {
  const [total, newCount, inProgress, resolved, critical] = await Promise.all([
    supabase.from("road_reports").select("id", { count: "exact", head: true }),
    supabase.from("road_reports").select("id", { count: "exact", head: true }).eq("status", "new"),
    supabase.from("road_reports").select("id", { count: "exact", head: true }).eq("status", "in_progress"),
    supabase.from("road_reports").select("id", { count: "exact", head: true }).eq("status", "resolved"),
    supabase.from("road_reports").select("id", { count: "exact", head: true })
      .eq("severity", "critical").neq("status", "resolved").neq("status", "closed"),
  ]);
  return {
    total: total.count ?? 0,
    new: newCount.count ?? 0,
    inProgress: inProgress.count ?? 0,
    resolved: resolved.count ?? 0,
    critical: critical.count ?? 0,
  };
}

async function getSurveyInsights() {
  const { data } = await supabase
    .from("citizen_surveys")
    .select("access_improvement, nrf_aware, nrf_satisfaction");
  if (!data || data.length === 0) return null;
  const avg = (arr: (number | null)[]) => {
    const vals = arr.filter((v): v is number => v !== null);
    return vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : null;
  };
  const nrfAwarePct = Math.round((data.filter((r) => r.nrf_aware).length / data.length) * 100);
  return {
    total:      data.length,
    accessImprovedPct: Math.round((data.filter((r) => r.access_improvement === "significantly" || r.access_improvement === "somewhat").length / data.length) * 100),
    avgNrf:     avg(data.map((r) => r.nrf_satisfaction)),
    nrfAwarePct,
  };
}

async function getChartData() {
  const { data } = await supabase
    .from("road_reports")
    .select("county, status, submitted_at");

  if (!data || data.length === 0) return null;

  /* Reports per month — last 6 months */
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return { month: d.toLocaleString("en", { month: "short", year: "2-digit" }), count: 0, _y: d.getFullYear(), _m: d.getMonth() };
  });
  for (const r of data) {
    const d = new Date(r.submitted_at);
    const m = months.find(x => x._y === d.getFullYear() && x._m === d.getMonth());
    if (m) m.count++;
  }
  const timeline: MonthlyPoint[] = months.map(({ month, count }) => ({ month, count }));

  /* Status donut */
  const STATUS_HEX: Record<string, string> = {
    new: "#3b82f6", reviewed: "#8b5cf6", in_progress: "#f59e0b",
    resolved: "#22c55e", closed: "#9ca3af",
  };
  const statusCounts = countBy(data.map(r => r.status as string));
  const statusData: StatusPoint[] = Object.entries(statusCounts).map(([k, v]) => ({
    name: STATUS_LABELS[k as keyof typeof STATUS_LABELS] ?? k,
    value: v,
    color: STATUS_HEX[k] ?? "#9ca3af",
  }));

  /* Top counties */
  const countyData: CountyPoint[] = topN(data.map(r => r.county as string), 8)
    .map(({ value, count }) => ({ county: value, count }));

  return { timeline, statusData, countyData };
}

/* ── Page ── */
export default async function AdminDashboardPage() {
  const [reports, counts, charts, survey] = await Promise.all([
    getReports(), getStatCounts(), getChartData(), getSurveyInsights(),
  ]);

  const statCards = [
    { label: "Total Reports",    value: counts.total,      icon: FileText,      color: "text-[var(--nrf-blue)]", bg: "bg-[var(--nrf-blue)]/10" },
    { label: "New / Unreviewed", value: counts.new,        icon: AlertTriangle, color: "text-amber-600",         bg: "bg-amber-50" },
    { label: "In Progress",      value: counts.inProgress, icon: Clock,         color: "text-orange-500",        bg: "bg-orange-50" },
    { label: "Resolved",         value: counts.resolved,   icon: CheckCircle,   color: "text-green-600",         bg: "bg-green-50" },
    { label: "Critical (open)",  value: counts.critical,   icon: ShieldAlert,   color: "text-[var(--nrf-red)]",  bg: "bg-red-50" },
  ];

  return (
    <div className="flex flex-col gap-5 p-4 md:gap-6 md:p-8">

      {/* Page title */}
      <div>
        <h1 className="font-[family-name:var(--font-heading)] text-xl font-semibold md:text-2xl">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Road condition reports across Liberia.</p>
      </div>

      {/* KPI Cards — 2 cols on mobile, 3 on md, 5 on lg */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-5">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="rounded-xl border border-border bg-white p-4 shadow-sm md:p-5">
            <div className={cn("flex size-8 items-center justify-center rounded-lg md:size-9", bg)}>
              <Icon className={cn("size-4", color)} />
            </div>
            <p className={cn("mt-3 text-2xl font-bold tabular-nums md:text-3xl", color)}>{value}</p>
            <p className="mt-1 text-xs font-medium text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* Survey insights row */}
      {survey && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Citizen Survey Insights</p>
            <a href="/admin/surveys" className="flex items-center gap-1 text-xs font-medium text-[var(--nrf-blue)] hover:underline">
              View all <ArrowRight className="size-3" />
            </a>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {[
              { label: "Survey Responses",     value: String(survey.total),                       icon: ClipboardList, color: "text-[var(--nrf-blue)]", bg: "bg-[var(--nrf-blue)]/10", raw: true },
              { label: "Access Improved",      value: `${survey.accessImprovedPct}%`,              icon: TrendingUp,          color: "text-amber-600",          bg: "bg-amber-50",             raw: true },
              { label: "Avg NRF Satisfaction", value: survey.avgNrf  ? `${survey.avgNrf}/5`  : "—", icon: ThumbsUp,      color: "text-green-600",          bg: "bg-green-50",             raw: true },
              { label: "NRF Awareness",        value: `${survey.nrfAwarePct}%`,                    icon: TrendingUp,    color: "text-purple-600",         bg: "bg-purple-50",            raw: true },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="rounded-xl border border-border bg-white p-4 shadow-sm md:p-5">
                <div className={cn("flex size-8 items-center justify-center rounded-lg md:size-9", bg)}>
                  <Icon className={cn("size-4", color)} />
                </div>
                <p className={cn("mt-3 text-2xl font-bold tabular-nums md:text-3xl", color)}>{value}</p>
                <p className="mt-1 text-xs font-medium text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts — stack on mobile, 2-col on md, 3-col on lg */}
      {charts && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-border bg-white p-5 shadow-sm md:p-6 lg:col-span-2">
            <p className="mb-1 text-sm font-semibold">Reports over time</p>
            <p className="mb-4 text-xs text-muted-foreground">Last 6 months</p>
            <ReportsTimelineChart data={charts.timeline} />
          </div>
          <div className="rounded-xl border border-border bg-white p-5 shadow-sm md:p-6">
            <p className="mb-1 text-sm font-semibold">By status</p>
            <p className="mb-4 text-xs text-muted-foreground">All reports</p>
            <StatusDonutChart data={charts.statusData} />
          </div>
        </div>
      )}

      {/* County chart */}
      {charts && charts.countyData.length > 0 && (
        <div className="rounded-xl border border-border bg-white p-5 shadow-sm md:p-6">
          <p className="mb-1 text-sm font-semibold">Reports by county</p>
          <p className="mb-4 text-xs text-muted-foreground">Top {charts.countyData.length} counties</p>
          <CountyBarChart data={charts.countyData} />
        </div>
      )}

      {/* Reports table */}
      <div className="rounded-xl border border-border bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-4 py-4 md:px-5">
          <div>
            <h2 className="text-sm font-semibold">Recent Reports</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Latest {reports.length} submissions</p>
          </div>
          <Link
            href="/admin/reports"
            className="flex items-center gap-1 text-xs font-medium text-[var(--nrf-blue)] hover:underline"
          >
            View all <ArrowRight className="size-3" />
          </Link>
        </div>

        {reports.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">No reports submitted yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-xs font-medium text-muted-foreground">
                  {/* Reference — desktop only */}
                  <th className="hidden px-4 py-3 text-left md:table-cell">Reference</th>
                  {/* Title — always visible */}
                  <th className="px-4 py-3 text-left">Title</th>
                  {/* Location — sm+ */}
                  <th className="hidden px-4 py-3 text-left sm:table-cell">Location</th>
                  {/* Severity — always visible */}
                  <th className="px-4 py-3 text-left">Severity</th>
                  {/* Status — sm+ */}
                  <th className="hidden px-4 py-3 text-left sm:table-cell">Status</th>
                  {/* Submitted — desktop only */}
                  <th className="hidden px-4 py-3 text-left md:table-cell">Submitted</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-muted/20">
                    {/* Reference */}
                    <td className="hidden px-4 py-3 font-mono text-xs text-muted-foreground whitespace-nowrap md:table-cell">
                      {report.reference_number}
                    </td>
                    {/* Title — with location subtitle on mobile */}
                    <td className="max-w-[160px] px-4 py-3 md:max-w-[200px]">
                      <p className="truncate text-xs font-medium text-foreground">
                        {report.title ?? CONDITION_LABELS[report.condition_type]}
                      </p>
                      {/* Show location here on mobile only */}
                      <p className="mt-0.5 truncate text-xs text-muted-foreground sm:hidden">
                        {report.community}, {report.county}
                      </p>
                    </td>
                    {/* Location — sm+ */}
                    <td className="hidden px-4 py-3 sm:table-cell">
                      <div className="flex items-center gap-1.5 whitespace-nowrap text-xs text-muted-foreground">
                        <MapPin className="size-3 shrink-0" />
                        {report.community}, {report.county}
                      </div>
                    </td>
                    {/* Severity */}
                    <td className="px-4 py-3">
                      <span className={cn("rounded px-2 py-0.5 text-xs font-medium", SEVERITY_COLORS[report.severity])}>
                        {SEVERITY_LABELS[report.severity]}
                      </span>
                    </td>
                    {/* Status — sm+ */}
                    <td className="hidden px-4 py-3 sm:table-cell">
                      <span className={cn("rounded px-2 py-0.5 text-xs font-medium", STATUS_COLORS[report.status])}>
                        {STATUS_LABELS[report.status]}
                      </span>
                    </td>
                    {/* Submitted — desktop only */}
                    <td className="hidden px-4 py-3 whitespace-nowrap text-xs text-muted-foreground md:table-cell">
                      <div className="flex items-center gap-1">
                        <Calendar className="size-3" />
                        {new Date(report.submitted_at).toLocaleDateString("en-LR", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                      </div>
                    </td>
                    {/* Review link */}
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
        )}
      </div>
    </div>
  );
}
