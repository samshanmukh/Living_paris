import fs from "node:fs/promises";
import path from "node:path";
import type {
  LayerMeta,
  LayerType,
  ParisFeatureCollection,
} from "@/lib/types";
import { LAYER_METADATA } from "@/lib/constants";
import type { DataStore } from "./store";

const DATA_DIR = path.join(process.cwd(), "public", "data");

export class FileDataStore implements DataStore {
  async loadManifest(): Promise<{
    updatedAt: string;
    layers: { id: LayerType; featureCount: number; path: string }[];
  }> {
    const raw = await fs.readFile(path.join(DATA_DIR, "manifest.json"), "utf8");
    return JSON.parse(raw);
  }

  async loadLayer(layer: LayerType): Promise<ParisFeatureCollection> {
    const filePath = path.join(DATA_DIR, `${layer}.geojson`);
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as ParisFeatureCollection;
  }

  async loadLayers(layers: LayerType[]): Promise<ParisFeatureCollection> {
    const collections = await Promise.all(layers.map((layer) => this.loadLayer(layer)));
    return {
      type: "FeatureCollection",
      features: collections.flatMap((c) => c.features),
    };
  }

  async getLayerMetadata(): Promise<LayerMeta[]> {
    const manifest = await this.loadManifest();

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
