"use client";

import { useState } from "react";
import { Loader2, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export interface ReportNote {
  id: number;
  admin_email: string;
  admin_name: string;
  body: string;
  created_at: string;
}

interface ReportNotesProps {
  reportId: number;
  initialNotes: ReportNote[];
}

export function ReportNotes({ reportId, initialNotes }: ReportNotesProps) {
  const [notes, setNotes] = useState<ReportNote[]>(initialNotes);
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!body.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/reports/${reportId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (!res.ok) throw new Error();
      const note: ReportNote = await res.json();
      setNotes((prev) => [...prev, note]);
      setBody("");
      toast.success("Note added.");
    } catch {
      toast.error("Failed to add note.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
      <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <MessageSquare className="size-3.5" />
        Internal notes
        {notes.length > 0 && (
          <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-foreground">
            {notes.length}
          </span>
        )}
      </h2>

      {/* Thread */}
      {notes.length === 0 ? (
        <p className="mt-4 text-center text-xs text-muted-foreground">No notes yet.</p>
      ) : (
        <div className="mt-4 space-y-5">
          {notes.map((note) => (
            <div key={note.id} className="flex gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://api.dicebear.com/9.x/pixel-art-neutral/svg?seed=${encodeURIComponent(note.admin_email)}`}
                alt={note.admin_name}
                width={28}
                height={28}
                className="size-7 shrink-0 rounded-full border border-border bg-muted"
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span className="text-xs font-semibold text-foreground">{note.admin_name}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(note.created_at).toLocaleDateString("en-LR", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-foreground">
                  {note.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add note */}
      <div className="mt-4 space-y-2 border-t border-border pt-4">
        <Textarea
          rows={3}
          placeholder="Add an internal note…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
          }}
          className="text-xs"
        />
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">Ctrl+Enter to submit</span>
          <Button
            size="sm"
            disabled={!body.trim() || saving}
            onClick={submit}
            className="bg-[var(--nrf-blue)] text-white hover:bg-[var(--nrf-blue)]/90"
          >
            {saving && <Loader2 className="mr-1.5 size-3.5 animate-spin" />}
            {saving ? "Adding…" : "Add note"}
          </Button>
        </div>
      </div>
    </div>
  );
}
