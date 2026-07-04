import { NextRequest, NextResponse } from "next/server";
import { LAYER_TYPES } from "@/lib/types";
import { queryPlaces } from "@/services/data/spatial-engine";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const type = searchParams.get("type") ?? undefined;
  const layer = searchParams.get("layer") ?? undefined;
  const accessible = searchParams.get("accessible") === "true";
  const limit = searchParams.get("limit")
    ? Number(searchParams.get("limit"))
    : undefined;
  const radius = searchParams.get("radius")
    ? Number(searchParams.get("radius"))
    : undefined;
  const lat = searchParams.get("lat") ? Number(searchParams.get("lat")) : undefined;
  const lon = searchParams.get("lon") ? Number(searchParams.get("lon")) : undefined;

  if (layer && !LAYER_TYPES.includes(layer as (typeof LAYER_TYPES)[number])) {
    return NextResponse.json(
      { error: "Invalid layer", availableLayers: LAYER_TYPES },
      { status: 400 }
    );
  }

  try {
    const geojson = await queryPlaces({
      type,
      layer,
      lat,
      lon,
      radius,
      accessible,
      limit,
    });

    return NextResponse.json({
      query: { type, layer, lat, lon, radius, accessible, limit },
      count: geojson.features.length,
      geojson,
    });
  } catch (error) {
    console.error("GET /api/places failed:", error);
    return NextResponse.json(
      {
        error: "Failed to query places",
        hint: "Run `npm run fetch-data` first",
      },
      { status: 503 }
    );
  }
}
