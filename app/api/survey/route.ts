import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { LIBERIA_COUNTIES } from "@/lib/counties";

const MAINT_VALUES = ["yes", "no", "unsure"];
const COST_VALUES  = ["increased", "same", "decreased"];

export async function POST(req: NextRequest) {
  try {
    const b = await req.json();

    if (!LIBERIA_COUNTIES.includes(b.county))
      return NextResponse.json({ error: "Invalid county" }, { status: 400 });
    if (!b.community?.trim())
      return NextResponse.json({ error: "Community is required" }, { status: 400 });
    if (!b.roadRating || b.roadRating < 1 || b.roadRating > 5)
      return NextResponse.json({ error: "Road rating required (1–5)" }, { status: 400 });
    if (!b.safetyRating || b.safetyRating < 1 || b.safetyRating > 5)
      return NextResponse.json({ error: "Safety rating required (1–5)" }, { status: 400 });
    if (!MAINT_VALUES.includes(b.maintenanceDone))
      return NextResponse.json({ error: "Maintenance field required" }, { status: 400 });
    if (!COST_VALUES.includes(b.transportCost))
      return NextResponse.json({ error: "Transport cost field required" }, { status: 400 });
    if (b.nrfAware !== "yes" && b.nrfAware !== "no")
      return NextResponse.json({ error: "NRF awareness field required" }, { status: 400 });

    const reportReference = typeof b.reportReference === "string" && b.reportReference.trim()
      ? b.reportReference.trim()
      : null;

    const { data, error } = await supabase
      .from("citizen_surveys")
      .insert({
        reference_number:   "PENDING",
        report_reference:   reportReference,
        county:             b.county,
        community:          b.community.trim(),
        road_rating:        b.roadRating,
        safety_rating:      b.safetyRating,
        road_problems:      Array.isArray(b.roadProblems) ? b.roadProblems : [],
        maintenance_done:   b.maintenanceDone,
        maint_satisfaction: b.maintenanceDone === "yes" ? (b.maintSatisfaction ?? null) : null,
        maint_delivered:    b.maintenanceDone === "yes" ? (b.maintDelivered  || null)   : null,
        impact_areas:       Array.isArray(b.impactAreas) ? b.impactAreas : [],
        transport_cost:     b.transportCost,
        nrf_aware:          b.nrfAware === "yes",
        nrf_satisfaction:   b.nrfAware === "yes" ? (b.nrfSatisfaction ?? null) : null,
        feedback:           b.feedback?.trim() || null,
      })
      .select("id")
      .single();

    if (error || !data) {
      console.error("Survey insert error:", error?.message);
      return NextResponse.json({ error: "Failed to save survey" }, { status: 500 });
    }

    const ref = `NRF-S-${new Date().getFullYear()}-${String(data.id).padStart(5, "0")}`;
    await supabase.from("citizen_surveys").update({ reference_number: ref }).eq("id", data.id);

    return NextResponse.json({ reference_number: ref }, { status: 201 });
  } catch (err) {
    console.error("Survey route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
