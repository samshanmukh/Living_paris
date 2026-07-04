import type { Position } from "geojson";
import type {
  IntentQuery,
  LayerMeta,
  LayerType,
  SpatialQueryResult
} from "@/lib/types";
import {
  sceneById,
  sceneMapStateById,
  type Coordinate,
  type SceneId
} from "@/lib/parisVisualizationData";
import type {
  BackendSource,
  ExperienceResponse,
  RouteExperience
} from "@/lib/experience-types";
import { FileDataStore } from "@/services/data/file-store";
import { createSpatialEngine } from "@/services/data/spatial-engine";
import { createCachedDataStore } from "@/services/data/store";
import { planRoute, type RouteRequest } from "@/services/routing/route-planner";

type ExperienceRequest = {
  message: string;
  currentSceneId?: SceneId;
};

const DEFAULT_API_URL = "https://living-paris-api.living-paris.workers.dev";
const sceneIds = new Set<SceneId>([
  "borrowed-senses",
  "rainy-day",
  "date-night",
  "hidden-gems"
]);

const localEngine = createSpatialEngine(createCachedDataStore(new FileDataStore()));

export async function getExperienceStatus(): Promise<{
  backendSource: BackendSource;
  datasets: LayerMeta[];
  warnings: string[];
}> {
  const warnings: string[] = [];

  try {
    const datasets = await fetchWorkerDatasets();
    return { backendSource: "worker", datasets, warnings };
  } catch (error) {
    warnings.push(workerWarning(error));
    const datasets = await localEngine.getLayerMetadata();
    return { backendSource: "local-file-store", datasets, warnings };
  }
}

export async function buildExperience({
  message,
  currentSceneId
}: ExperienceRequest): Promise<ExperienceResponse> {
  const sceneId = inferSceneId(message, currentSceneId);
  const intent = buildIntent(message, sceneId);
  const warnings: string[] = [];
  let backendSource: BackendSource = "worker";
  let datasets: LayerMeta[];
  let spatial: SpatialQueryResult;

  try {
    [datasets, spatial] = await Promise.all([
      fetchWorkerDatasets(),
      fetchWorkerSpatialQuery(intent)
    ]);
  } catch (error) {
    warnings.push(workerWarning(error));
    backendSource = "local-file-store";
    datasets = await localEngine.getLayerMetadata();
    spatial = await runLocalSpatialQuery(intent);
  }

  const routeRequest = buildRouteRequest(spatial, sceneId);
  const route = routeRequest
    ? await buildRoute(routeRequest, backendSource, warnings)
    : null;
  const mapState = sceneMapStateById(sceneId);
  const sourceLabel =
    backendSource === "worker" ? "Worker API" : "local GeoJSON backend";
  const layerNames = spatial.layers.join(", ");
  const routeText = route
    ? ` Route: ${Math.round(route.distanceMeters)}m, ${route.durationMinutes} min via ${route.provider}.`
    : "";

  return {
    sceneId,
    status: `${spatial.totalFeatures} matches from ${sourceLabel}`,
    reply: `${mapState.reply} Found ${spatial.totalFeatures} ${layerNames} matches through the ${sourceLabel}.${routeText}`,
    intent,
    backendSource,
    datasets,
    spatial,
    route,
    warnings
  };
}

function inferSceneId(message: string, currentSceneId?: SceneId): SceneId {
  const normalized = message.toLowerCase();

  if (
    normalized.includes("rain") ||
    normalized.includes("train") ||
    normalized.includes("indoor") ||
    normalized.includes("covered")
  ) {
    return "rainy-day";
  }

  if (
    normalized.includes("blind") ||
    normalized.includes("access") ||
    normalized.includes("wheelchair") ||
    normalized.includes("trocadero") ||
    normalized.includes("eiffel")
  ) {
    return "borrowed-senses";
  }

  if (
    normalized.includes("places to see") ||
    normalized.includes("things to do") ||
    normalized.includes("sightseeing") ||
    normalized.includes("must see") ||
    normalized.includes("hidden") ||
    normalized.includes("quiet") ||
    normalized.includes("local") ||
    normalized.includes("photo") ||
    normalized.includes("tourist")
  ) {
    return "hidden-gems";
  }

  if (
    normalized.includes("date") ||
    normalized.includes("romantic") ||
    normalized.includes("cinematic") ||
    normalized.includes("evening") ||
    normalized.includes("night")
  ) {
    return "date-night";
  }

  return currentSceneId && sceneIds.has(currentSceneId) ? currentSceneId : "date-night";
}

function buildIntent(message: string, sceneId: SceneId): IntentQuery {
  const normalized = message.toLowerCase();
  const isPlacesToSeeQuery =
    normalized.includes("places to see") ||
    normalized.includes("things to do") ||
    normalized.includes("sightseeing") ||
    normalized.includes("must see") ||
    normalized.includes("viewpoint");
  const scene = sceneById(sceneId);
  const [lon, lat] = scene.center;
  const budget = parseBudget(normalized);
  const walk = parseWalkMinutes(normalized);
  const intentByScene: Record<SceneId, IntentQuery> = {
    "borrowed-senses": {
      accessibility: true,
      walk: walk ?? 12,
      layers: ["accessibility", "metro", "museums", "parks", "cafes"],
      limit: 28
    },
    "rainy-day": {
      mood: "rainy",
      rainy: true,
      indoor: true,
      walk: walk ?? 15,
      layers: ["museums", "metro", "cafes", "accessibility"],
      limit: 28
    },
    "date-night": {
      mood: "romantic",
      budget: budget ?? 60,
      walk: walk ?? 15,
      layers: ["cafes", "parks", "museums"],
      limit: 28
    },
    "hidden-gems": {
      mood: normalized.includes("photo") ? "photography" : "hidden",
      walk: walk ?? 18,
      layers: ["parks", "cafes", "trees", "museums"],
      limit: 32
    }
  };

  const intent = {
    ...intentByScene[sceneId],
    lat,
    lon
  };

  if (normalized.includes("family") || normalized.includes("kids")) {
    intent.mood = "family";
    intent.layers = ["parks", "museums", "metro"];
  }

  if (isPlacesToSeeQuery) {
    intent.mood = "photography";
    intent.layers = ["museums", "parks", "trees"];
    intent.walk = walk ?? 20;
    intent.limit = 32;
  }

  if (normalized.includes("food") || normalized.includes("restaurant") || normalized.includes("cafe")) {
    intent.mood = "food";
    intent.layers = ["cafes"];
  }

  if (
    !isPlacesToSeeQuery &&
    (normalized.includes("museum") || normalized.includes("art") || normalized.includes("culture"))
  ) {
    intent.mood = "culture";
    intent.layers = ["museums"];
  }

  if (normalized.includes("bike") || normalized.includes("velib")) {
    intent.layers = uniqueLayers([...(intent.layers ?? []), "bikes"]);
  }

  if (normalized.includes("quiet")) {
    intent.mood = intent.mood ?? "relaxing";
  }

  if (normalized.includes("accessible") || normalized.includes("wheelchair") || normalized.includes("step-free")) {
    intent.accessibility = true;
    intent.layers = uniqueLayers([...(intent.layers ?? []), "accessibility"]);
  }

  return intent;
}

function parseBudget(message: string): number | undefined {
  const match = message.match(/(?:eur|€|under|budget|less than)\s*([0-9]{1,4})|([0-9]{1,4})\s*(?:eur|€)/i);
  const raw = match?.[1] ?? match?.[2];
  return raw ? Number(raw) : undefined;
}

function parseWalkMinutes(message: string): number | undefined {
  const match = message.match(/([0-9]{1,2})\s*(?:min|minute)/i);
  return match ? Number(match[1]) : undefined;
}

function uniqueLayers(layers: LayerType[]): LayerType[] {
  return [...new Set(layers)];
}

async function fetchWorkerDatasets(): Promise<LayerMeta[]> {
  const data = await fetchWorkerJson<{ datasets: LayerMeta[] }>("/api/datasets", {
    method: "GET"
  });
  return data.datasets;
}

async function fetchWorkerSpatialQuery(intent: IntentQuery): Promise<SpatialQueryResult> {
  return fetchWorkerJson<SpatialQueryResult>("/api/spatial/query", {
    method: "POST",
    body: JSON.stringify(intent)
  });
}

async function fetchWorkerRoute(request: RouteRequest): Promise<RouteExperience> {
  return fetchWorkerJson<RouteExperience>("/api/routes", {
    method: "POST",
    body: JSON.stringify(request)
  });
}

async function fetchWorkerJson<T>(path: string, init: RequestInit): Promise<T> {
  const baseUrl = (process.env.API_URL || DEFAULT_API_URL).replace(/\/$/, "");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2200);

  try {
    const response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init.headers ?? {})
      },
      signal: controller.signal,
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`${path} returned ${response.status}`);
    }

    return (await response.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

async function runLocalSpatialQuery(intent: IntentQuery): Promise<SpatialQueryResult> {
  const start = performance.now();
  const result = await localEngine.runSpatialQuery(intent);

  return {
    intent,
    layers: result.layers,
    totalFeatures: result.totalFeatures,
    geojson: result.geojson,
    meta: {
      radiusMeters: result.radiusMeters,
      center: result.center,
      queryMs: Math.round(performance.now() - start)
    }
  };
}

function buildRouteRequest(
  spatial: SpatialQueryResult,
  sceneId: SceneId
): RouteRequest | null {
  const features = spatial.geojson.features
    .filter((feature) => feature.geometry.type === "Point")
    .slice(0, 4);
  const scene = sceneById(sceneId);
  const start = coordinateToWaypoint(spatial.meta.center ?? scene.center, "Start");
  const featureWaypoints = features.map((feature) =>
    coordinateToWaypoint(feature.geometry.coordinates, feature.properties.name)
  );
  const waypoints = [start, ...dedupeWaypoints(featureWaypoints)].slice(0, 5);

  if (waypoints.length < 2) return null;

  return {
    waypoints,
    profile: "walking",
    accessible: Boolean(spatial.intent.accessibility)
  };
}

async function buildRoute(
  request: RouteRequest,
  backendSource: BackendSource,
  warnings: string[]
): Promise<RouteExperience> {
  if (backendSource === "worker") {
    try {
      return await fetchWorkerRoute(request);
    } catch (error) {
      warnings.push(`Worker route endpoint unavailable; used local route planner. ${workerWarning(error)}`);
    }
  }

  return planRoute(request, {
    mapboxAccessToken: process.env.MAPBOX_ACCESS_TOKEN || undefined
  });
}

function coordinateToWaypoint(coordinate: Position, name: string) {
  const [lon, lat] = coordinate;
  return {
    lon: Number(lon),
    lat: Number(lat),
    name
  };
}

function dedupeWaypoints(waypoints: ReturnType<typeof coordinateToWaypoint>[]) {
  const seen = new Set<string>();
  return waypoints.filter((waypoint) => {
    const key = `${waypoint.lon.toFixed(5)},${waypoint.lat.toFixed(5)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function workerWarning(error: unknown): string {
  const message = error instanceof Error ? error.message : "unknown error";
  return `Worker API unavailable; using local FileDataStore backend. ${message}`;
}

export function routePathFromGeometry(route: RouteExperience | null): Coordinate[] | undefined {
  if (!route) return undefined;
  return route.geometry.geometry.coordinates.map(([lon, lat]) => [lon, lat]);
}
