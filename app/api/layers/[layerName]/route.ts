import { NextRequest, NextResponse } from "next/server";
import { LAYER_TYPES } from "@/lib/types";
import { getLayerMetadata, loadLayer } from "@/services/data/loader";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ layerName: string }> }
) {
  const { layerName } = await params;

  if (!LAYER_TYPES.includes(layerName as (typeof LAYER_TYPES)[number])) {
    return NextResponse.json(
      {
        error: "Unknown layer",
        availableLayers: LAYER_TYPES,
      },
      { status: 404 }
    );
  }

  try {
    const [geojson, meta] = await Promise.all([
      loadLayer(layerName as (typeof LAYER_TYPES)[number]),
      getLayerMetadata(),
    ]);

    const layerMeta = meta.find((m) => m.id === layerName);

    return NextResponse.json({
      layer: layerMeta,
      geojson,
    });
  } catch (error) {
    console.error(`GET /api/layers/${layerName} failed:`, error);
    return NextResponse.json(
      {
        error: `Layer "${layerName}" not found`,
        hint: "Run `npm run fetch-data` to generate GeoJSON layers",
      },
      { status: 503 }
    );
  }
}
