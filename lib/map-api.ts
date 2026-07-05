import type { IntentQuery, ParisFeatureCollection, SpatialQueryResult } from "@/lib/types";
import type { RouteRequest, RouteResponse } from "@/services/routing/route-planner";

export async function spatialQuery(intent: IntentQuery): Promise<SpatialQueryResult> {
  const res = await fetch("/api/spatial/query", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(intent),
  });

  const data = (await res.json()) as SpatialQueryResult & { error?: string };
  if (!res.ok) throw new Error(data.error ?? `Spatial query failed (${res.status})`);
  return data;
}

export async function planRouteClient(request: RouteRequest): Promise<RouteResponse> {
  const res = await fetch("/api/routes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  const data = (await res.json()) as RouteResponse & { error?: string };
  if (!res.ok) throw new Error(data.error ?? `Route planning failed (${res.status})`);
  return data;
}

export function collectionToFeatures(collection: ParisFeatureCollection) {
  return collection.features;
}
