import fs from "node:fs/promises";
import path from "node:path";
import type {
  LayerMeta,
  LayerType,
  ParisFeature,
  ParisFeatureCollection,
} from "@/lib/types";
import { LAYER_METADATA } from "@/lib/constants";
import { clearSpatialIndexCache } from "./spatial-index";

const DATA_DIR = path.join(process.cwd(), "public", "data");

const layerCache = new Map<LayerType, ParisFeatureCollection>();

export async function loadManifest(): Promise<{
  updatedAt: string;
  layers: { id: LayerType; featureCount: number; path: string }[];
}> {
  const raw = await fs.readFile(path.join(DATA_DIR, "manifest.json"), "utf8");
  return JSON.parse(raw);
}

export async function loadLayer(layer: LayerType): Promise<ParisFeatureCollection> {
  const cached = layerCache.get(layer);
  if (cached) return cached;

  const filePath = path.join(DATA_DIR, `${layer}.geojson`);
  const raw = await fs.readFile(filePath, "utf8");
  const collection = JSON.parse(raw) as ParisFeatureCollection;
  layerCache.set(layer, collection);
  return collection;
}

export async function loadLayers(
  layers: LayerType[]
): Promise<ParisFeatureCollection> {
  const collections = await Promise.all(layers.map(loadLayer));
  return {
    type: "FeatureCollection",
    features: collections.flatMap((c) => c.features),
  };
}

export async function loadAllLayers(): Promise<ParisFeatureCollection> {
  const manifest = await loadManifest();
  const layerIds = manifest.layers.map((l) => l.id);
  return loadLayers(layerIds);
}

export async function getLayerMetadata(): Promise<LayerMeta[]> {
  const manifest = await loadManifest();

  return manifest.layers.map(({ id, featureCount }) => {
    const meta = LAYER_METADATA[id];
    return {
      id,
      name: meta.name,
      description: meta.description,
      featureCount,
      source: meta.defaultSource,
      updatedAt: manifest.updatedAt,
    };
  });
}

export async function getAllFeatures(): Promise<ParisFeature[]> {
  const collection = await loadAllLayers();
  return collection.features;
}

export function clearLayerCache(): void {
  layerCache.clear();
  clearSpatialIndexCache();
}
