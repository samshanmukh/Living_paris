import type { MapMarker } from "@/lib/types";

export type SceneKind =
  | "cafe"
  | "bakery"
  | "museum"
  | "restaurant"
  | "bookstore"
  | "courtyard"
  | "park";

export interface IllustratedDestination {
  marker: MapMarker;
  scene: SceneKind;
  order?: number;
  annotation?: string;
}

export function resolveSceneKind(marker: MapMarker): SceneKind {
  const name = marker.name.toLowerCase();
  if (name.includes("boulanger") || name.includes("bakery") || name.includes("pain")) {
    return "bakery";
  }
  if (
    name.includes("restaurant") ||
    name.includes("bistro") ||
    name.includes("brasserie")
  ) {
    return "restaurant";
  }
  if (name.includes("librairie") || name.includes("book")) {
    return "bookstore";
  }
  switch (marker.layer) {
    case "cafes":
      return "cafe";
    case "museums":
      return "museum";
    case "parks":
    case "trees":
      return "park";
    default:
      return "courtyard";
  }
}

export function pickAnnotation(marker: MapMarker): string | undefined {
  return marker.reasons.find(Boolean)?.trim();
}
