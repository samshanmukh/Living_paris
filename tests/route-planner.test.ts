import { test } from "node:test";
import assert from "node:assert/strict";
import { planRoute } from "../services/routing/route-planner";

const originalFetch = globalThis.fetch;

test("uses Mapbox route geometry when access token is configured", async () => {
  globalThis.fetch = (async (url: string | URL | Request) => {
    assert.match(String(url), /api\.mapbox\.com\/directions\/v5\/mapbox\/walking/);
    assert.match(String(url), /access_token=pk\.test/);

    return new Response(
      JSON.stringify({
        routes: [
          {
            distance: 1234.4,
            duration: 812,
            geometry: {
              type: "LineString",
              coordinates: [
                [2.3376, 48.8606],
                [2.3411, 48.8587],
                [2.3499, 48.853],
              ],
            },
          },
        ],
      }),
      { status: 200 }
    );
  }) as typeof fetch;

  try {
    const route = await planRoute(
      {
        profile: "walking",
        waypoints: [
          { lon: 2.3376, lat: 48.8606, name: "Louvre" },
          { lon: 2.3499, lat: 48.853, name: "Notre-Dame" },
        ],
      },
      { mapboxAccessToken: "pk.test" }
    );

    assert.equal(route.provider, "mapbox");
    assert.equal(route.geometry.type, "Feature");
    assert.equal(route.geometry.geometry.type, "LineString");
    assert.equal(route.distanceMeters, 1234);
    assert.equal(route.durationMinutes, 13.5);
    assert.ok(route.cameraPath.length > 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
