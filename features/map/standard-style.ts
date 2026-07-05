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

export function resolveLightPreset(
  theme?: MapTheme | null,
  weatherPreset?: StandardLightPreset
): StandardLightPreset {
  if (theme) return themeToLightPreset(theme);
  return weatherPreset ?? "dusk";
}

/** Apply Mapbox Standard basemap config — 3D objects, labels, lighting. */
export function applyStandardMapConfig(
  map: MapboxMap,
  options?: { theme?: MapTheme | null; lightPreset?: StandardLightPreset }
) {
  const config = getStandardMapConfig(options?.theme);
  const preset = resolveLightPreset(options?.theme, options?.lightPreset);

  try {
    map.setConfigProperty("basemap", "lightPreset", preset);
    map.setConfigProperty("basemap", "show3dObjects", config.basemap.show3dObjects);
    map.setConfigProperty("basemap", "showPlaceLabels", config.basemap.showPlaceLabels);
    map.setConfigProperty(
      "basemap",
      "showPointOfInterestLabels",
      config.basemap.showPointOfInterestLabels
    );
    map.setConfigProperty("basemap", "showRoadLabels", config.basemap.showRoadLabels);
  } catch {
    // Style may not be Standard yet — ignore.
  }
}

export function applyStandardBasemap(map: MapboxMap, theme?: MapTheme | null) {
  applyStandardMapConfig(map, { theme });
}
