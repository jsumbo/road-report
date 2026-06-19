"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, FileText, ClipboardList, Menu, X, LogOut, ExternalLink,
} from "lucide-react";
import { NrfLogo } from "@/components/brand/nrf-logo";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin",          label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/reports",  label: "Reports",   icon: FileText,        exact: false },
  { href: "/admin/surveys",  label: "Surveys",   icon: ClipboardList,   exact: false },
];

function NavLinks({ pathname, onNav }: { pathname: string; onNav?: () => void }) {
  return (
    <nav className="flex-1 space-y-0.5 px-3 py-4">
      {NAV.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNav}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-[var(--nrf-blue)] text-white"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="size-4 shrink-0" />
            {label}
          </Link>
        );
      })}

      <div className="my-3 border-t border-border" />

      <a
        href="/"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <ExternalLink className="size-4 shrink-0" />
        Public site
      </a>
    </nav>
  );
}

function SignOutButton() {
  return (
    <button
      onClick={async () => {
        await fetch("/api/admin/auth", { method: "DELETE" });
        window.location.href = "/admin/login";
      }}
      className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      <LogOut className="size-3.5" />
      Sign out
    </button>
  );
}

export function AdminSidebar({ email, name }: { email: string; name: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const SidebarInner = ({ onNav }: { onNav?: () => void }) => (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center border-b border-border px-5">
        <NrfLogo variant="full" href="/admin" />
      </div>

      {/* Nav */}
      <NavLinks pathname={pathname} onNav={onNav} />

      {/* User */}
      <div className="shrink-0 border-t border-border p-4">
        <div className="mb-3 flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://api.dicebear.com/9.x/pixel-art-neutral/svg?seed=${encodeURIComponent(email)}`}
            alt={name}
            width={36}
            height={36}
            className="size-9 shrink-0 rounded-full border border-border bg-muted"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{name}</p>
            <p className="truncate text-xs text-muted-foreground">{email}</p>
          </div>
        </div>
        <SignOutButton />
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-white md:flex">
        <SidebarInner />
      </aside>

      {/* Mobile top bar */}
      <div className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-white px-4 md:hidden">
        <button
          onClick={() => setOpen(true)}
          className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
          aria-label="Open menu"
        >
          <Menu className="size-5" />
        </button>
        <NrfLogo variant="mark" href="/admin" />
        <span className="flex-1 text-sm font-semibold">Admin Portal</span>
        <div className="flex items-center gap-2">
          <div className="hidden text-right sm:block">
            <p className="text-xs font-medium leading-none text-foreground">{name}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{email}</p>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://api.dicebear.com/9.x/pixel-art-neutral/svg?seed=${encodeURIComponent(email)}`}
            alt={name}
            width={32}
            height={32}
            className="size-8 shrink-0 rounded-full border border-border bg-muted"
          />
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-64 bg-white shadow-xl">
            <button
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
              aria-label="Close menu"
            >
              <X className="size-4" />
            </button>
            <SidebarInner onNav={() => setOpen(false)} />
          </aside>
        </div>
      )}
    </>
  );
}
