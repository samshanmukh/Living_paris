import { NextRequest, NextResponse } from "next/server";
import { intentSchema } from "@/lib/intent-schema";
import { runExperience } from "@/services/experience/engine";
import { EXPERIENCE_LIST } from "@/services/experience/modes";

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = intentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid intent payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const result = await runExperience(parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    console.error("POST /api/experience failed:", error);
    return NextResponse.json(
      {
        error: "Experience engine failed",
        hint: "Run `npm run fetch-data` to prepare GeoJSON datasets",
      },
      { status: 503 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: "POST /api/experience",
    description:
      "Main Experience Engine endpoint — accumulated conversation intent in, ranked experience + mapState out. The AI team posts merged intent here; the Maps team renders the returned mapState directly.",
    modes: EXPERIENCE_LIST.map((m) => ({
      id: m.id,
      name: m.name,
      emoji: m.emoji,
      description: m.description,
      theme: m.theme,
      layers: Object.keys(m.layerWeights),
    })),
    exampleBody: {
      mood: "romantic",
      budget: 60,
      walk: 20,
      rainy: false,
      timeBudget: 60,
      dietary: ["vegetarian"],
      lat: 48.8566,
      lon: 2.3522,
    },
    responseShape: {
      experience: "{ id, name, emoji, description }",
      mapState:
        "{ flyTo, theme, visibleLayers, markers[], routeWaypoints[] } — render directly, feed routeWaypoints to POST /api/routes",
      itinerary: "{ stops[], totalWalkMinutes, totalDurationMinutes, fitsTimeBudget }",
      recommendations: "top-ranked places with reasons for cards",
    },
  });
}
