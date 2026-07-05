import type { Map as MapboxMap } from "mapbox-gl";
import type { MapTheme } from "@/lib/types";

export const MAPBOX_STANDARD_STYLE = "mapbox://styles/mapbox/standard";

export type StandardLightPreset = "dawn" | "day" | "dusk" | "night";

/** Map experience themes → Mapbox Standard time-of-day lighting. */
export function themeToLightPreset(theme?: MapTheme | null): StandardLightPreset {
  switch (theme) {
    case "night":
      return "night";
    case "romantic":
      return "dusk";
    case "rain":
      return "day";
    case "family":
    case "day":
      return "day";
    default:
      return "dusk";
  }
}

export function getStandardMapConfig(theme?: MapTheme | null) {
  return {
    basemap: {
      lightPreset: themeToLightPreset(theme),
      show3dObjects: true,
      showPlaceLabels: true,
      showPointOfInterestLabels: true,
      showRoadLabels: true,
    },
  };
}

export function applyStandardBasemap(map: MapboxMap, theme?: MapTheme | null) {
  const preset = themeToLightPreset(theme);
  try {
    map.setConfigProperty("basemap", "lightPreset", preset);
  } catch {
    // Style may not be Standard yet — ignore.
  }
}
