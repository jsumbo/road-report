import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const reportId = parseInt(id, 10);
  if (isNaN(reportId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const { data, error } = await supabase
    .from("road_report_notes")
    .select("id, admin_email, admin_name, body, created_at")
    .eq("report_id", reportId)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: "Failed to fetch notes" }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const reportId = parseInt(id, 10);
  if (isNaN(reportId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const { body } = await req.json();
  if (!body || typeof body !== "string" || !body.trim()) {
    return NextResponse.json({ error: "Note body is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("road_report_notes")
    .insert({
      report_id: reportId,
      admin_email: session.email,
      admin_name: session.name,
      body: body.trim(),
    })
    .select("id, admin_email, admin_name, body, created_at")
    .single();

  if (error || !data) return NextResponse.json({ error: "Failed to add note" }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
