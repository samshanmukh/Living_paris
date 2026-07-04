/// <reference types="@cloudflare/workers-types" />

import type {
  LayerMeta,
  LayerType,
  ParisFeatureCollection,
} from "@/lib/types";
import { LAYER_METADATA } from "@/lib/constants";
import type { DataStore } from "./store";

export class R2DataStore implements DataStore {
  constructor(private bucket: R2Bucket) {}

  async loadLayer(layer: LayerType): Promise<ParisFeatureCollection> {
    const object = await this.bucket.get(`${layer}.geojson`);
    if (!object) {
      throw new Error(`Layer "${layer}" not found in R2`);
    }
    return object.json<ParisFeatureCollection>();
  }

  async loadLayers(layers: LayerType[]): Promise<ParisFeatureCollection> {
    const collections = await Promise.all(layers.map((layer) => this.loadLayer(layer)));
    return {
      type: "FeatureCollection",
      features: collections.flatMap((c) => c.features),
    };
  }

  async getLayerMetadata(): Promise<LayerMeta[]> {
    const object = await this.bucket.get("manifest.json");
    if (!object) {
      throw new Error("manifest.json not found in R2");
    }

    const manifest = await object.json<{
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
