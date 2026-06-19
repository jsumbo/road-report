import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const CONDITION_DESCRIPTIONS: Record<string, string> = {
  pothole:           "a pothole — a hole or depression in the road surface",
  flooding:          "road flooding — water covering or blocking a road",
  bridge_damage:     "bridge damage — structural damage to a bridge or its components",
  road_erosion:      "road erosion — the wearing away of a road surface or embankment",
  missing_guardrail: "a missing or damaged guardrail along a road",
  landslide:         "a landslide — earth, rocks, or debris covering a road",
  damaged_culvert:   "a damaged culvert — a drainage tunnel or pipe under a road",
};

type ImageMediaType = "image/jpeg" | "image/png" | "image/webp" | "image/gif";

function sniffMediaType(buf: Uint8Array): ImageMediaType {
  // WebP: RIFF????WEBP
  if (buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
      buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50) return "image/webp";
  // PNG
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "image/png";
  // GIF
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38) return "image/gif";
  return "image/jpeg";
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const conditionType = (form.get("condition_type") as string | null) ?? "";

    // Skip classification for "other" or missing inputs — always pass
    if (!file || !conditionType || conditionType === "other" || !CONDITION_DESCRIPTIONS[conditionType]) {
      return NextResponse.json({ matches: true, message: "" });
    }

    const label = CONDITION_DESCRIPTIONS[conditionType];
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const mediaType = sniffMediaType(new Uint8Array(bytes));

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 120,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: base64 },
            },
            {
              type: "text",
              text: `This photo was submitted to a road condition reporting system in Liberia. The reporter says it shows: ${label}.

Does the image actually show this type of road condition? Be lenient — wide-angle shots, roadside context, and partially visible damage all count. Only flag as NOT matching if the image is clearly unrelated (e.g. a selfie, food, a car interior, or has nothing to do with roads or infrastructure).

Reply with JSON only — no text outside the JSON object:
{"matches": true_or_false, "message": "One short plain-English sentence explaining the mismatch if not matching, otherwise empty string"}`,
            },
          ],
        },
      ],
    });

    const raw = response.content[0].type === "text" ? response.content[0].text.trim() : "";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return NextResponse.json({ matches: true, message: "" });

    const result = JSON.parse(jsonMatch[0]);
    return NextResponse.json({
      matches: Boolean(result.matches),
      message: typeof result.message === "string" ? result.message : "",
    });
  } catch (err) {
    console.error("Image classification error:", err);
    // Fail open — don't block the user if Claude is unavailable
    return NextResponse.json({ matches: true, message: "" });
  }
}
