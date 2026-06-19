"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { ReportStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS: { value: ReportStatus; label: string; color: string }[] = [
  { value: "new", label: "New", color: "border-blue-300 bg-blue-50 text-blue-800 hover:border-blue-400" },
  { value: "reviewed", label: "Reviewed", color: "border-purple-300 bg-purple-50 text-purple-800 hover:border-purple-400" },
  { value: "in_progress", label: "In Progress", color: "border-yellow-300 bg-yellow-50 text-yellow-800 hover:border-yellow-400" },
  { value: "resolved", label: "Resolved", color: "border-green-300 bg-green-50 text-green-800 hover:border-green-400" },
  { value: "closed", label: "Closed", color: "border-gray-300 bg-gray-50 text-gray-800 hover:border-gray-400" },
];

interface ReportStatusEditorProps {
  reportId: number;
  currentStatus: ReportStatus;
}

export function ReportStatusEditor({ reportId, currentStatus }: ReportStatusEditorProps) {
  const router = useRouter();
  const [status, setStatus] = useState<ReportStatus>(currentStatus);
  const [saving, setSaving] = useState(false);

  const isDirty = status !== currentStatus;

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Update failed");
      toast.success("Report updated.");
      router.refresh();
    } catch {
      toast.error("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Update status</h2>
      <div className="mt-3 grid grid-cols-1 gap-1.5">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setStatus(opt.value)}
            className={cn(
              "rounded-lg border px-3 py-2 text-left text-xs font-medium transition-all",
              status === opt.value ? opt.color + " border-2" : "border-border bg-white text-muted-foreground",
            )}
          >
            {opt.label}
            {status === opt.value && " ✓"}
          </button>
        ))}
      </div>

      <Button
        type="button"
        size="sm"
        disabled={!isDirty || saving}
        onClick={save}
        className="mt-4 w-full bg-[var(--nrf-blue)] text-white hover:bg-[var(--nrf-blue)]/90"
      >
        {saving ? <Loader2 className="size-3.5 animate-spin" /> : null}
        {saving ? "Saving…" : "Save changes"}
      </Button>
    </div>
  );
}
