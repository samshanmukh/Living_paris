import { NextResponse } from "next/server";
import {
  mapOpenMeteoAirQuality,
  OPEN_METEO_AIR_QUALITY_URL,
  PARIS_COORDS,
} from "@/lib/live-api-types";

export const maxDuration = 30;

export async function GET() {
  try {
    const res = await fetch(OPEN_METEO_AIR_QUALITY_URL);
    if (!res.ok) {
      console.error(
        "GET /api/live/air-quality upstream failed:",
        res.status,
        res.statusText
      );
      return NextResponse.json(
        { error: "Air quality upstream failed" },
        { status: 502 }
      );
    }

    const body: unknown = await res.json();
    const mapped = mapOpenMeteoAirQuality(body, PARIS_COORDS);
    if (!mapped) {
      return NextResponse.json(
        { error: "Invalid air quality response" },
        { status: 502 }
      );
    }

    return NextResponse.json(mapped);
  } catch (error) {
    console.error("GET /api/live/air-quality failed:", error);
    return NextResponse.json(
      { error: "Air quality upstream failed" },
      { status: 502 }
    );
  }
}
