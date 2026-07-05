import type { LayerType, MapTheme } from "@/lib/types";

/** RGBA tuples for deck.gl layers. */
export type Rgba = [number, number, number, number];

export const THEME_ACCENT: Record<MapTheme, Rgba> = {
  romantic: [196, 89, 58, 255],
  rain: [91, 122, 153, 255],
  family: [62, 107, 74, 255],
  night: [217, 164, 65, 255],
  day: [196, 89, 58, 255],
};

/** Context layers rendered as ambient overlays — never itinerary stops. */
export const CONTEXT_OVERLAY_LAYERS: LayerType[] = [
  "bikes",
  "noise",
  "air-quality",
];

export const CONTEXT_OVERLAY_BY_EXPERIENCE: Partial<
  Record<string, LayerType[]>
> = {
  "date-night": ["noise"],
  "relaxing-walk": ["noise", "air-quality"],
  "hidden-gems": ["noise"],
  "family-day": ["air-quality"],
  "photo-walk": ["air-quality"],
  "local-explorer": ["bikes"],
  "food-tour": ["bikes"],
};

export function layerAccent(layer: LayerType, theme: MapTheme): Rgba {
  switch (layer) {
    case "bikes":
      return [108, 229, 255, 220];
    case "noise":
      return [255, 106, 169, 220];
    case "air-quality":
      return [130, 215, 255, 220];
    case "metro":
      return [170, 140, 255, 210];
    case "trees":
      return [92, 168, 98, 200];
    default:
      return THEME_ACCENT[theme];
  }
}

export function markerRadius(
  layer: LayerType,
  highlighted: boolean,
  pulse = 1
): number {
  if (highlighted) return (14 + pulse * 2) * 1.1;
  if (CONTEXT_OVERLAY_LAYERS.includes(layer)) return 6 + pulse;
  return 8;
}
