export const dynamic = "force-dynamic";

import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  Calendar, ClipboardList, MapPin, Star, FileText,
  ShieldCheck, TrendingUp, Wrench, Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { QualityBarChart, type QualityPoint } from "@/components/admin/dashboard-charts";

export const metadata = { title: "Survey Responses" };

const ROAD_USER_LABELS: Record<string, string> = {
  driver: "Driver", pedestrian: "Pedestrian",
  public_transport: "Public Transport", trader: "Trader",
};
const RESPONSE_TIME_LABELS: Record<string, string> = {
  within_1m: "≤ 1 Month", within_3m: "≤ 3 Months", within_6m: "≤ 6 Months",
  over_6m: "> 6 Months", no_response: "No Response",
};
const TRANSPORT_LABELS: Record<string, string> = {
  significantly: "Significantly", somewhat: "Somewhat", no_change: "No Change", worse: "Worse",
};
const ACCESS_LABELS: Record<string, string> = {
  significantly: "Significantly", somewhat: "Somewhat", no_change: "No Change", not_at_all: "Not at All",
};
const HOLDING_UP_LABELS: Record<string, string> = {
  yes: "Yes", somewhat: "Somewhat", no: "No",
};

function RatingBadge({ value }: { value: number | null }) {
  if (!value) return <span className="text-xs text-muted-foreground">—</span>;
  const color =
    value >= 4 ? "bg-green-100 text-green-800"
    : value === 3 ? "bg-yellow-100 text-yellow-800"
    : "bg-red-100 text-red-800";
  return (
    <span className={cn("inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-semibold", color)}>
      <Star className="size-2.5 fill-current" />
      {value}/5
    </span>
  );
}

async function getSurveys() {
  const { data } = await supabase
    .from("citizen_surveys")
    .select("*")
    .order("submitted_at", { ascending: false })
    .limit(200);
  return data ?? [];
}

async function getAverages() {
  const { data } = await supabase
    .from("citizen_surveys")
    .select("nrf_satisfaction, value_for_money, nrf_aware, holding_up, response_time, transport_improvement, access_improvement");

  if (!data || data.length === 0) {
    return {
      total: 0, nrf: null, valueForMoney: null,
      nrfAwarePct: 0, holdingUpPct: 0, quickResponsePct: 0, transportImprovedPct: 0, accessImprovedPct: 0,
    };
  }

  const avg = (arr: (number | null)[]) => {
    const vals = arr.filter((v): v is number => v !== null);
    return vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : null;
  };

  return {
    total:                data.length,
    nrf:                  avg(data.map((r) => r.nrf_satisfaction)),
    valueForMoney:        avg(data.map((r) => r.value_for_money)),
    nrfAwarePct:          Math.round((data.filter((r) => r.nrf_aware).length / data.length) * 100),
    holdingUpPct:         Math.round((data.filter((r) => r.holding_up === "yes").length / data.length) * 100),
    quickResponsePct:     Math.round((data.filter((r) => r.response_time === "within_1m" || r.response_time === "within_3m").length / data.length) * 100),
    transportImprovedPct: Math.round((data.filter((r) => r.transport_improvement === "significantly" || r.transport_improvement === "somewhat").length / data.length) * 100),
    accessImprovedPct:    Math.round((data.filter((r) => r.access_improvement === "significantly" || r.access_improvement === "somewhat").length / data.length) * 100),
  };
}

export default async function SurveysPage() {
  const [surveys, avgs] = await Promise.all([getSurveys(), getAverages()]);

  const distribution = (labels: Record<string, string>, key: "transport_improvement" | "access_improvement"): QualityPoint[] =>
    Object.entries(labels).map(([value, label]) => ({ label, count: surveys.filter((r) => r[key] === value).length }));
  const transportDist = distribution(TRANSPORT_LABELS, "transport_improvement");
  const accessDist    = distribution(ACCESS_LABELS, "access_improvement");

  const kpis = [
    { label: "Responses",             value: String(avgs.total),                                icon: ClipboardList, color: "text-[var(--nrf-blue)]", bg: "bg-[var(--nrf-blue)]/10" },
    { label: "Access Improved",       value: `${avgs.accessImprovedPct}%`,                        icon: Users,         color: "text-amber-600",          bg: "bg-amber-50" },
    { label: "Avg NRF Satisfaction",  value: avgs.nrf           ? `${avgs.nrf}/5`           : "—", icon: ShieldCheck,   color: "text-green-600",          bg: "bg-green-50" },
    { label: "Avg Value for Money",   value: avgs.valueForMoney ? `${avgs.valueForMoney}/5` : "—", icon: Star,          color: "text-purple-600",         bg: "bg-purple-50" },
    { label: "NRF Awareness",         value: `${avgs.nrfAwarePct}%`,                              icon: TrendingUp,    color: "text-purple-600",         bg: "bg-purple-50" },
    { label: "Road Holding Up",       value: `${avgs.holdingUpPct}%`,                             icon: Wrench,        color: "text-orange-600",         bg: "bg-orange-50" },
    { label: "Quick Response (≤3mo)", value: `${avgs.quickResponsePct}%`,                         icon: Wrench,        color: "text-orange-600",         bg: "bg-orange-50" },
    { label: "Transport Improved",    value: `${avgs.transportImprovedPct}%`,                     icon: TrendingUp,    color: "text-red-600",            bg: "bg-red-50" },
  ] as const;

  return (
    <div className="flex flex-col gap-5 p-4 md:gap-6 md:p-8">

      <div>
        <h1 className="font-[family-name:var(--font-heading)] text-xl font-semibold md:text-2xl">
          Survey Responses
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Citizen feedback on how roads affect daily life, access to services, and NRF performance.
        </p>
      </div>

      {/* KPI cards — always visible, show zeros when empty */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {kpis.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="rounded-xl border border-border bg-white p-4 shadow-sm md:p-5">
            <div className={cn("flex size-8 items-center justify-center rounded-lg md:size-9", bg)}>
              <Icon className={cn("size-4", color)} />
            </div>
            <p className={cn("mt-3 text-2xl font-bold tabular-nums md:text-3xl", color)}>{value}</p>
            <p className="mt-1 text-xs font-medium text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* Charts — only when there's data */}
      {surveys.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-border bg-white p-5 shadow-sm md:p-6">
            <p className="mb-1 text-sm font-semibold">Transport &amp; Movement</p>
            <p className="mb-4 text-xs text-muted-foreground">Has the road improved transportation in the area?</p>
            <QualityBarChart data={transportDist} />
          </div>
          <div className="rounded-xl border border-border bg-white p-5 shadow-sm md:p-6">
            <p className="mb-1 text-sm font-semibold">Access to Services</p>
            <p className="mb-4 text-xs text-muted-foreground">Access to markets, schools, hospitals, and businesses</p>
            <QualityBarChart data={accessDist} />
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-border bg-white shadow-sm">
        {surveys.length === 0 ? (
          <div className="py-20 text-center text-sm text-muted-foreground">
            No survey responses yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-xs font-medium text-muted-foreground">
                  <th className="px-4 py-3 text-left">Reference</th>
                  <th className="px-4 py-3 text-left">Location</th>
                  <th className="px-4 py-3 text-left">Access</th>
                  <th className="hidden px-4 py-3 text-left md:table-cell">User Type</th>
                  <th className="hidden px-4 py-3 text-left md:table-cell">Response Time</th>
                  <th className="hidden px-4 py-3 text-left lg:table-cell">NRF Sat.</th>
                  <th className="hidden px-4 py-3 text-left lg:table-cell">Report</th>
                  <th className="hidden px-4 py-3 text-left xl:table-cell">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {surveys.map((s) => (
                  <tr key={s.id} className="hover:bg-muted/20">
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground whitespace-nowrap">
                      {s.reference_number}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="size-3 shrink-0" />
                        <span className="max-w-[130px] truncate">{s.community}, {s.county}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap">{ACCESS_LABELS[s.access_improvement] ?? "—"}</td>
                    <td className="hidden px-4 py-3 md:table-cell">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Users className="size-3 shrink-0" />
                        {ROAD_USER_LABELS[s.road_user_type] ?? s.road_user_type}
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 md:table-cell text-xs text-muted-foreground">
                      {RESPONSE_TIME_LABELS[s.response_time] ?? s.response_time}
                      {s.holding_up ? ` · Holding up: ${HOLDING_UP_LABELS[s.holding_up] ?? s.holding_up}` : ""}
                    </td>
                    <td className="hidden px-4 py-3 lg:table-cell"><RatingBadge value={s.nrf_satisfaction} /></td>
                    <td className="hidden px-4 py-3 lg:table-cell">
                      {s.report_reference ? (
                        <Link
                          href={`/admin/reports/${encodeURIComponent(s.report_reference)}`}
                          className="inline-flex items-center gap-1 text-xs text-[var(--nrf-blue)] hover:underline"
                        >
                          <FileText className="size-3" />
                          {s.report_reference}
                        </Link>
                      ) : (
                        <span className="text-xs text-muted-foreground">Standalone</span>
                      )}
                    </td>
                    <td className="hidden px-4 py-3 xl:table-cell whitespace-nowrap text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="size-3" />
                        {new Date(s.submitted_at).toLocaleDateString("en-LR", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                      </div>
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
