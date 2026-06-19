export const dynamic = "force-dynamic";

import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  Calendar, ClipboardList, MapPin, Star, FileText,
  ShieldCheck, TrendingUp, Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const metadata = { title: "Survey Responses" };

const MAINT_LABELS: Record<string, string> = {
  yes: "Yes", no: "No", unsure: "Not sure",
};
const COST_LABELS: Record<string, string> = {
  increased: "↑ Increased", same: "→ Same", decreased: "↓ Decreased",
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
    .select("road_rating, safety_rating, maint_satisfaction, nrf_satisfaction, nrf_aware, maintenance_done, transport_cost");

  if (!data || data.length === 0) {
    return { total: 0, road: null, safety: null, maint: null, nrf: null, nrfAwarePct: 0, maintDonePct: 0, costIncrPct: 0 };
  }

  const avg = (arr: (number | null)[]) => {
    const vals = arr.filter((v): v is number => v !== null);
    return vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : null;
  };

  return {
    total:        data.length,
    road:         avg(data.map((r) => r.road_rating)),
    safety:       avg(data.map((r) => r.safety_rating)),
    maint:        avg(data.map((r) => r.maint_satisfaction)),
    nrf:          avg(data.map((r) => r.nrf_satisfaction)),
    nrfAwarePct:  Math.round((data.filter((r) => r.nrf_aware).length / data.length) * 100),
    maintDonePct: Math.round((data.filter((r) => r.maintenance_done === "yes").length / data.length) * 100),
    costIncrPct:  Math.round((data.filter((r) => r.transport_cost === "increased").length / data.length) * 100),
  };
}

export default async function SurveysPage() {
  const [surveys, avgs] = await Promise.all([getSurveys(), getAverages()]);

  const kpis = [
    { label: "Responses",            value: String(avgs.total),                     icon: ClipboardList, color: "text-[var(--nrf-blue)]", bg: "bg-[var(--nrf-blue)]/10" },
    { label: "Avg Road Rating",      value: avgs.road   ? `${avgs.road}/5`   : "—", icon: Star,          color: "text-amber-600",          bg: "bg-amber-50" },
    { label: "Avg Safety Rating",    value: avgs.safety ? `${avgs.safety}/5` : "—", icon: ShieldCheck,   color: "text-green-600",          bg: "bg-green-50" },
    { label: "NRF Awareness",        value: `${avgs.nrfAwarePct}%`,                 icon: TrendingUp,    color: "text-purple-600",         bg: "bg-purple-50" },
    { label: "Avg NRF Satisfaction", value: avgs.nrf    ? `${avgs.nrf}/5`    : "—", icon: Star,          color: "text-purple-600",         bg: "bg-purple-50" },
    { label: "Maintenance Done",     value: `${avgs.maintDonePct}%`,                icon: Wrench,        color: "text-orange-600",         bg: "bg-orange-50" },
    { label: "Avg Maint. Sat.",      value: avgs.maint  ? `${avgs.maint}/5`  : "—", icon: Wrench,        color: "text-orange-600",         bg: "bg-orange-50" },
    { label: "Transport Cost Up",    value: `${avgs.costIncrPct}%`,                 icon: TrendingUp,    color: "text-red-600",            bg: "bg-red-50" },
  ] as const;

  return (
    <div className="flex flex-col gap-5 p-4 md:gap-6 md:p-8">

      <div>
        <h1 className="font-[family-name:var(--font-heading)] text-xl font-semibold md:text-2xl">
          Survey Responses
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Citizen feedback on road conditions, maintenance, and NRF performance.
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
                  <th className="px-4 py-3 text-left">Road</th>
                  <th className="px-4 py-3 text-left">Safety</th>
                  <th className="hidden px-4 py-3 text-left md:table-cell">Maintenance</th>
                  <th className="hidden px-4 py-3 text-left lg:table-cell">Transport</th>
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
                    <td className="px-4 py-3"><RatingBadge value={s.road_rating} /></td>
                    <td className="px-4 py-3"><RatingBadge value={s.safety_rating} /></td>
                    <td className="hidden px-4 py-3 md:table-cell">
                      <span className="text-xs text-muted-foreground">
                        {MAINT_LABELS[s.maintenance_done] ?? s.maintenance_done}
                        {s.maint_satisfaction ? ` · ${s.maint_satisfaction}/5` : ""}
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 lg:table-cell text-xs text-muted-foreground">
                      {COST_LABELS[s.transport_cost] ?? s.transport_cost}
                    </td>
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
                        <span className="text-xs text-muted-foreground">—</span>
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
