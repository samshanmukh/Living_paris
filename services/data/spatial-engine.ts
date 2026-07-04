import * as turf from "@turf/turf";
import type { Feature, Polygon } from "geojson";
import type {
  IntentQuery,
  ParisFeature,
  ParisFeatureCollection,
} from "@/lib/types";
import {
  DEFAULT_QUERY_LIMIT,
  DEFAULT_WALK_MINUTES,
  PARIS_CENTER,
  WALKING_SPEED_M_PER_MIN,
} from "@/lib/constants";
import { filterByIntent, rankFeatures, resolveLayers } from "./intent-filter";
import type { DataStore } from "./store";
import { getSpatialIndex } from "./spatial-index";

export function walkMinutesToMeters(minutes: number): number {
  return minutes * WALKING_SPEED_M_PER_MIN;
}

export function resolveCenter(intent: IntentQuery): [number, number] {
  if (intent.lon != null && intent.lat != null) {
    return [intent.lon, intent.lat];
  }
  return PARIS_CENTER;
}

export function resolveRadius(intent: IntentQuery): number {
  if (intent.radius != null) return intent.radius;
  const walkMinutes = intent.walk ?? DEFAULT_WALK_MINUTES;
  return walkMinutesToMeters(walkMinutes);
}

export function filterWithinRadius(
  features: ParisFeature[],
  center: [number, number],
  radiusMeters: number,
  useIndex = false
): ParisFeature[] {
  const centerPoint = turf.point(center);
  const candidates = useIndex
    ? getSpatialIndex(
        [...new Set(features.map((f) => f.properties.layer))].map(String),
        features
      ).searchRadius(center, radiusMeters)
    : features;

  return candidates.filter((feature) => {
    if (feature.geometry.type !== "Point") return false;
    return (
      turf.distance(centerPoint, turf.point(feature.geometry.coordinates), {
        units: "meters",
      }) <= radiusMeters
    );
  });
}

export function filterWithinPolygon(
  features: ParisFeature[],
  polygon: Feature<Polygon>
): ParisFeature[] {
  return features.filter((feature) => {
    if (feature.geometry.type !== "Point") return false;
    return turf.booleanPointInPolygon(
      turf.point(feature.geometry.coordinates),
      polygon
    );
  });
}

export function findNearby(
  features: ParisFeature[],
  center: [number, number],
  limit: number
): ParisFeature[] {
  const centerPoint = turf.point(center);

  return [...features]
    .map((feature) => ({
      feature,
      distance: turf.distance(centerPoint, turf.point(feature.geometry.coordinates), {
        units: "meters",
      }),
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit)
    .map(({ feature }) => feature);
}

export interface SpatialQueryOptions {
  skipRadius?: boolean;
}

export function createSpatialEngine(store: DataStore) {
  async function runSpatialQuery(
    intent: IntentQuery,
    options: SpatialQueryOptions = {}
  ): Promise<{
    geojson: ParisFeatureCollection;
    layers: ReturnType<typeof resolveLayers>;
    center: [number, number];
    radiusMeters: number;
    totalFeatures: number;
  }> {
    const layers = resolveLayers(intent);
    const collection = await store.loadLayers(layers);
    const center = resolveCenter(intent);
    const radiusMeters = resolveRadius(intent);
    const limit = intent.limit ?? DEFAULT_QUERY_LIMIT;

    let features = filterByIntent(collection.features, intent);

    if (!options.skipRadius) {
      features = filterWithinRadius(features, center, radiusMeters, true);
    }

    features = rankFeatures(features, intent).slice(0, limit);

    return {
      geojson: { type: "FeatureCollection", features },
      layers,
      center,
      radiusMeters,
      totalFeatures: features.length,
    };
  }

  async function queryPlaces(params: {
    type?: string;
    layer?: string;
    lat?: number;
    lon?: number;
    radius?: number;
    accessible?: boolean;
    limit?: number;
  }): Promise<ParisFeatureCollection> {
    const intent: IntentQuery = {
      lat: params.lat,
      lon: params.lon,
      radius: params.radius,
      accessibility: params.accessible,
      limit: params.limit,
      layers: params.layer ? ([params.layer] as IntentQuery["layers"]) : undefined,
    };

    const { geojson } = await runSpatialQuery(intent, {
      skipRadius: params.radius == null && params.lat == null,
    });

    if (params.type) {
      geojson.features = geojson.features.filter(
        (f) => f.properties.type === params.type
      );
    }

    return geojson;
  }

  return { runSpatialQuery, queryPlaces, getLayerMetadata: () => store.getLayerMetadata(), loadLayer: (layer: Parameters<DataStore["loadLayer"]>[0]) => store.loadLayer(layer) };
}
