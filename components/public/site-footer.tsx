import Link from "next/link";
import { NrfLogo } from "@/components/brand/nrf-logo";

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-auto border-t border-border bg-[var(--nrf-off-white)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12 md:flex-row md:items-start md:justify-between md:px-8">
        <div>
          <NrfLogo variant="full" href="/" />
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
            Empowering citizens to build better communities.
          </p>
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <Link href="/submit" className="text-foreground/80 hover:text-[var(--nrf-blue)]">Report a road</Link>
          <Link href="/reports" className="text-foreground/80 hover:text-[var(--nrf-blue)]">All reports</Link>
          <Link href="/map" className="text-foreground/80 hover:text-[var(--nrf-blue)]">Road conditions map</Link>
          <a href="https://nrf.gov.lr" target="_blank" rel="noopener noreferrer" className="text-foreground/80 hover:text-[var(--nrf-blue)]">NRF website ↗</a>
        </div>
      </div>
      <div className="border-t border-border/60">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-5 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between md:px-8">
          <p>© {year} National Road Fund of Liberia. All Rights Reserved.</p>
          <a href="https://nrf.gov.lr" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">
            nrf.gov.lr ↗
          </a>
        </div>
      </div>
    </footer>
  );
}
