import RBush from "rbush";
import type { ParisFeature } from "@/lib/types";

interface IndexedFeature {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  feature: ParisFeature;
}

export class SpatialIndex {
  private tree = new RBush<IndexedFeature>();

  constructor(features: ParisFeature[] = []) {
    if (features.length) this.load(features);
  }

  load(features: ParisFeature[]): void {
    this.tree.clear();
    const items = features
      .filter((f) => f.geometry.type === "Point")
      .map((feature) => {
        const [lon, lat] = feature.geometry.coordinates;
        return { minX: lon, minY: lat, maxX: lon, maxY: lat, feature };
      });
    this.tree.load(items);
  }

  searchRadius(
    center: [number, number],
    radiusMeters: number
  ): ParisFeature[] {
    const [lon, lat] = center;
    const delta = radiusMeters / 111_320;

    const candidates = this.tree.search({
      minX: lon - delta,
      minY: lat - delta,
      maxX: lon + delta,
      maxY: lat + delta,
    });

    return candidates.map((item) => item.feature);
  }

  get size(): number {
    return this.tree.all().length;
  }
}

const indexCache = new Map<string, SpatialIndex>();

function cacheKey(layers: string[]): string {
  return layers.slice().sort().join(",");
}

export function getSpatialIndex(
  layers: string[],
  features: ParisFeature[]
): SpatialIndex {
  const key = cacheKey(layers);
  const existing = indexCache.get(key);
  if (existing && existing.size === features.length) return existing;

  const index = new SpatialIndex(features);
  indexCache.set(key, index);
  return index;
}

export function clearSpatialIndexCache(): void {
  indexCache.clear();
}
