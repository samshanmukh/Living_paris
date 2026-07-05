"use client";

import { Layer, Source } from "react-map-gl/mapbox";
import type { Feature, LineString } from "geojson";
import type { RouteResponse } from "@/services/routing/route-planner";

interface RouteLayerProps {
  geometry: Feature<LineString> | null;
  accentColor?: string;
}

export default function RouteLayer({ geometry, accentColor = "#d9a441" }: RouteLayerProps) {
  if (!geometry?.geometry?.coordinates?.length) return null;

  const data: Feature<LineString> = {
    type: "Feature",
    properties: {},
    geometry: geometry.geometry,
  };

  return (
    <Source id="lp-route" type="geojson" data={data}>
      <Layer
        id="lp-route-glow"
        type="line"
        paint={{
          "line-color": accentColor,
          "line-width": 10,
          "line-opacity": 0.28,
          "line-blur": 2,
        }}
        layout={{ "line-cap": "round", "line-join": "round" }}
      />
      <Layer
        id="lp-route-core"
        type="line"
        paint={{
          "line-color": accentColor,
          "line-width": 4,
          "line-opacity": 0.92,
        }}
        layout={{ "line-cap": "round", "line-join": "round" }}
      />
    </Source>
  );
}

export function routeBadgeLabel(route: RouteResponse | null): string | null {
  if (!route) return null;
  return `${Math.round(route.durationMinutes)} min · ${(route.distanceMeters / 1000).toFixed(1)} km`;
}
