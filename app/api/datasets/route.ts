import { NextResponse } from "next/server";
import { getLayerMetadata } from "@/services/data/loader";

export async function GET() {
  try {
    const datasets = await getLayerMetadata();
    return NextResponse.json({
      count: datasets.length,
      datasets,
    });
  } catch (error) {
    console.error("GET /api/datasets failed:", error);
    return NextResponse.json(
      {
        error: "Failed to load dataset manifest",
        hint: "Run `npm run fetch-data` to download Paris Open Data",
      },
      { status: 503 }
    );
  }
}
