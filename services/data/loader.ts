import type { LayerType, ParisFeatureCollection } from "@/lib/types";
import { FileDataStore } from "./file-store";

/** Chat/experience reads bundled GeoJSON locally. Worker ASSETS/R2 serve external API clients. */
const defaultStore = new FileDataStore();

export async function loadLayer(layer: LayerType): Promise<ParisFeatureCollection> {
  return defaultStore.loadLayer(layer);
}

export async function loadLayers(layers: LayerType[]): Promise<ParisFeatureCollection> {
  return defaultStore.loadLayers(layers);
}

export async function getLayerMetadata() {
  return defaultStore.getLayerMetadata();
}

export async function loadManifest() {
  return defaultStore.loadManifest();
}

export function clearLayerCache(): void {
  // no-op — kept for compatibility
}
