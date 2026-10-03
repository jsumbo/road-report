import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { LIBERIA_COUNTIES } from "@/lib/counties";

const ROAD_USER_VALUES     = ["driver", "pedestrian", "public_transport", "trader"];
const HOLDING_UP_VALUES    = ["yes", "somewhat", "no"];
const RESPONSE_TIME_VALUES = ["within_1m", "within_3m", "within_6m", "over_6m", "no_response"];
const IMPROVEMENT_VALUES   = ["significantly", "somewhat", "no_change", "worse"];
const ACCESS_VALUES        = ["significantly", "somewhat", "no_change", "not_at_all"];

export async function POST(req: NextRequest) {
  try {
    const b = await req.json();

    if (!LIBERIA_COUNTIES.includes(b.county))
      return NextResponse.json({ error: "Invalid county" }, { status: 400 });
    if (!b.community?.trim())
      return NextResponse.json({ error: "Community is required" }, { status: 400 });
    if (!ROAD_USER_VALUES.includes(b.roadUserType))
      return NextResponse.json({ error: "Road user type required" }, { status: 400 });
    if (!HOLDING_UP_VALUES.includes(b.holdingUp))
      return NextResponse.json({ error: "Holding up field required" }, { status: 400 });
    if (!RESPONSE_TIME_VALUES.includes(b.responseTime))
      return NextResponse.json({ error: "Response time field required" }, { status: 400 });
    if (!IMPROVEMENT_VALUES.includes(b.transportImprovement))
      return NextResponse.json({ error: "Transport improvement field required" }, { status: 400 });
    if (!ACCESS_VALUES.includes(b.accessImprovement))
      return NextResponse.json({ error: "Access improvement field required" }, { status: 400 });
    if (b.nrfAware !== "yes" && b.nrfAware !== "no")
      return NextResponse.json({ error: "NRF awareness field required" }, { status: 400 });
    if (!b.valueForMoney || b.valueForMoney < 1 || b.valueForMoney > 5)
      return NextResponse.json({ error: "Value for money rating required (1–5)" }, { status: 400 });
    if (!b.nrfSatisfaction || b.nrfSatisfaction < 1 || b.nrfSatisfaction > 5)
      return NextResponse.json({ error: "NRF satisfaction rating required (1–5)" }, { status: 400 });

    const reportReference = typeof b.reportReference === "string" && b.reportReference.trim()
      ? b.reportReference.trim()
      : null;

    const { data, error } = await supabase
      .from("citizen_surveys")
      .insert({
        reference_number:      "PENDING",
        report_reference:      reportReference,
        county:                b.county,
        community:             b.community.trim(),
        road_user_type:        b.roadUserType,
        holding_up:            b.holdingUp,
        response_time:         b.responseTime,
        transport_improvement: b.transportImprovement,
        access_improvement:    b.accessImprovement,
        nrf_aware:             b.nrfAware === "yes",
        value_for_money:       b.valueForMoney,
        nrf_satisfaction:      b.nrfSatisfaction,
        feedback:              b.feedback?.trim() || null,
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
