import type { Layer } from "@deck.gl/core";
import { HeatmapLayer } from "@deck.gl/aggregation-layers";
import { PathLayer, ScatterplotLayer } from "@deck.gl/layers";
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
  hiddenLayers?: Set<LayerType>;
  routeAccentRgb?: [number, number, number];
  animate?: boolean;
}

function isLayerVisible(
  layer: LayerType,
  visible: Set<LayerType>,
  hiddenLayers?: Set<LayerType>
): boolean {
  return visible.has(layer) && !hiddenLayers?.has(layer);
}

function routePath(routeGeometry: Feature<LineString> | null): [number, number][] {
  if (!routeGeometry?.geometry?.coordinates?.length) return [];
  return routeGeometry.geometry.coordinates as [number, number][];
}

function heatmapWeight(marker: MapMarker): number {
  if (marker.layer === "noise" && marker.noiseLevel != null) {
    return Math.max(0.35, Math.min(1, marker.noiseLevel / 85));
  }
  if (marker.layer === "air-quality" && marker.airQualityIndex != null) {
    return Math.max(0.35, Math.min(1, marker.airQualityIndex / 100));
  }
  return 0.5;
}

function contextMarkerSources(mapState: MapState): MapMarker[] {
  const merged = new Map<string, MapMarker>();
  for (const marker of mapState.contextMarkers ?? []) {
    merged.set(marker.id, marker);
  }
  for (const marker of mapState.markers) {
    if (CONTEXT_OVERLAY_LAYERS.includes(marker.layer)) {
      merged.set(marker.id, marker);
    }
  }
  return [...merged.values()];
}

export function buildDeckLayers({
  mapState,
  routeGeometry,
  pulse,
  hiddenLayers,
  routeAccentRgb,
  animate = true,
}: BuildDeckLayersInput): Layer[] {
  const layers: Layer[] = [];
  const visible = new Set(mapState.visibleLayers);
  const accent = routeAccentRgb ?? THEME_ACCENT[mapState.theme].slice(0, 3) as [
    number,
    number,
    number,
  ];
  const path = routePath(routeGeometry);

  if (path.length > 1) {
    const pulseScale = animate ? 1 + Math.sin(pulse / 7) * 0.16 : 1;
    layers.push(
      new PathLayer<{ path: [number, number][] }>({
        id: "lp-route-glow",
        data: [{ path }],
        getPath: (item) => item.path,
        getColor: [accent[0], accent[1], accent[2], 110] as [
          number,
          number,
          number,
          number,
        ],
        getWidth: 22 * pulseScale,
        widthUnits: "pixels",
        capRounded: true,
        jointRounded: true,
        pickable: false,
      }),
      new PathLayer<{ path: [number, number][] }>({
        id: "lp-route-core",
        data: [{ path }],
        getPath: (item) => item.path,
        getColor: [accent[0], accent[1], accent[2], 255] as [
          number,
          number,
          number,
          number,
        ],
        getWidth: 5,
        widthUnits: "pixels",
        capRounded: true,
        jointRounded: true,
        pickable: false,
      })
    );
  }

  const contextMarkers = contextMarkerSources(mapState).filter((marker) =>
    isLayerVisible(marker.layer, visible, hiddenLayers)
  );

  if (isLayerVisible("noise", visible, hiddenLayers)) {
    const noisePoints = contextMarkers.filter((marker) => marker.layer === "noise");
    if (noisePoints.length >= 1) {
      layers.push(
        new HeatmapLayer<MapMarker>({
          id: "lp-noise-heatmap",
          data: noisePoints,
          getPosition: (marker) => marker.coords,
          getWeight: heatmapWeight,
          radiusPixels: 85,
          intensity: 1.3,
          threshold: 0.04,
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

  if (isLayerVisible("air-quality", visible, hiddenLayers)) {
    const aqPoints = contextMarkers.filter((marker) => marker.layer === "air-quality");
    if (aqPoints.length >= 1) {
      layers.push(
        new HeatmapLayer<MapMarker>({
          id: "lp-aq-heatmap",
          data: aqPoints,
          getPosition: (marker) => marker.coords,
          getWeight: heatmapWeight,
          radiusPixels: 90,
          intensity: 1.2,
          threshold: 0.03,
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
        getPosition: (marker) => marker.coords,
        getRadius: (marker) =>
          markerRadius(
            marker.layer,
            marker.highlighted,
            animate ? Math.sin(pulse / 7) * 0.16 + 1 : 1
          ),
        radiusUnits: "pixels",
        getFillColor: (marker) => layerAccent(marker.layer, mapState.theme),
        getLineColor: [255, 255, 255, 180],
        getLineWidth: 1.5,
        lineWidthUnits: "pixels",
        pickable: false,
      })
    );
  }

  return layers;
}
