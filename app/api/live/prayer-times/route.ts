import { NextResponse } from "next/server";
import {
  ALADHAN_PRAYER_TIMES_URL,
  mapAladhanTimings,
} from "@/lib/live-api-types";

export const maxDuration = 30;

export async function GET() {
  try {
    const res = await fetch(ALADHAN_PRAYER_TIMES_URL, { redirect: "follow" });
    if (!res.ok) {
      console.error(
        "GET /api/live/prayer-times upstream failed:",
        res.status,
        res.statusText
      );
      return NextResponse.json(
        { error: "Prayer times upstream failed" },
        { status: 502 }
      );
    }

    const body: unknown = await res.json();
    const mapped = mapAladhanTimings(body);
    if (!mapped) {
      return NextResponse.json(
        { error: "Invalid prayer times response" },
        { status: 502 }
      );
    }

    return NextResponse.json(mapped);
  } catch (error) {
    console.error("GET /api/live/prayer-times failed:", error);
    return NextResponse.json(
      { error: "Prayer times upstream failed" },
      { status: 502 }
    );
  }
}
