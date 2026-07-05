import type { ParisFeature } from "@/lib/types";

/** Prefer indoor / sheltered POIs when rain mode is active. */
export function filterRainFriendly(features: ParisFeature[]): ParisFeature[] {
  const indoor = features.filter(
    (feature) =>
      feature.properties.indoor ||
      feature.properties.layer === "museums" ||
      feature.properties.layer === "metro" ||
      feature.properties.tags?.includes("indoor")
  );

  if (indoor.length >= 3) return indoor;
  return features.filter((feature) => feature.properties.layer !== "parks");
}

export function rainModeLabel(active: boolean): string {
  return active ? "Rain mode · indoor-first" : "Clear · all layers";
}
