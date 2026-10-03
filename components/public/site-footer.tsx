import Link from "next/link";
import { ArrowRight, ClipboardList } from "lucide-react";

const LINKS = [
  { href: "/reports", label: "Reports" },
  { href: "/map",     label: "Map" },
];

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-auto overflow-hidden bg-[var(--nrf-blue)] text-white">
      <div className="mx-auto max-w-6xl px-4 pt-20 md:px-8 md:pt-28">

        {/* Headline, actions and links */}
        <div className="flex flex-col gap-12 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="font-[family-name:var(--font-heading)] text-4xl font-semibold leading-[1.02] tracking-tight sm:text-5xl md:text-7xl">
              Better roads start<br />with your report.
            </h2>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/submit"
                className="inline-flex items-center justify-between gap-6 rounded-full bg-white px-6 py-4 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--nrf-blue)] transition-colors hover:bg-white/90"
              >
                Report a road
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/survey"
                className="inline-flex items-center justify-between gap-6 rounded-full border border-white/40 px-6 py-4 text-xs font-semibold uppercase tracking-[0.08em] text-white transition-colors hover:border-white"
              >
                Take the survey
                <ClipboardList className="size-4" />
              </Link>
            </div>
          </div>

          <nav aria-label="Footer" className="flex flex-col items-start gap-1.5">
            {LINKS.map(({ href, label }) => (
              <Link key={href} href={href} className="text-2xl font-medium text-white/80 transition-colors hover:text-white">
                {label}
              </Link>
            ))}
            <a
              href="https://nrf.gov.lr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-2xl font-medium text-white/80 transition-colors hover:text-white"
            >
              NRF website ↗
            </a>
          </nav>
        </div>

        {/* Wordmark — spans the full width */}
        <p
          aria-hidden="true"
          className="mt-20 select-none whitespace-nowrap text-center font-[family-name:var(--font-heading)] text-[14.5vw] font-semibold leading-[0.85] tracking-tight md:mt-28 xl:text-[11.5rem]"
        >
          Road Report
        </p>

        {/* Info row */}
        <div className="mt-6 flex flex-col items-center gap-2 border-t border-white/15 py-5 text-center text-sm text-white/60 sm:flex-row sm:justify-between sm:text-left">
          <p>© {year} National Road Fund of Liberia</p>
          <p>Empowering citizens to build better communities.</p>
        </div>
      </div>
    </footer>
  );
}
