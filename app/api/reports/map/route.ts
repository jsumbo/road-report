import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabase
    .from("road_reports")
    .select(
      "id, reference_number, county, community, latitude, longitude, condition_type, severity, status, submitted_at",
    )
    .not("latitude", "is", null)
    .not("longitude", "is", null)
    .order("submitted_at", { ascending: false });

  if (error) return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
  return NextResponse.json(data);
}
