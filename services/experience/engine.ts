import type {
  ExperienceResult,
  ExperienceId,
  IntentQuery,
  LayerType,
  MapMarker,
  MapState,
  ScoredFeature,
} from "@/lib/types";
import { CONTEXT_OVERLAY_BY_EXPERIENCE } from "@/lib/map-layer-styles";
import { loadLayers } from "@/services/data/loader";
import {
  filterWithinRadius,
  resolveCenter,
  resolveRadius,
} from "@/services/data/spatial-engine";
import { resolveExperience } from "./modes";
import { rankForExperience } from "./scoring";
import { buildItinerary } from "./itinerary";

const DEFAULT_RECOMMENDATIONS = 12;
const MAX_MARKERS = 40;

/** Support layers appear as markers/context but never as itinerary stops. */
const NON_DESTINATION_LAYERS: LayerType[] = ["metro", "bikes", "noise", "air-quality"];

function layersForMode(
  modeId: ExperienceId,
  layerWeights: Partial<Record<LayerType, number>>,
  override?: LayerType[]
): LayerType[] {
  const primary = override?.length
    ? override
    : (Object.entries(layerWeights) as [LayerType, number][])
        .sort((a, b) => b[1] - a[1])
        .map(([layer]) => layer);

  const context = CONTEXT_OVERLAY_BY_EXPERIENCE[modeId] ?? [];
  return [...new Set([...primary, ...context])];
}

/** Center the camera on the itinerary rather than the raw query center. */
function focusCenter(
  ranked: ScoredFeature[],
  fallback: [number, number]
): [number, number] {
  const top = ranked.slice(0, 5);
  if (!top.length) return fallback;
  const lon =
    top.reduce((sum, s) => sum + s.feature.geometry.coordinates[0], 0) / top.length;
  const lat =
    top.reduce((sum, s) => sum + s.feature.geometry.coordinates[1], 0) / top.length;
  return [lon, lat];
}

/**
 * The Experience Engine — decides what appears on the map.
 *
 * intent (accumulated conversation state)
 *   -> experience mode (Date Night, Rainy Day, ...)
 *   -> candidate features from weighted layers within walking radius
 *   -> scored + ranked per mode weights and intent context
 *   -> itinerary (ordered stops, time-budget aware)
 *   -> mapState (camera, theme, layers, markers, route waypoints)
 */
export async function runExperience(intent: IntentQuery): Promise<ExperienceResult> {
  const start = performance.now();

  const mode = resolveExperience(intent);
  const layers = layersForMode(mode.id, mode.layerWeights, intent.layers);
  const center = resolveCenter(intent);
  const radiusMeters = resolveRadius(intent);

  const collection = await loadLayers(layers);
  const within = filterWithinRadius(collection.features, center, radiusMeters, true);
  const ranked = rankForExperience(within, mode, intent, center);

  const destinations = ranked.filter(
    (s) => !NON_DESTINATION_LAYERS.includes(s.feature.properties.layer)
  );
  const itinerary = buildItinerary(
    destinations,
    center,
    mode.defaultStops,
    intent.timeBudget
  );

  const recommendations = ranked
    .slice(0, intent.limit ?? DEFAULT_RECOMMENDATIONS)
    .map((s) => ({
      id: s.feature.properties.id,
      name: s.feature.properties.name,
      layer: s.feature.properties.layer,
      score: Math.round(s.score * 10) / 10,
      reasons: s.reasons,
      distanceMeters: s.distanceMeters,
    }));

  const itineraryIds = new Set(itinerary.stops.map((s) => s.id));
  const markers: MapMarker[] = ranked.slice(0, MAX_MARKERS).map((s) => ({
    id: s.feature.properties.id,
    name: s.feature.properties.name,
    coords: s.feature.geometry.coordinates as [number, number],
    layer: s.feature.properties.layer,
    score: Math.round(s.score * 10) / 10,
    highlighted: itineraryIds.has(s.feature.properties.id),
    reasons: s.reasons,
    noiseLevel: s.feature.properties.noiseLevel,
    airQualityIndex: s.feature.properties.airQualityIndex,
    capacity: s.feature.properties.capacity,
  }));

  const mapState: MapState = {
    flyTo: {
      center: focusCenter(ranked, center),
      zoom: mode.camera.zoom,
      pitch: mode.camera.pitch,
    },
    theme: mode.theme,
    visibleLayers: layers,
    markers,
    routeWaypoints: itinerary.stops.map((s) => ({
      lon: s.coords[0],
      lat: s.coords[1],
      name: s.name,
    })),
  };

  return {
    experience: {
      id: mode.id,
      name: mode.name,
      emoji: mode.emoji,
      description: mode.description,
    },
    intent,
    mapState,
    itinerary,
    recommendations,
    meta: {
      totalCandidates: within.length,
      queryMs: Math.round(performance.now() - start),
    },
  };
}
