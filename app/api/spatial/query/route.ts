import { NextRequest, NextResponse } from "next/server";
import { intentSchema } from "@/lib/intent-schema";
import type { IntentQuery, SpatialQueryResult } from "@/lib/types";
import { runSpatialQuery } from "@/services/data/spatial-engine";

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

  const intent: IntentQuery = parsed.data;
  const start = performance.now();

  try {
    const result = await runSpatialQuery(intent);
    const queryMs = Math.round(performance.now() - start);

    const response: SpatialQueryResult = {
      intent,
      layers: result.layers,
      totalFeatures: result.totalFeatures,
      geojson: result.geojson,
      meta: {
        radiusMeters: result.radiusMeters,
        center: result.center,
        queryMs,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("POST /api/spatial/query failed:", error);
    return NextResponse.json(
      {
        error: "Spatial query failed",
        hint: "Run `npm run fetch-data` to prepare GeoJSON datasets",
      },
      { status: 503 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: "POST /api/spatial/query",
    description:
      "Accepts AI intent JSON and returns matching GeoJSON features for map visualization",
    exampleBody: {
      mood: "romantic",
      budget: 60,
      walk: 15,
      accessibility: true,
      lat: 48.8566,
      lon: 2.3522,
    },
    schema: {
      mood: "romantic | family | rainy | photography | nightlife | relaxing | hidden | food | culture | general",
      budget: "number (euros)",
      walk: "number (minutes)",
      accessibility: "boolean",
      indoor: "boolean",
      rainy: "boolean",
      lat: "number",
      lon: "number",
      radius: "number (meters)",
      layers: "LayerType[]",
      limit: "number (max 500)",
    },
  });
}
