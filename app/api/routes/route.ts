import { NextResponse } from "next/server";
import { planRoute, type RouteRequest, type RouteWaypoint } from "@/services/routing/route-planner";

type RouteRequestBody = Partial<RouteRequest>;

function isWaypoint(value: unknown): value is RouteWaypoint {
  if (!value || typeof value !== "object") return false;

  const waypoint = value as Partial<RouteWaypoint>;
  return (
    typeof waypoint.lon === "number" &&
    Number.isFinite(waypoint.lon) &&
    waypoint.lon >= -180 &&
    waypoint.lon <= 180 &&
    typeof waypoint.lat === "number" &&
    Number.isFinite(waypoint.lat) &&
    waypoint.lat >= -90 &&
    waypoint.lat <= 90 &&
    (waypoint.name === undefined || typeof waypoint.name === "string")
  );
}

function parseRouteRequest(body: unknown): RouteRequest | null {
  if (!body || typeof body !== "object") return null;

  const request = body as RouteRequestBody;
  if (!Array.isArray(request.waypoints)) return null;
  if (request.waypoints.length < 2 || request.waypoints.length > 25) return null;
  if (!request.waypoints.every(isWaypoint)) return null;
  if (request.profile !== undefined && request.profile !== "walking" && request.profile !== "cycling") {
    return null;
  }
  if (request.accessible !== undefined && typeof request.accessible !== "boolean") {
    return null;
  }

  return {
    waypoints: request.waypoints,
    profile: request.profile,
    accessible: request.accessible
  };
}

export async function GET() {
  return NextResponse.json({
    endpoint: "POST /api/routes",
    description: "Walking or cycling route between two or more waypoints."
  });
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const routeRequest = parseRouteRequest(body);
  if (!routeRequest) {
    return NextResponse.json({ error: "Invalid route request" }, { status: 400 });
  }

  try {
    const route = await planRoute(routeRequest, {
      mapboxAccessToken: process.env.MAPBOX_ACCESS_TOKEN || undefined
    });

    return NextResponse.json(route);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Route planning failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
