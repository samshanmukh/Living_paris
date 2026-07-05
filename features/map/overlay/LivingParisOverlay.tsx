"use client";

import { useMemo } from "react";
import type { Feature, LineString } from "geojson";
import { CONTEXT_OVERLAY_LAYERS } from "@/lib/map-layer-styles";
import type { MapState } from "@/lib/types";
import IllustratedMarker from "./IllustratedMarker";
import LivingRouteOverlay from "./LivingRouteOverlay";

export interface LivingParisOverlayProps {
  mapState: MapState | null;
  routeGeometry: Feature<LineString> | null;
  routeAccentColor?: string;
  onMarkerClick?: (id: string) => void;
}

export default function LivingParisOverlay({
  mapState,
  routeGeometry,
  routeAccentColor,
  onMarkerClick,
}: LivingParisOverlayProps) {
  const destinations = useMemo(() => {
    if (!mapState) return [];
    const seen = new Set<string>();
    return mapState.markers.filter((marker) => {
      if (CONTEXT_OVERLAY_LAYERS.includes(marker.layer) || seen.has(marker.id)) {
        return false;
      }
      seen.add(marker.id);
      return true;
    });
  }, [mapState]);

  const stopOrder = useMemo(() => {
    if (!mapState) return new Map<string, number>();
    return new Map(
      mapState.routeWaypoints.map((waypoint, index) => [
        `${waypoint.lon},${waypoint.lat}`,
        index + 1,
      ])
    );
  }, [mapState]);

  const experienceKey = useMemo(() => {
    if (!mapState) return "empty";
    return [
      mapState.theme,
      ...mapState.routeWaypoints.map((waypoint) => `${waypoint.lon},${waypoint.lat}`),
      ...destinations.map((marker) => marker.id),
    ].join("|");
  }, [mapState, destinations]);

  if (!mapState) return null;

  return (
    <>
      <LivingRouteOverlay
        routeGeometry={routeGeometry}
        accentColor={routeAccentColor}
        experienceKey={experienceKey}
      />

      {destinations.map((marker, index) => {
        const order = marker.highlighted
          ? stopOrder.get(`${marker.coords[0]},${marker.coords[1]}`)
          : undefined;

        return (
          <IllustratedMarker
            key={`${experienceKey}-${marker.id}`}
            marker={marker}
            index={index}
            order={order}
            accentColor={routeAccentColor}
            onClick={onMarkerClick}
          />
        );
      })}
    </>
  );
}
