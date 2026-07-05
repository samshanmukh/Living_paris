import { NextResponse } from "next/server";
import { mapWaqiFeed, waqiFeedUrl } from "@/lib/live-api-types";

export const maxDuration = 30;

export async function GET() {
  const apiKey = process.env.WAQI_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      { error: "WAQI_API_KEY not configured" },
      { status: 503 }
    );
  }

  try {
    const res = await fetch(waqiFeedUrl(apiKey));
    if (!res.ok) {
      console.error(
        "GET /api/live/aqi upstream failed:",
        res.status,
        res.statusText
      );
      return NextResponse.json({ error: "WAQI upstream failed" }, { status: 502 });
    }

    const body: unknown = await res.json();
    const mapped = mapWaqiFeed(body);
    if (!mapped) {
      return NextResponse.json(
        { error: "Invalid WAQI response" },
        { status: 502 }
      );
    }

    return NextResponse.json(mapped);
  } catch (error) {
    console.error("GET /api/live/aqi failed:", error);
    return NextResponse.json({ error: "WAQI upstream failed" }, { status: 502 });
  }
}
