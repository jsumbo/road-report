"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { NrfLogo } from "@/components/brand/nrf-logo";

const NAV = [
  { href: "/about",   label: "About" },
  { href: "/reports", label: "Reports" },
  { href: "/map",     label: "Map" },
  { href: "/survey",  label: "Survey" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-transparent px-4 pt-3 md:px-8">
      {/* Floating pill */}
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[var(--nrf-ink)]/95 px-4 shadow-md backdrop-blur-md md:px-6">
        <NrfLogo variant="mark" href="/" className="lg:hidden" priority />
        <NrfLogo variant="full" href="/" className="hidden lg:inline-flex" priority />

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
          {NAV.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="rounded-lg px-3 py-2 text-sm text-white/70 hover:bg-white/10 hover:text-white"
            >
              {label}
            </Link>
          ))}
          <Link href="/submit" className="btn btn-primary btn-sm ml-2">
            Report a Road
          </Link>
        </nav>

        {/* Hamburger */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close navigation" : "Open navigation"}
          aria-expanded={open}
          className="flex size-10 items-center justify-center rounded-lg text-white hover:bg-white/10 md:hidden"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {/* Mobile menu — also a floating pill */}
      {open && (
        <div className="mx-auto mt-2 max-w-6xl overflow-hidden rounded-2xl border border-white/10 bg-[var(--nrf-ink)] shadow-md md:hidden">
          <nav className="flex flex-col px-4 pb-4 pt-2" aria-label="Mobile navigation">
            {NAV.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="border-b border-white/10 py-3 text-sm text-white/70 hover:text-white"
              >
                {label}
              </Link>
            ))}
            <Link
              href="/submit"
              onClick={() => setOpen(false)}
              className="btn btn-primary mt-4 w-full"
            >
              Report a Road
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
