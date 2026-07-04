import * as turf from "@turf/turf";
import type {
  Itinerary,
  ItineraryStop,
  LayerType,
  ScoredFeature,
} from "@/lib/types";
import { WALKING_SPEED_M_PER_MIN } from "@/lib/constants";

/** Typical time spent at each kind of stop, in minutes. */
const DWELL_MINUTES: Partial<Record<LayerType, number>> = {
  cafes: 30,
  museums: 45,
  parks: 20,
  trees: 5,
  metro: 2,
  bikes: 2,
  accessibility: 15,
};

const DEFAULT_DWELL_MINUTES = 15;

function dwellFor(layer: LayerType): number {
  return DWELL_MINUTES[layer] ?? DEFAULT_DWELL_MINUTES;
}

function walkMinutes(from: [number, number], to: [number, number]): number {
  const meters = turf.distance(turf.point(from), turf.point(to), {
    units: "meters",
  });
  return meters / WALKING_SPEED_M_PER_MIN;
}

/**
 * Greedy nearest-neighbor ordering: start from the stop closest to the user,
 * then always walk to the nearest remaining stop. Optimal TSP is overkill for
 * 2-5 stops; this reads naturally on a map.
 */
function orderByProximity(
  stops: ScoredFeature[],
  origin: [number, number]
): ScoredFeature[] {
  const remaining = [...stops];
  const ordered: ScoredFeature[] = [];
  let cursor = origin;

  while (remaining.length) {
    let bestIdx = 0;
    let bestDist = Infinity;
    for (let i = 0; i < remaining.length; i += 1) {
      const d = turf.distance(
        turf.point(cursor),
        turf.point(remaining[i].feature.geometry.coordinates),
        { units: "meters" }
      );
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    }
    const [next] = remaining.splice(bestIdx, 1);
    ordered.push(next);
    cursor = next.feature.geometry.coordinates as [number, number];
  }

  return ordered;
}

function buildStops(
  ordered: ScoredFeature[],
  origin: [number, number]
): { stops: ItineraryStop[]; totalWalk: number; totalDuration: number } {
  const stops: ItineraryStop[] = [];
  let totalWalk = 0;
  let totalDuration = 0;
  let cursor = origin;

  ordered.forEach((scored, i) => {
    const coords = scored.feature.geometry.coordinates as [number, number];
    const walk = walkMinutes(cursor, coords);
    const dwell = dwellFor(scored.feature.properties.layer);

    totalWalk += walk;
    totalDuration += walk + dwell;
    cursor = coords;

    stops.push({
      order: i + 1,
      id: scored.feature.properties.id,
      name: scored.feature.properties.name,
      layer: scored.feature.properties.layer,
      coords,
      reasons: scored.reasons,
      walkFromPreviousMinutes: Math.round(walk * 10) / 10,
    });
  });

  return { stops, totalWalk, totalDuration };
}

/**
 * Build an itinerary from ranked candidates.
 *
 * Picks the top-scored features (avoiding two stops from the same layer in a
 * row where possible), orders them by walking proximity, then trims stops
 * from the end until the plan fits the user's time budget.
 */
export function buildItinerary(
  ranked: ScoredFeature[],
  origin: [number, number],
  desiredStops: number,
  timeBudgetMinutes?: number
): Itinerary {
  // Diversify: prefer not to pick many stops from a single layer.
  const picked: ScoredFeature[] = [];
  const layerCounts = new Map<LayerType, number>();
  const maxPerLayer = Math.max(1, Math.ceil(desiredStops / 2));

  for (const candidate of ranked) {
    if (picked.length >= desiredStops) break;
    const layer = candidate.feature.properties.layer;
    if ((layerCounts.get(layer) ?? 0) >= maxPerLayer) continue;
    picked.push(candidate);
    layerCounts.set(layer, (layerCounts.get(layer) ?? 0) + 1);
  }

  // Fill from leftovers if diversity filtering left gaps.
  for (const candidate of ranked) {
    if (picked.length >= desiredStops) break;
    if (!picked.includes(candidate)) picked.push(candidate);
  }

  let ordered = orderByProximity(picked, origin);
  let { stops, totalWalk, totalDuration } = buildStops(ordered, origin);

  // "We only have an hour" — drop the farthest-tail stops until it fits.
  if (timeBudgetMinutes != null) {
    while (ordered.length > 1 && totalDuration > timeBudgetMinutes) {
      ordered = ordered.slice(0, -1);
      ({ stops, totalWalk, totalDuration } = buildStops(ordered, origin));
    }
  }

  return {
    stops,
    totalWalkMinutes: Math.round(totalWalk * 10) / 10,
    totalDurationMinutes: Math.round(totalDuration),
    fitsTimeBudget:
      timeBudgetMinutes == null || totalDuration <= timeBudgetMinutes,
  };
}
