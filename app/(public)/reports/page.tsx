import Link from "next/link";
import { ArrowRight, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { RoadReport } from "@/lib/types";
import { RecentReportCard, type ReportCardData } from "@/components/public/recent-report-card";

export const metadata = { title: "All Road Reports" };

async function getAllReports(): Promise<ReportCardData[]> {
  const { data } = await supabase
    .from("road_reports")
    .select(
      "id, reference_number, title, county, community, condition_type, severity, description, submitted_at, road_report_photos(public_url)",
    )
    .order("submitted_at", { ascending: false });

  return ((data ?? []) as (RoadReport & { road_report_photos: { public_url: string }[] })[]).map(
    (r) => ({
      id: r.id,
      reference_number: r.reference_number,
      title: r.title,
      county: r.county,
      community: r.community,
      condition_type: r.condition_type,
      severity: r.severity,
      description: r.description,
      submitted_at: r.submitted_at,
      coverPhotoUrl: r.road_report_photos?.[0]?.public_url ?? null,
    }),
  );
}

async function getCount() {
  const { count } = await supabase
    .from("road_reports")
    .select("id", { count: "exact", head: true });
  return count ?? 0;
}

export default async function ReportsPage() {
  const [reports, total] = await Promise.all([getAllReports(), getCount()]);

  return (
    <div className="min-h-screen">
      {/* Page header */}
      <div className="border-b border-border bg-white px-4 py-10 md:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="font-[family-name:var(--font-heading)] text-3xl font-semibold tracking-tight md:text-4xl">
                All Road Reports
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {total.toLocaleString()} report{total !== 1 ? "s" : ""} submitted
              </p>
            </div>
            <Link href="/submit" className="btn btn-primary shrink-0">
              Submit a report
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Reports grid */}
      <div className="px-4 py-12 md:px-8">
        <div className="mx-auto max-w-6xl">
          {reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border py-24 text-center">
              <AlertCircle className="size-10 text-muted-foreground/40" />
              <p className="mt-4 font-medium text-muted-foreground">No reports yet</p>
              <p className="mt-1 text-sm text-muted-foreground/70">Be the first to report a road condition.</p>
              <Link href="/submit" className="btn btn-secondary mt-6">
                Submit a report
              </Link>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {reports.map((report) => (
                <RecentReportCard key={report.id} report={report} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
