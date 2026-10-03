export const dynamic = "force-dynamic";

import { supabase } from "@/lib/supabase";
import { MapView } from "@/components/public/map-view";
import Link from "next/link";
import { ArrowRight, MapPinned, MapPin, Camera, Send } from "lucide-react";

export const metadata = { title: "Road Conditions Map" };

export interface MapReport {
  id: number;
  reference_number: string;
  title: string | null;
  county: string;
  community: string;
  latitude: number;
  longitude: number;
  condition_type: string;
  severity: string;
  status: string;
  submitted_at: string;
  cover_photo_url: string | null;
}

async function getMapReports(): Promise<MapReport[]> {
  const { data } = await supabase
    .from("road_reports")
    .select(
      "id, reference_number, title, county, community, latitude, longitude, condition_type, severity, status, submitted_at, road_report_photos(public_url)",
    )
    .not("latitude", "is", null)
    .not("longitude", "is", null)
    .order("submitted_at", { ascending: false });

  return ((data ?? []) as (MapReport & { road_report_photos: { public_url: string }[] })[]).map(
    (r) => ({
      id: r.id,
      reference_number: r.reference_number,
      title: r.title,
      county: r.county,
      community: r.community,
      latitude: r.latitude,
      longitude: r.longitude,
      condition_type: r.condition_type,
      severity: r.severity,
      status: r.status,
      submitted_at: r.submitted_at,
      cover_photo_url: r.road_report_photos?.[0]?.public_url ?? null,
    }),
  );
}

const SEVERITY_LEGEND = [
  {
    label: "Low", color: "#22c55e",
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    ),
  },
  {
    label: "Medium", color: "#f59e0b",
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    ),
  },
  {
    label: "High", color: "#f97316",
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    ),
  },
  {
    label: "Critical", color: "#e0001a",
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
      </svg>
    ),
  },
];

export default async function MapPage() {
  const reports = await getMapReports();

  return (
    <div className="flex flex-1 flex-col">
      {/* Page header */}
      <div className="border-b border-border bg-white px-4 py-6 md:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="font-[family-name:var(--font-heading)] text-2xl font-semibold tracking-tight md:text-3xl">
                Road Conditions Map
              </h1>
            </div>
          </div>

          {/* Severity legend */}
          <div className="mt-4 flex flex-wrap items-center gap-5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Severity</span>
            {SEVERITY_LEGEND.map(({ label, color, icon }) => (
              <span key={label} className="flex items-center gap-2 text-xs font-medium text-foreground">
                <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "center" }}>
                  <span style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 22, height: 22,
                    borderRadius: 5,
                    border: `2.5px solid ${color}`,
                    background: "#fff",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.18)",
                    color,
                  }}>
                    {icon}
                  </span>
                  <span style={{
                    width: 0, height: 0,
                    borderLeft: "6px solid transparent",
                    borderRight: "6px solid transparent",
                    borderTop: `7px solid ${color}`,
                    marginTop: -1,
                  }} />
                </span>
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="relative flex-1" style={{ height: "calc(100dvh - 160px)", minHeight: 500 }}>
        <div className="absolute inset-0">
          <MapView reports={reports} />
        </div>

        {/* Empty state — a compact card over the map, so Liberia's counties still show */}
        {reports.length === 0 && (
          <div className="pointer-events-none absolute inset-x-0 bottom-6 z-[1000] flex justify-center px-4">
            <div className="pointer-events-auto w-full max-w-sm rounded-2xl border border-border bg-white/95 p-5 shadow-lg backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--nrf-blue)]/10">
                  <MapPinned className="size-5 text-[var(--nrf-blue)]" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-foreground">No reports yet</h2>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                    Reported roads will appear here, pinned to their county.
                  </p>
                </div>
              </div>

              <ul className="mt-4 flex items-center justify-between gap-2 border-y border-border py-3 text-[11px] font-medium text-muted-foreground">
                {[
                  { icon: MapPin, label: "Locate" },
                  { icon: Camera, label: "Photograph" },
                  { icon: Send,   label: "Submit" },
                ].map(({ icon: Icon, label }) => (
                  <li key={label} className="flex items-center gap-1.5">
                    <Icon className="size-3.5 text-[var(--nrf-blue)]" />
                    {label}
                  </li>
                ))}
              </ul>

              <Link href="/submit" className="btn btn-primary btn-sm mt-4 w-full">
                Submit the first report
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
