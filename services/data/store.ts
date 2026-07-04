import type {
  LayerMeta,
  LayerType,
  ParisFeatureCollection,
} from "@/lib/types";

export interface DataStore {
  loadLayer(layer: LayerType): Promise<ParisFeatureCollection>;
  loadLayers(layers: LayerType[]): Promise<ParisFeatureCollection>;
  getLayerMetadata(): Promise<LayerMeta[]>;
}

export function createCachedDataStore(store: DataStore): DataStore {
  const layerCache = new Map<LayerType, ParisFeatureCollection>();
  let manifestCache: Awaited<ReturnType<DataStore["getLayerMetadata"]>> | null =
    null;

  return {
    async loadLayer(layer) {
      const cached = layerCache.get(layer);
      if (cached) return cached;
      const collection = await store.loadLayer(layer);
      layerCache.set(layer, collection);
      return collection;
    },

    async loadLayers(layers) {
      const collections = await Promise.all(
        layers.map((layer) => this.loadLayer(layer))
      );
      return {
        type: "FeatureCollection",
        features: collections.flatMap((c) => c.features),
      };
    },

    async getLayerMetadata() {
      if (manifestCache) return manifestCache;
      manifestCache = await store.getLayerMetadata();
      return manifestCache;
    },
  };
}
