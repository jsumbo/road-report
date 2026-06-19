export const dynamic = "force-dynamic";

import { supabase } from "@/lib/supabase";
import { MapView } from "@/components/public/map-view";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

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
  { label: "Low",      color: "#22c55e" },
  { label: "Medium",   color: "#f59e0b" },
  { label: "High",     color: "#f97316" },
  { label: "Critical", color: "#e0001a" },
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
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <span className="text-xs font-medium text-muted-foreground">Severity:</span>
            {SEVERITY_LEGEND.map(({ label, color }) => (
              <span key={label} className="flex items-center gap-1.5 text-xs font-medium">
                <span style={{
                  display: "inline-block",
                  width: 16, height: 16,
                  borderRadius: 4,
                  border: `2.5px solid ${color}`,
                  background: "#fff",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                }} />
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="relative flex-1" style={{ height: "calc(100dvh - 160px)", minHeight: 500 }}>
        {reports.length === 0 ? (
          <div className="flex h-full min-h-[400px] flex-col items-center justify-center gap-3 text-center">
            <p className="font-medium text-muted-foreground">No reports with GPS data yet</p>
            <p className="text-sm text-muted-foreground/70">
              Submitted reports with GPS coordinates will appear here.
            </p>
            <Link href="/submit" className="btn btn-secondary mt-2">
              Submit the first report
            </Link>
          </div>
        ) : (
          <MapView reports={reports} />
        )}
      </div>
    </div>
  );
}
