import type { IntentInput } from "@/lib/intent-schema";
import type { SpatialQueryResult } from "@/lib/types";

const DEFAULT_API_URL = "https://living-paris-api.living-paris.workers.dev";

function getApiBaseUrl(): string {
  return process.env.API_URL?.trim() || DEFAULT_API_URL;
}

export async function postSpatialQuery(
  intent: IntentInput
): Promise<SpatialQueryResult> {
  const res = await fetch(`${getApiBaseUrl()}/api/spatial/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(intent),
  });

  if (!res.ok) {
    let detail = await res.text();
    try {
      detail = JSON.stringify(await res.json());
    } catch {
      // keep text
    }
    throw new Error(`Spatial query failed (${res.status}): ${detail}`);
  }

  return res.json() as Promise<SpatialQueryResult>;
}
