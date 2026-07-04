import * as turf from "@turf/turf";
import type { Feature, LineString, Position } from "geojson";
import { WALKING_SPEED_M_PER_MIN } from "@/lib/constants";

export interface RouteWaypoint {
  lon: number;
  lat: number;
  name?: string;
}

export interface RouteRequest {
  waypoints: RouteWaypoint[];
  profile?: "walking" | "cycling";
  accessible?: boolean;
}

export interface RouteLeg {
  from: RouteWaypoint;
  to: RouteWaypoint;
  distanceMeters: number;
  durationMinutes: number;
}

export interface RouteResponse {
  profile: "walking" | "cycling";
  provider: "turf-estimate" | "mapbox";
  geometry: Feature<LineString>;
  distanceMeters: number;
  durationMinutes: number;
  legs: RouteLeg[];
  cameraPath: Position[];
  accessible: boolean;
  note?: string;
}

const CYCLING_SPEED_M_PER_MIN = 250;

function toPositions(waypoints: RouteWaypoint[]): Position[] {
  return waypoints.map((w) => [w.lon, w.lat]);
}

function estimateDuration(distanceMeters: number, profile: "walking" | "cycling"): number {
  const speed =
    profile === "cycling" ? CYCLING_SPEED_M_PER_MIN : WALKING_SPEED_M_PER_MIN;
  return distanceMeters / speed;
}

function buildLegs(
  waypoints: RouteWaypoint[],
  profile: "walking" | "cycling"
): RouteLeg[] {
  const legs: RouteLeg[] = [];

  for (let i = 0; i < waypoints.length - 1; i += 1) {
    const from = waypoints[i];
    const to = waypoints[i + 1];
    const distanceMeters = turf.distance(
      turf.point([from.lon, from.lat]),
      turf.point([to.lon, to.lat]),
      { units: "meters" }
    );

    legs.push({
      from,
      to,
      distanceMeters: Math.round(distanceMeters),
      durationMinutes: Math.round(estimateDuration(distanceMeters, profile) * 10) / 10,
    });
  }

  return legs;
}

function buildCameraPath(coordinates: Position[]): Position[] {
  if (coordinates.length <= 2) return coordinates;

  const line = turf.lineString(coordinates);
  const lengthKm = turf.length(line, { units: "kilometers" });
  const steps = Math.min(12, Math.max(4, Math.ceil(lengthKm * 8)));
  const cameraPath: Position[] = [];

  for (let i = 0; i <= steps; i += 1) {
    const along = turf.along(line, (lengthKm * i) / steps, { units: "kilometers" });
    cameraPath.push(along.geometry.coordinates);
  }

  return cameraPath;
}

async function fetchMapboxRoute(
  waypoints: RouteWaypoint[],
  profile: "walking" | "cycling",
  mapboxToken?: string
): Promise<RouteResponse | null> {
  if (!mapboxToken) return null;

  const coords = waypoints.map((w) => `${w.lon},${w.lat}`).join(";");
  const mapboxProfile = profile === "cycling" ? "cycling" : "walking";
  const url =
    `https://api.mapbox.com/directions/v5/mapbox/${mapboxProfile}/${coords}` +
    `?geometries=geojson&overview=full&access_token=${mapboxToken}`;

  const res = await fetch(url);
  if (!res.ok) return null;

  const data = (await res.json()) as {
    routes?: { distance: number; duration: number; geometry: Feature<LineString> }[];
  };
  const route = data.routes?.[0];
  if (!route) return null;

  const geometry = route.geometry as Feature<LineString>;
  const legs = buildLegs(waypoints, profile);

  return {
    profile,
    provider: "mapbox",
    geometry,
    distanceMeters: Math.round(route.distance),
    durationMinutes: Math.round((route.duration / 60) * 10) / 10,
    legs,
    cameraPath: buildCameraPath(geometry.geometry.coordinates),
    accessible: profile === "walking",
  };
}

export interface RoutePlannerEnv {
  mapboxAccessToken?: string;
}

export async function planRoute(
  request: RouteRequest,
  env: RoutePlannerEnv = {}
): Promise<RouteResponse> {
  const profile = request.profile ?? "walking";
  const waypoints = request.waypoints;

  if (waypoints.length < 2) {
    throw new Error("At least two waypoints are required");
  }

  const mapboxRoute = await fetchMapboxRoute(waypoints, profile, env.mapboxAccessToken);
  if (mapboxRoute) return mapboxRoute;

  const coordinates = toPositions(waypoints);
  const line = turf.lineString(coordinates);
  const distanceMeters = turf.length(line, { units: "meters" });
  const durationMinutes =
    Math.round(estimateDuration(distanceMeters, profile) * 10) / 10;

  return {
    profile,
    provider: "turf-estimate",
    geometry: line,
    distanceMeters: Math.round(distanceMeters),
    durationMinutes,
    legs: buildLegs(waypoints, profile),
    cameraPath: buildCameraPath(coordinates),
    accessible: request.accessible ?? profile === "walking",
    note:
      "Straight-line estimate. Set MAPBOX_ACCESS_TOKEN for turn-by-turn walking routes.",
  };
}
