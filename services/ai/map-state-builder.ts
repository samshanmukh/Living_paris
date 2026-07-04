import type { IntentInput } from "@/lib/intent-schema";
import type { ChatMapState, MapTheme } from "@/lib/chat-types";
import type { SpatialQueryResult } from "@/lib/types";

function themeFromIntent(intent: IntentInput): MapTheme {
  if (intent.rainy || intent.mood === "rainy") return "rain";
  if (intent.mood === "romantic") return "romantic";
  if (intent.mood === "family") return "family";
  if (intent.mood === "nightlife") return "night";
  return "default";
}

export function buildMapState(
  intent: IntentInput,
  spatial: SpatialQueryResult
): ChatMapState {
  return {
    center: spatial.meta.center,
    zoom: intent.mood === "photography" ? 14 : 13,
    activeLayers: spatial.layers,
    highlights: spatial.geojson,
    theme: themeFromIntent(intent),
    meta: {
      radiusMeters: spatial.meta.radiusMeters,
      totalFeatures: spatial.totalFeatures,
      queryMs: spatial.meta.queryMs,
    },
  };
}
