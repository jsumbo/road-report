"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { LIBERIA_COUNTIES } from "@/lib/counties";
import { CONDITION_LABELS, SEVERITY_LABELS, STATUS_LABELS } from "@/lib/types";

const SELECT_CLS =
  "h-9 rounded-lg border border-border bg-white px-3 text-xs font-medium text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--nrf-blue)]/30 cursor-pointer";

export function ReportsFilters({ total }: { total: number }) {
  const router = useRouter();
  const params = useSearchParams();

  const county   = params.get("county")   ?? "";
  const type     = params.get("type")     ?? "";
  const severity = params.get("severity") ?? "";
  const status   = params.get("status")   ?? "";

  const activeCount = [county, type, severity, status].filter(Boolean).length;

  function update(key: string, value: string) {
    const p = new URLSearchParams(params.toString());
    value ? p.set(key, value) : p.delete(key);
    p.delete("page");
    router.push(`/admin/reports?${p.toString()}`);
  }

  function clearAll() {
    router.push("/admin/reports");
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Location */}
      <select value={county} onChange={(e) => update("county", e.target.value)} className={SELECT_CLS}>
        <option value="">All locations</option>
        {LIBERIA_COUNTIES.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>

      {/* Type */}
      <select value={type} onChange={(e) => update("type", e.target.value)} className={SELECT_CLS}>
        <option value="">All types</option>
        {Object.entries(CONDITION_LABELS).map(([k, v]) => (
          <option key={k} value={k}>{v}</option>
        ))}
      </select>

      {/* Severity */}
      <select value={severity} onChange={(e) => update("severity", e.target.value)} className={SELECT_CLS}>
        <option value="">All severities</option>
        {Object.entries(SEVERITY_LABELS).map(([k, v]) => (
          <option key={k} value={k}>{v}</option>
        ))}
      </select>

      {/* Status */}
      <select value={status} onChange={(e) => update("status", e.target.value)} className={SELECT_CLS}>
        <option value="">All statuses</option>
        {Object.entries(STATUS_LABELS).map(([k, v]) => (
          <option key={k} value={k}>{v}</option>
        ))}
      </select>

      {/* Clear all */}
      {activeCount > 0 && (
        <button
          onClick={clearAll}
          className="flex h-9 items-center gap-1.5 rounded-lg border border-border bg-white px-3 text-xs font-medium text-muted-foreground shadow-sm hover:bg-muted hover:text-foreground"
        >
          <X className="size-3" />
          Clear ({activeCount})
        </button>
      )}

      <span className="ml-auto text-xs text-muted-foreground">
        {total.toLocaleString()} result{total !== 1 ? "s" : ""}
      </span>
    </div>
  );
}
