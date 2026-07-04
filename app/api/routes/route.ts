import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { planRoute } from "@/services/routing/route-planner";

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

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = routeRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid route request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const route = await planRoute(parsed.data);
    return NextResponse.json(route);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Route planning failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: "POST /api/routes",
    description:
      "Walking/cycling route between waypoints. Uses Mapbox Directions when MAPBOX_ACCESS_TOKEN is set, otherwise returns a Turf.js estimate with camera path.",
    exampleBody: {
      profile: "walking",
      accessible: true,
      waypoints: [
        { name: "Louvre", lon: 2.3376, lat: 48.8606 },
        { name: "Musée d'Orsay", lon: 2.3266, lat: 48.86 },
        { name: "Eiffel Tower", lon: 2.2945, lat: 48.8584 },
      ],
    },
    responseFields: [
      "geometry (GeoJSON LineString)",
      "distanceMeters",
      "durationMinutes",
      "legs",
      "cameraPath (coordinates for map fly-through)",
      "provider (turf-estimate | mapbox)",
    ],
  });
}
