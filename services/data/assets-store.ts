/// <reference types="@cloudflare/workers-types" />

import type {
  LayerMeta,
  LayerType,
  ParisFeatureCollection,
} from "@/lib/types";
import { LAYER_METADATA } from "@/lib/constants";
import type { DataStore } from "./store";

export class AssetsDataStore implements DataStore {
  constructor(private assets: Fetcher) {}

  async loadLayer(layer: LayerType): Promise<ParisFeatureCollection> {
    const response = await this.assets.fetch(`/${layer}.geojson`);
    if (!response.ok) {
      throw new Error(`Layer "${layer}" not found in bundled assets`);
    }
    return response.json<ParisFeatureCollection>();
  }

  async loadLayers(layers: LayerType[]): Promise<ParisFeatureCollection> {
    const collections = await Promise.all(layers.map((layer) => this.loadLayer(layer)));
    return {
      type: "FeatureCollection",
      features: collections.flatMap((c) => c.features),
    };
  }

  async getLayerMetadata(): Promise<LayerMeta[]> {
    const response = await this.assets.fetch("/manifest.json");
    if (!response.ok) {
      throw new Error("manifest.json not found in bundled assets");
    }

    const manifest = await response.json<{
      updatedAt: string;
      layers: { id: LayerType; featureCount: number; path: string }[];
    }>();

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
}
