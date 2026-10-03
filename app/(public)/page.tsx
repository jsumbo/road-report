export const dynamic = "force-dynamic";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MapPin, Camera, ClipboardList, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { RoadReport } from "@/lib/types";
import { RecentReportCard, type ReportCardData } from "@/components/public/recent-report-card";
import { StatsBar } from "@/components/public/stats-bar";

async function getStats() {
  const [total, resolved, inProgress] = await Promise.all([
    supabase.from("road_reports").select("id", { count: "exact", head: true }),
    supabase.from("road_reports").select("id", { count: "exact", head: true }).eq("status", "resolved"),
    supabase.from("road_reports").select("id", { count: "exact", head: true }).eq("status", "in_progress"),
  ]);
  return {
    total: total.count ?? 0,
    resolved: resolved.count ?? 0,
    inProgress: inProgress.count ?? 0,
  };
}

async function getRecentReports(): Promise<ReportCardData[]> {
  const { data } = await supabase
    .from("road_reports")
    .select(
      "id, reference_number, title, county, community, condition_type, severity, description, submitted_at, road_report_photos(public_url)",
    )
    .order("submitted_at", { ascending: false })
    .limit(6);

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

export default async function HomePage() {
  const [stats, recentReports] = await Promise.all([getStats(), getRecentReports()]);

  return (
    <>
      {/* ── HERO ── */}
      <section className="relative -mt-20 min-h-[520px] overflow-hidden bg-[var(--nrf-ink)] text-white md:min-h-screen">
        <Image
          src="/hero-bg-image.webp"
          alt=""
          fill
          priority
          className="object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--nrf-ink)] via-[var(--nrf-ink)]/85 to-[var(--nrf-ink)]/40" />

        <div className="relative mx-auto flex min-h-[520px] max-w-6xl flex-col justify-center px-4 pb-10 pt-24 md:min-h-screen md:justify-end md:px-8 md:pb-28 md:pt-28">
          <h1 className="max-w-3xl font-[family-name:var(--font-heading)] text-3xl font-semibold leading-[1.05] tracking-tight sm:text-4xl md:text-6xl lg:text-7xl">
            Help us fix <br className="hidden md:block" />
            Liberia&apos;s roads
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-white/70 md:mt-6 md:text-xl">
            Spotted a damaged road, pothole, or hazard? Report it in minutes — our engineers review every
            submission across all 15 counties.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row md:mt-10">
            <Link href="/submit" className="btn btn-primary btn-lg">
              Report a Road Condition
              <ArrowRight className="size-4" />
            </Link>
            <Link href="/survey" className="btn btn-ghost-white btn-lg">
              Take the Citizen Survey
            </Link>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <StatsBar total={stats.total} resolved={stats.resolved} inProgress={stats.inProgress} />

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="bg-[var(--nrf-off-white)] px-4 py-20 md:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="font-[family-name:var(--font-heading)] text-3xl font-semibold tracking-tight md:text-4xl">
              How it works
            </h2>
            <p className="mx-auto mt-4 max-w-md text-base text-muted-foreground">
              No account needed — just locate, describe, and submit.
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {[
              {
                icon: MapPin,
                title: "Locate the road",
                desc: "Select your county and community. Enable GPS so engineers can find the exact spot on the map.",
              },
              {
                icon: Camera,
                title: "Document the condition",
                desc: "Choose the condition type and severity, write a description, and upload at least one photo.",
              },
              {
                icon: ClipboardList,
                title: "Submit your report",
                desc: "Hit submit and receive a unique reference number. Engineers review and action every report.",
              },
            ].map(({ icon: Icon, title, desc }, i) => (
              <div key={title} className="relative overflow-hidden rounded-lg border border-border/70 bg-white p-8 shadow-sm">
                <span
                  aria-hidden="true"
                  className="absolute right-5 top-3 select-none font-[family-name:var(--font-heading)] text-8xl font-bold leading-none text-[var(--nrf-blue)]/20"
                >
                  {i + 1}
                </span>
                <div className="flex size-12 items-center justify-center rounded-lg bg-[var(--nrf-blue)]/10">
                  <Icon className="size-6 text-[var(--nrf-blue)]" />
                </div>
                <h3 className="mt-5 text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link href="/submit" className="btn btn-secondary">
              Start your report
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── RECENT ISSUES ── */}
      <section id="recent-reports" className="bg-white px-4 py-20 md:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="font-[family-name:var(--font-heading)] text-3xl font-semibold tracking-tight md:text-4xl">
                Latest Reports
              </h2>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                Road conditions reported by citizens across Liberia&apos;s 15 counties.
              </p>
            </div>
            <Link href="/reports" className="btn btn-outline-blue shrink-0 hidden md:inline-flex">
              View all reports
              <ArrowRight className="size-4" />
            </Link>
          </div>

          {recentReports.length === 0 ? (
            <div className="mt-12 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border py-16 text-center">
              <AlertCircle className="size-10 text-muted-foreground/40" />
              <p className="mt-4 font-medium text-muted-foreground">No reports yet</p>
              <p className="mt-1 text-sm text-muted-foreground/70">Be the first to report a road condition.</p>
              <Link href="/submit" className="btn btn-secondary mt-6">
                Submit a report
              </Link>
            </div>
          ) : (
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {recentReports.map((report) => (
                <RecentReportCard key={report.id} report={report} />
              ))}
            </div>
          )}

          <div className="mt-8 flex justify-center md:hidden">
            <Link href="/reports" className="btn btn-outline-blue">
              View all reports
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
