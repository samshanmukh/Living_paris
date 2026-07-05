import type {
  ExperienceResult,
  ExperienceId,
  IntentQuery,
  LayerType,
  MapMarker,
  MapState,
  ScoredFeature,
} from "@/lib/types";
import { CONTEXT_OVERLAY_BY_EXPERIENCE, CONTEXT_OVERLAY_LAYERS } from "@/lib/map-layer-styles";
import { loadLayers } from "@/services/data/loader";
import {
  filterWithinRadius,
  resolveCenter,
  resolveRadius,
} from "@/services/data/spatial-engine";
import {
  fetchLiveAirQuality,
  type LiveAirContext,
} from "@/services/persona/enrich-live-context";
import {
  applyPersonaToIntent,
  resolvePersona,
} from "@/services/persona/resolve-persona";
import { resolveExperience } from "./modes";
import { rankForExperience } from "./scoring";
import { buildItinerary } from "./itinerary";

const DEFAULT_RECOMMENDATIONS = 12;
const MAX_MARKERS = 40;

/** Support layers appear as markers/context but never as itinerary stops. */
const NON_DESTINATION_LAYERS: LayerType[] = [
  "metro",
  "bikes",
  "noise",
  "air-quality",
  "lighting",
  "halal",
  "metro-accessibility",
];

function layersForMode(
  modeId: ExperienceId,
  layerWeights: Partial<Record<LayerType, number>>,
  override?: LayerType[],
  personaOverlayLayers?: LayerType[]
): LayerType[] {
  const modePrimary = (Object.entries(layerWeights) as [LayerType, number][])
    .sort((a, b) => b[1] - a[1])
    .map(([layer]) => layer);
  const context = [
    ...(CONTEXT_OVERLAY_BY_EXPERIENCE[modeId] ?? []),
    ...(personaOverlayLayers ?? []),
  ];

  if (override?.length) {
    const overlayOnly = override.every((layer) =>
      CONTEXT_OVERLAY_LAYERS.includes(layer)
    );
    if (overlayOnly) {
      return [...new Set([...modePrimary, ...override, ...context])];
    }
    return [...new Set([...override, ...context])];
  }

  return [...new Set([...modePrimary, ...context])];
}

async function loadContextMarkers(layers: LayerType[]): Promise<MapMarker[]> {
  const contextTypes = layers.filter((layer) => CONTEXT_OVERLAY_LAYERS.includes(layer));
  if (!contextTypes.length) return [];

  const collection = await loadLayers(contextTypes);
  return collection.features.map((feature) => ({
    id: feature.properties.id,
    name: feature.properties.name,
    coords: feature.geometry.coordinates as [number, number],
    layer: feature.properties.layer,
    score: 0,
    highlighted: false,
    reasons: [],
    noiseLevel: feature.properties.noiseLevel,
    airQualityIndex: feature.properties.airQualityIndex,
    capacity: feature.properties.capacity,
  }));
}

function enrichContextMarkersWithLiveAir(
  markers: MapMarker[],
  live: LiveAirContext
): MapMarker[] {
  const liveIndex = live.aqi;
  if (liveIndex == null) return markers;

  return markers.map((marker) =>
    marker.layer === "air-quality"
      ? { ...marker, airQualityIndex: liveIndex }
      : marker
  );
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

  const personaPreset = resolvePersona(intent);
  const resolvedIntent = personaPreset
    ? applyPersonaToIntent(intent, personaPreset)
    : intent;

  const mode = resolveExperience(resolvedIntent);
  const layers = layersForMode(
    mode.id,
    mode.layerWeights,
    resolvedIntent.layers,
    personaPreset?.overlayLayers
  );
  const center = resolveCenter(resolvedIntent);
  const radiusMeters = resolveRadius(resolvedIntent);

  const collection = await loadLayers(layers);
  const within = filterWithinRadius(collection.features, center, radiusMeters, true);
  const ranked = rankForExperience(within, mode, resolvedIntent, center);
  let contextMarkers = await loadContextMarkers(layers);

  if (personaPreset?.id === "asthma") {
    const liveAir = await fetchLiveAirQuality();
    if (liveAir) {
      contextMarkers = enrichContextMarkersWithLiveAir(contextMarkers, liveAir);
    }
  }

  const destinations = ranked.filter(
    (s) => !NON_DESTINATION_LAYERS.includes(s.feature.properties.layer)
  );
  const itinerary = buildItinerary(
    destinations,
    center,
    mode.defaultStops,
    resolvedIntent.timeBudget
  );

  const recommendations = ranked
    .slice(0, resolvedIntent.limit ?? DEFAULT_RECOMMENDATIONS)
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
    contextMarkers,
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
    intent: resolvedIntent,
    mapState,
    itinerary,
    recommendations,
    meta: {
      totalCandidates: within.length,
      queryMs: Math.round(performance.now() - start),
    },
  };
}
