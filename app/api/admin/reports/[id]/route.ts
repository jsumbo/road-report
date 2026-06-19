import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import type { ReportStatus } from "@/lib/types";

const VALID_STATUSES: ReportStatus[] = ["new", "reviewed", "in_progress", "resolved", "closed"];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const reportId = parseInt(id, 10);
  if (isNaN(reportId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const body = await req.json();
  const { status, admin_notes } = body;

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (status && VALID_STATUSES.includes(status)) {
    patch.status = status;
    if (status === "resolved") patch.resolved_at = new Date().toISOString();
  }
  if (typeof admin_notes === "string") patch.admin_notes = admin_notes;

  const { error } = await supabase.from("road_reports").update(patch).eq("id", reportId);
  if (error) return NextResponse.json({ error: "Update failed" }, { status: 500 });

  return NextResponse.json({ ok: true });
}
