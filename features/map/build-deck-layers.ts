import type { Layer } from "@deck.gl/core";
import { HeatmapLayer } from "@deck.gl/aggregation-layers";
import { ColumnLayer, PathLayer, ScatterplotLayer } from "@deck.gl/layers";
import type { Feature, LineString } from "geojson";
import {
  CONTEXT_OVERLAY_LAYERS,
  layerAccent,
  markerRadius,
  THEME_ACCENT,
} from "@/lib/map-layer-styles";
import type { LayerType, MapMarker, MapState } from "@/lib/types";

interface BuildDeckLayersInput {
  mapState: MapState;
  routeGeometry: Feature<LineString> | null;
  pulse: number;
}

function visibleSet(mapState: MapState): Set<LayerType> {
  return new Set(mapState.visibleLayers);
}

function routePath(routeGeometry: Feature<LineString> | null): [number, number][] {
  if (!routeGeometry?.geometry?.coordinates?.length) return [];
  return routeGeometry.geometry.coordinates as [number, number][];
}

function heatmapWeight(marker: MapMarker): number {
  if (marker.layer === "noise" && marker.noiseLevel != null) {
    return Math.max(0.2, Math.min(1, marker.noiseLevel / 85));
  }
  if (marker.layer === "air-quality" && marker.airQualityIndex != null) {
    return Math.max(0.2, Math.min(1, marker.airQualityIndex / 100));
  }
  return 0.35;
}

export function buildDeckLayers({
  mapState,
  routeGeometry,
  pulse,
}: BuildDeckLayersInput): Layer[] {
  const layers: Layer[] = [];
  const visible = visibleSet(mapState);
  const accent = THEME_ACCENT[mapState.theme];
  const path = routePath(routeGeometry);

  if (path.length > 1) {
    const pulseScale = 1 + Math.sin(pulse / 7) * 0.16;
    layers.push(
      new PathLayer<{ path: [number, number][] }>({
        id: "lp-route-glow",
        data: [{ path }],
        getPath: (item) => item.path,
        getColor: [accent[0], accent[1], accent[2], 140] as [
          number,
          number,
          number,
          number,
        ],
        getWidth: 20 * pulseScale,
        widthUnits: "pixels",
        capRounded: true,
        jointRounded: true,
        pickable: false,
      }),
      new PathLayer<{ path: [number, number][] }>({
        id: "lp-route-core",
        data: [{ path }],
        getPath: (item) => item.path,
        getColor: [255, 255, 255, 235],
        getWidth: 4.5,
        widthUnits: "pixels",
        capRounded: true,
        jointRounded: true,
        pickable: false,
      })
    );
  }

  const contextMarkers = mapState.markers.filter(
    (m) => CONTEXT_OVERLAY_LAYERS.includes(m.layer) && visible.has(m.layer)
  );

  if (visible.has("noise")) {
    const noisePoints = contextMarkers.filter((m) => m.layer === "noise");
    if (noisePoints.length >= 3) {
      layers.push(
        new HeatmapLayer<MapMarker>({
          id: "lp-noise-heatmap",
          data: noisePoints,
          getPosition: (m) => m.coords,
          getWeight: heatmapWeight,
          radiusPixels: 72,
          intensity: 1.4,
          threshold: 0.08,
          colorRange: [
            [255, 255, 204, 0],
            [255, 237, 160, 90],
            [254, 178, 76, 140],
            [253, 141, 60, 170],
            [240, 59, 32, 200],
            [189, 0, 38, 220],
          ],
          pickable: false,
        })
      );
    }
  }

  if (visible.has("air-quality")) {
    const aqPoints = contextMarkers.filter((m) => m.layer === "air-quality");
    if (aqPoints.length >= 2) {
      layers.push(
        new HeatmapLayer<MapMarker>({
          id: "lp-aq-heatmap",
          data: aqPoints,
          getPosition: (m) => m.coords,
          getWeight: heatmapWeight,
          radiusPixels: 88,
          intensity: 1.2,
          threshold: 0.06,
          colorRange: [
            [237, 248, 251, 0],
            [178, 226, 226, 80],
            [102, 194, 164, 130],
            [35, 139, 69, 170],
            [0, 109, 44, 200],
            [0, 68, 27, 220],
          ],
          pickable: false,
        })
      );
    }
  }

  if (contextMarkers.length) {
    layers.push(
      new ScatterplotLayer<MapMarker>({
        id: "lp-context-markers",
        data: contextMarkers,
        getPosition: (m) => m.coords,
        getRadius: (m) => markerRadius(m.layer, m.highlighted, Math.sin(pulse / 7) * 0.16 + 1),
        radiusUnits: "pixels",
        getFillColor: (m) => layerAccent(m.layer, mapState.theme),
        getLineColor: [255, 255, 255, 180],
        getLineWidth: 1.5,
        lineWidthUnits: "pixels",
        pickable: false,
      })
    );
  }

  const heroes = mapState.markers.filter(
    (m) => m.highlighted && !CONTEXT_OVERLAY_LAYERS.includes(m.layer)
  );

  if (heroes.length) {
    layers.push(
      new ColumnLayer<MapMarker>({
        id: "lp-hero-plinths",
        data: heroes,
        diskResolution: 18,
        extruded: true,
        radius: 22,
        getPosition: (m) => m.coords,
        getElevation: (m) => (m.highlighted ? 90 : 40),
        getFillColor: (m) => {
          const c = layerAccent(m.layer, mapState.theme);
          return [c[0], c[1], c[2], 190] as [number, number, number, number];
        },
        pickable: false,
        elevationScale: 1,
      })
    );
  }

  return layers;
}
