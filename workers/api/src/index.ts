import { Hono } from "hono";
import { cors } from "hono/cors";
import { z } from "zod";
import { formatZodError } from "../../../lib/format-zod-error";
import { intentSchema } from "../../../lib/intent-schema";
import { LAYER_TYPES } from "../../../lib/types";
import type { IntentQuery, SpatialQueryResult } from "../../../lib/types";
import { R2DataStore } from "../../../services/data/r2-store";
import { createSpatialEngine } from "../../../services/data/spatial-engine";
import { createCachedDataStore } from "../../../services/data/store";
import { planRoute } from "../../../services/routing/route-planner";
import type { Env } from "./env";

const waypointSchema = z.object({
  lon: z.number().min(-180).max(180),
  lat: z.number().min(-90).max(90),
  name: z.string().optional(),
});

const routeRequestSchema = z.object({
  waypoints: z.array(waypointSchema).min(2).max(25),
  profile: z.enum(["walking", "cycling"]).optional(),
  accessible: z.boolean().optional(),
});

function createEngine(env: Env) {
  const store = createCachedDataStore(new R2DataStore(env.DATA));
  return createSpatialEngine(store);
}

const app = new Hono<{ Bindings: Env }>();

app.use("*", async (c, next) => {
  const origin = c.env.ALLOWED_ORIGIN ?? "*";
  return cors({ origin, allowMethods: ["GET", "POST", "OPTIONS"] })(c, next);
});

app.get("/", (c) =>
  c.json({
    service: "Living Paris API",
    endpoints: [
      "GET /api/datasets",
      "GET /api/layers/:layerName",
      "GET /api/places",
      "POST /api/spatial/query",
      "GET /api/spatial/query",
      "POST /api/routes",
      "GET /api/routes",
    ],
  })
);

app.get("/api/datasets", async (c) => {
  try {
    const engine = createEngine(c.env);
    const datasets = await engine.getLayerMetadata();
    return c.json({ count: datasets.length, datasets });
  } catch (error) {
    console.error("GET /api/datasets failed:", error);
    return c.json(
      {
        error: "Failed to load dataset manifest",
        hint: "Run `npm run fetch-data && npm run upload-data` to populate R2",
      },
      503
    );
  }
});

app.get("/api/layers/:layerName", async (c) => {
  const layerName = c.req.param("layerName");

  if (!LAYER_TYPES.includes(layerName as (typeof LAYER_TYPES)[number])) {
    return c.json({ error: "Unknown layer", availableLayers: LAYER_TYPES }, 404);
  }

  try {
    const engine = createEngine(c.env);
    const [geojson, meta] = await Promise.all([
      engine.loadLayer(layerName as (typeof LAYER_TYPES)[number]),
      engine.getLayerMetadata(),
    ]);
    const layerMeta = meta.find((m) => m.id === layerName);
    return c.json({ layer: layerMeta, geojson });
  } catch (error) {
    console.error(`GET /api/layers/${layerName} failed:`, error);
    return c.json(
      {
        error: `Layer "${layerName}" not found`,
        hint: "Run `npm run upload-data` to sync GeoJSON to R2",
      },
      503
    );
  }
});

app.get("/api/places", async (c) => {
  const type = c.req.query("type");
  const layer = c.req.query("layer");
  const accessible = c.req.query("accessible") === "true";
  const limit = c.req.query("limit") ? Number(c.req.query("limit")) : undefined;
  const radius = c.req.query("radius") ? Number(c.req.query("radius")) : undefined;
  const lat = c.req.query("lat") ? Number(c.req.query("lat")) : undefined;
  const lon = c.req.query("lon") ? Number(c.req.query("lon")) : undefined;

  if (layer && !LAYER_TYPES.includes(layer as (typeof LAYER_TYPES)[number])) {
    return c.json({ error: "Invalid layer", availableLayers: LAYER_TYPES }, 400);
  }

  try {
    const engine = createEngine(c.env);
    const geojson = await engine.queryPlaces({
      type,
      layer,
      lat,
      lon,
      radius,
      accessible,
      limit,
    });

    return c.json({
      query: { type, layer, lat, lon, radius, accessible, limit },
      count: geojson.features.length,
      geojson,
    });
  } catch (error) {
    console.error("GET /api/places failed:", error);
    return c.json(
      { error: "Failed to query places", hint: "Run `npm run upload-data` first" },
      503
    );
  }
});

app.post("/api/spatial/query", async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const parsed = intentSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(formatZodError(parsed.error), 400);
  }

  const intent: IntentQuery = parsed.data;
  const start = performance.now();

  try {
    const engine = createEngine(c.env);
    const result = await engine.runSpatialQuery(intent);
    const queryMs = Math.round(performance.now() - start);

    const response: SpatialQueryResult = {
      intent,
      layers: result.layers,
      totalFeatures: result.totalFeatures,
      geojson: result.geojson,
      meta: {
        radiusMeters: result.radiusMeters,
        center: result.center,
        queryMs,
      },
    };

    return c.json(response);
  } catch (error) {
    console.error("POST /api/spatial/query failed:", error);
    return c.json(
      {
        error: "Spatial query failed",
        hint: "Run `npm run upload-data` to prepare GeoJSON in R2",
      },
      503
    );
  }
});

app.get("/api/spatial/query", (c) =>
  c.json({
    endpoint: "POST /api/spatial/query",
    description:
      "Accepts AI intent JSON and returns matching GeoJSON features for map visualization",
    exampleBody: {
      mood: "romantic",
      budget: 60,
      walk: 15,
      accessibility: true,
      lat: 48.8566,
      lon: 2.3522,
    },
  })
);

app.post("/api/routes", async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const parsed = routeRequestSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(
      { error: "Invalid route request", details: parsed.error.flatten() },
      400
    );
  }

  try {
    const route = await planRoute(parsed.data, {
      mapboxAccessToken: c.env.MAPBOX_ACCESS_TOKEN,
    });
    return c.json(route);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Route planning failed";
    return c.json({ error: message }, 400);
  }
});

app.get("/api/routes", (c) =>
  c.json({
    endpoint: "POST /api/routes",
    description: "Walking/cycling route between waypoints with camera path",
  })
);

export default app;
