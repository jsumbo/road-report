export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, Calendar, Globe, Star, ClipboardList, CheckCircle, XCircle, AlertCircle, TrendingUp, Minus, TrendingDown } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { RoadReport } from "@/lib/types";
import { CONDITION_LABELS, SEVERITY_COLORS, SEVERITY_LABELS, STATUS_COLORS, STATUS_LABELS } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ReportStatusEditor } from "@/components/admin/report-status-editor";
import { ReportNotes, type ReportNote } from "@/components/admin/report-notes";

async function getReport(reference: string): Promise<RoadReport | null> {
  const { data } = await supabase
    .from("road_reports")
    .select("*, photos:road_report_photos(*)")
    .eq("reference_number", reference)
    .single();
  return data as RoadReport | null;
}

async function getSurvey(reportRef: string) {
  const { data } = await supabase
    .from("citizen_surveys")
    .select("*")
    .eq("report_reference", reportRef)
    .maybeSingle();
  return data ?? null;
}

async function getNotes(reportId: number): Promise<ReportNote[]> {
  const { data } = await supabase
    .from("road_report_notes")
    .select("id, admin_email, admin_name, body, created_at")
    .eq("report_id", reportId)
    .order("created_at", { ascending: true });
  return (data ?? []) as ReportNote[];
}

export default async function ReportDetailPage({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params;

  const report = await getReport(decodeURIComponent(reference));
  if (!report) notFound();

  const [notes, citizenSurvey] = await Promise.all([
    getNotes(report.id),
    getSurvey(report.reference_number),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-6">
      <Link
        href="/admin/reports"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        All Reports
      </Link>

      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-heading)] text-2xl font-semibold">
            {report.title ?? CONDITION_LABELS[report.condition_type]}
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">{CONDITION_LABELS[report.condition_type]}</p>
          <p className="mt-1 font-mono text-sm text-muted-foreground">{report.reference_number}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn("rounded-full px-3 py-1 text-sm font-medium", SEVERITY_COLORS[report.severity])}>
            {SEVERITY_LABELS[report.severity]}
          </span>
          <span className={cn("rounded-full px-3 py-1 text-sm font-medium", STATUS_COLORS[report.status])}>
            {STATUS_LABELS[report.status]}
          </span>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {/* Main details */}
        <div className="space-y-5 md:col-span-2">
          {/* Location */}
          <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Location</h2>
            <div className="mt-3 flex items-center gap-2 text-sm">
              <MapPin className="size-4 shrink-0 text-[var(--nrf-blue)]" />
              <span>{report.community}, {report.county}</span>
            </div>
            {report.latitude !== null && (
              <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <Globe className="size-3.5" />
                <span>
                  {report.latitude.toFixed(6)}, {report.longitude?.toFixed(6)}
                </span>
                <a
                  href={`https://www.openstreetmap.org/?mlat=${report.latitude}&mlon=${report.longitude}&zoom=16`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--nrf-blue)] underline hover:no-underline"
                >
                  View on map ↗
                </a>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Description</h2>
            <p className="mt-3 text-sm leading-relaxed">{report.description}</p>
          </div>

          {/* Photos */}
          {report.photos && report.photos.length > 0 && (
            <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Photos ({report.photos.length})
              </h2>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {report.photos.map((photo) => (
                  <a key={photo.id} href={photo.public_url} target="_blank" rel="noopener noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.public_url}
                      alt="Road condition photo"
                      className="aspect-video w-full rounded-lg object-cover transition-opacity hover:opacity-80"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Citizen Survey */}
          {citizenSurvey ? (
            <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <ClipboardList className="size-4 text-[var(--nrf-blue)]" />
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Citizen Survey</h2>
                <span className="ml-auto font-mono text-[10px] text-muted-foreground">{citizenSurvey.reference_number}</span>
              </div>

              {/* Ratings */}
              <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: "Road condition", value: citizenSurvey.road_rating },
                  { label: "Safety",         value: citizenSurvey.safety_rating },
                  { label: "Maint. sat.",    value: citizenSurvey.maint_satisfaction },
                  { label: "NRF sat.",       value: citizenSurvey.nrf_satisfaction },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-lg border border-border px-3 py-2 text-center">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    {value ? (
                      <div className="mt-1 flex items-center justify-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={cn("size-3", i < value ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30")} />
                        ))}
                      </div>
                    ) : (
                      <p className="mt-1 text-xs text-muted-foreground">—</p>
                    )}
                  </div>
                ))}
              </div>

              <dl className="space-y-2 text-sm">
                {citizenSurvey.road_problems?.length > 0 && (
                  <div className="flex gap-2">
                    <dt className="w-32 shrink-0 text-xs text-muted-foreground">Problems</dt>
                    <dd className="text-xs">{citizenSurvey.road_problems.join(", ")}</dd>
                  </div>
                )}
                <div className="flex gap-2">
                  <dt className="w-32 shrink-0 text-xs text-muted-foreground">Maintenance</dt>
                  <dd className="flex items-center gap-1 text-xs">
                    {citizenSurvey.maintenance_done === "yes"    && <><CheckCircle  className="size-3.5 text-green-600"  /> Done</>}
                    {citizenSurvey.maintenance_done === "no"     && <><XCircle      className="size-3.5 text-red-500"    /> Not done</>}
                    {citizenSurvey.maintenance_done === "unsure" && <><AlertCircle  className="size-3.5 text-amber-500"  /> Not sure</>}
                    {citizenSurvey.maint_delivered && (
                      <span className="ml-2 text-muted-foreground">
                        · delivered: {citizenSurvey.maint_delivered === "yes" ? "fully" : citizenSurvey.maint_delivered}
                      </span>
                    )}
                  </dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-32 shrink-0 text-xs text-muted-foreground">Transport cost</dt>
                  <dd className="flex items-center gap-1 text-xs">
                    {citizenSurvey.transport_cost === "increased"  && <><TrendingUp   className="size-3.5 text-red-500"   /> Increased</>}
                    {citizenSurvey.transport_cost === "same"       && <><Minus         className="size-3.5 text-muted-foreground" /> Stayed same</>}
                    {citizenSurvey.transport_cost === "decreased"  && <><TrendingDown  className="size-3.5 text-green-600" /> Decreased</>}
                  </dd>
                </div>
                {citizenSurvey.impact_areas?.length > 0 && (
                  <div className="flex gap-2">
                    <dt className="w-32 shrink-0 text-xs text-muted-foreground">Impact on</dt>
                    <dd className="text-xs">{citizenSurvey.impact_areas.join(", ")}</dd>
                  </div>
                )}
                <div className="flex gap-2">
                  <dt className="w-32 shrink-0 text-xs text-muted-foreground">NRF aware</dt>
                  <dd className="text-xs">{citizenSurvey.nrf_aware ? "Yes" : "No"}</dd>
                </div>
                {citizenSurvey.feedback && (
                  <div className="flex gap-2">
                    <dt className="w-32 shrink-0 text-xs text-muted-foreground">Comments</dt>
                    <dd className="text-xs leading-relaxed text-foreground/80">{citizenSurvey.feedback}</dd>
                  </div>
                )}
              </dl>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-muted/20 p-5 text-center">
              <ClipboardList className="mx-auto size-5 text-muted-foreground/40" />
              <p className="mt-2 text-xs text-muted-foreground">No citizen survey submitted for this report.</p>
            </div>
          )}

          {/* Contact */}
          {(report.contact_name || report.contact_phone || report.contact_email) && (
            <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Reporter contact</h2>
              <dl className="mt-3 space-y-1.5 text-sm">
                {report.contact_name && <div><dt className="sr-only">Name</dt><dd>{report.contact_name}</dd></div>}
                {report.contact_phone && (
                  <div>
                    <dt className="sr-only">Phone</dt>
                    <dd><a href={`tel:${report.contact_phone}`} className="text-[var(--nrf-blue)] hover:underline">{report.contact_phone}</a></dd>
                  </div>
                )}
                {report.contact_email && (
                  <div>
                    <dt className="sr-only">Email</dt>
                    <dd><a href={`mailto:${report.contact_email}`} className="text-[var(--nrf-blue)] hover:underline">{report.contact_email}</a></dd>
                  </div>
                )}
              </dl>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Timestamps */}
          <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Submitted</h2>
            <div className="mt-2 flex items-center gap-1.5 text-sm">
              <Calendar className="size-4 text-muted-foreground" />
              {new Date(report.submitted_at).toLocaleDateString("en-LR", {
                day: "numeric", month: "long", year: "numeric",
              })}
            </div>
            {report.ip_address && (
              <p className="mt-2 text-xs text-muted-foreground">IP: {report.ip_address}</p>
            )}
          </div>

          {/* Status editor */}
          <ReportStatusEditor reportId={report.id} currentStatus={report.status} />
        </div>
      </div>

      {/* Notes thread — full width below the grid */}
      <div className="mt-5">
        <ReportNotes reportId={report.id} initialNotes={notes} />
      </div>
    </div>
  );
}
