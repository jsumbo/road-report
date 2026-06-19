import { NextRequest, NextResponse } from "next/server";
import { supabase, REPORTS_BUCKET } from "@/lib/supabase";
import { LIBERIA_COUNTIES } from "@/lib/counties";
import type { ConditionType, ReportSeverity } from "@/lib/types";

const CONDITION_TYPES: ConditionType[] = [
  "pothole", "flooding", "bridge_damage", "road_erosion",
  "missing_guardrail", "landslide", "damaged_culvert", "other",
];
const SEVERITIES: ReportSeverity[] = ["low", "medium", "high", "critical"];
const MAX_PHOTO_SIZE = 10 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();

    const title        = (form.get("title") as string | null)?.trim() ?? "";
    const county       = (form.get("county") as string | null)?.trim() ?? "";
    const community    = (form.get("community") as string | null)?.trim() ?? "";
    const conditionType= (form.get("condition_type") as string | null) ?? "";
    const severity     = (form.get("severity") as string | null) ?? "";
    const description  = (form.get("description") as string | null)?.trim() ?? "";
    const lat          = form.get("latitude")  ? parseFloat(form.get("latitude") as string)  : null;
    const lng          = form.get("longitude") ? parseFloat(form.get("longitude") as string) : null;
    const contactName  = (form.get("contact_name")  as string | null)?.trim() || null;
    const contactPhone = (form.get("contact_phone") as string | null)?.trim() || null;
    const contactEmail = (form.get("contact_email") as string | null)?.trim() || null;

    // Validation
    if (!title || title.length < 5) {
      return NextResponse.json({ error: "Title must be at least 5 characters" }, { status: 400 });
    }
    if (!LIBERIA_COUNTIES.includes(county as (typeof LIBERIA_COUNTIES)[number])) {
      return NextResponse.json({ error: "Invalid county" }, { status: 400 });
    }
    if (!community || community.length < 2) {
      return NextResponse.json({ error: "Community is required" }, { status: 400 });
    }
    if (lat === null || lng === null || isNaN(lat) || isNaN(lng)) {
      return NextResponse.json({ error: "GPS coordinates are required" }, { status: 400 });
    }
    if (!CONDITION_TYPES.includes(conditionType as ConditionType)) {
      return NextResponse.json({ error: "Invalid condition type" }, { status: 400 });
    }
    if (!SEVERITIES.includes(severity as ReportSeverity)) {
      return NextResponse.json({ error: "Invalid severity" }, { status: 400 });
    }
    if (!description || description.length < 10) {
      return NextResponse.json({ error: "Description must be at least 10 characters" }, { status: 400 });
    }

    // Require at least one photo
    const photoFiles = form.getAll("photos") as File[];
    const validPhotos = photoFiles.filter(
      (f) => f instanceof File && f.size > 0 && f.size <= MAX_PHOTO_SIZE,
    );
    if (validPhotos.length === 0) {
      return NextResponse.json({ error: "At least one photo is required" }, { status: 400 });
    }

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      null;

    const { data: report, error: insertError } = await supabase
      .from("road_reports")
      .insert({
        title,
        county,
        community,
        latitude: lat,
        longitude: lng,
        ip_address: ip,
        condition_type: conditionType,
        severity,
        description,
        contact_name: contactName,
        contact_phone: contactPhone,
        contact_email: contactEmail,
        status: "new",
      })
      .select("id")
      .single();

    if (insertError || !report) {
      console.error("Insert error — code:", insertError?.code, "| message:", insertError?.message, "| details:", insertError?.details);
      const msg = insertError?.message ?? "Failed to save report";
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    const reportId: number = report.id;
    const year = new Date().getFullYear();
    const referenceNumber = `NRF-${year}-${String(reportId).padStart(6, "0")}`;

    await supabase
      .from("road_reports")
      .update({ reference_number: referenceNumber })
      .eq("id", reportId);

    for (const photo of validPhotos) {
      const ext = photo.name.split(".").pop() ?? "jpg";
      const path = `${reportId}/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from(REPORTS_BUCKET)
        .upload(path, await photo.arrayBuffer(), { contentType: photo.type });

      if (!uploadError) {
        const { data: urlData } = supabase.storage.from(REPORTS_BUCKET).getPublicUrl(path);
        await supabase.from("road_report_photos").insert({
          report_id: reportId,
          storage_path: path,
          public_url: urlData.publicUrl,
        });
      }
    }

    return NextResponse.json({ reference_number: referenceNumber }, { status: 201 });
  } catch (err) {
    console.error("Report submission error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  const { data, error } = await supabase
    .from("road_reports")
    .select("id, reference_number, title, county, community, condition_type, severity, status, submitted_at")
    .order("submitted_at", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
  return NextResponse.json(data);
}
