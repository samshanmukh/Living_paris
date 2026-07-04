"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import { MapboxOverlay } from "@deck.gl/mapbox";
import {
  ArcLayer,
  ColumnLayer,
  PathLayer,
  PolygonLayer,
  ScatterplotLayer,
  TextLayer
} from "@deck.gl/layers";
import type { Layer } from "@deck.gl/core";
import type { ParisFeature } from "@/lib/types";
import {
  colorForSenseKind,
  makeCircle,
  makeSector,
  sceneById,
  sceneMapStateById,
  senseNodes,
  type Coordinate,
  type RiskZone,
  type SceneId,
  type SenseNode,
  type Venue
} from "@/lib/parisVisualizationData";

const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

export type VisibleMapLayers = {
  route: boolean;
  places: boolean;
  risk: boolean;
  senses: boolean;
};

type ParisMapCanvasProps = {
  sceneId: SceneId;
  visibleLayers: VisibleMapLayers;
  backendFeatures?: ParisFeature[];
  queryCenter?: Coordinate;
  queryRadiusMeters?: number;
  routePathOverride?: Coordinate[];
  selectedFeatureId?: string | null;
  selectedVenueId?: string | null;
  onFeatureSelect?: (featureId: string) => void;
  onReadyChange?: (ready: boolean) => void;
};

export function ParisMapCanvas({
  backendFeatures = [],
  onFeatureSelect,
  queryCenter,
  queryRadiusMeters,
  routePathOverride,
  sceneId,
  selectedFeatureId,
  visibleLayers,
  selectedVenueId,
  onReadyChange
}: ParisMapCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const overlayRef = useRef<MapboxOverlay | null>(null);
  const initialSceneRef = useRef(sceneById(sceneId));
  const [pulse, setPulse] = useState(0);

  const scene = sceneById(sceneId);
  const mapState = sceneMapStateById(sceneId);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const initialScene = initialSceneRef.current;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: initialScene.center,
      zoom: initialScene.zoom,
      pitch: initialScene.pitch,
      bearing: initialScene.bearing,
      attributionControl: false
    });

    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");

    const overlay = new MapboxOverlay({ interleaved: true, layers: [] });
    overlayRef.current = overlay;
    map.addControl(overlay as unknown as maplibregl.IControl);

    map.on("load", () => {
      addBuildingExtrusions(map);
      onReadyChange?.(true);
    });

    return () => {
      onReadyChange?.(false);
      overlay.finalize();
      map.remove();
      overlayRef.current = null;
      mapRef.current = null;
    };
  }, [onReadyChange]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setPulse((value) => (value + 1) % 120);
    }, 70);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    mapRef.current?.easeTo({
      center: scene.center,
      zoom: scene.zoom,
      pitch: scene.pitch,
      bearing: scene.bearing,
      duration: 1250,
      easing: (t) => t * (2 - t)
    });
  }, [scene]);

  const deckLayers = useMemo(
    () =>
      buildMapLayers({
        accent: scene.accent,
        backendFeatures,
        onFeatureSelect,
        pulse,
        queryCenter,
        queryRadiusMeters,
        routePath: routePathOverride?.length ? routePathOverride : mapState.routePath,
        riskZones: mapState.riskZones,
        selectedFeatureId,
        selectedVenueId,
        venues: mapState.venues,
        visibleLayers
      }),
    [
      backendFeatures,
      mapState.riskZones,
      mapState.routePath,
      onFeatureSelect,
      mapState.venues,
      pulse,
      queryCenter,
      queryRadiusMeters,
      routePathOverride,
      scene.accent,
      selectedFeatureId,
      selectedVenueId,
      visibleLayers
    ]
  );

  useEffect(() => {
    overlayRef.current?.setProps({ layers: deckLayers });
  }, [deckLayers]);

  return (
    <div className="team-map-wrap" aria-label="Interactive 3D Paris map">
      <div ref={containerRef} className="team-map-canvas" />
      <div className="team-map-grade" />
      <div className="team-map-grid" />
    </div>
  );
}

function buildMapLayers({
  accent,
  backendFeatures,
  onFeatureSelect,
  pulse,
  queryCenter,
  queryRadiusMeters,
  routePath,
  riskZones,
  selectedFeatureId,
  selectedVenueId,
  venues,
  visibleLayers
}: {
  accent: [number, number, number];
  backendFeatures: ParisFeature[];
  onFeatureSelect?: (featureId: string) => void;
  pulse: number;
  queryCenter?: Coordinate;
  queryRadiusMeters?: number;
  routePath: Coordinate[];
  riskZones: RiskZone[];
  selectedFeatureId?: string | null;
  selectedVenueId?: string | null;
  venues: Venue[];
  visibleLayers: VisibleMapLayers;
}): Layer[] {
  const pulseScale = 1 + Math.sin(pulse / 7) * 0.16;
  const layers: Layer[] = [];
  const queryZones =
    queryCenter && queryRadiusMeters
      ? [
          ...riskZones,
          {
            id: "backend-query-radius",
            label: "Backend query radius",
            coordinate: queryCenter,
            radiusMeters: queryRadiusMeters,
            color: [108, 229, 255, 28] as [number, number, number, number]
          }
        ]
      : riskZones;

  if (visibleLayers.risk) {
    layers.push(
      new PolygonLayer<RiskZone>({
        id: "team-risk-fields",
        data: queryZones,
        getPolygon: (zone) => makeCircle(zone.coordinate, zone.radiusMeters),
        getFillColor: (zone) => zone.color,
        getLineColor: (zone) => [zone.color[0], zone.color[1], zone.color[2], 155],
        getLineWidth: 2,
        lineWidthUnits: "pixels",
        filled: true,
        stroked: true,
        pickable: false
      })
    );
  }

  if (visibleLayers.route && routePath.length > 1) {
    layers.push(
      new PathLayer<{ path: Coordinate[] }>({
        id: "team-route-glow",
        data: [{ path: routePath }],
        getPath: (item) => item.path,
        getColor: [108, 229, 255, 150],
        getWidth: 22 * pulseScale,
        widthUnits: "pixels",
        capRounded: true,
        jointRounded: true,
        pickable: false
      }),
      new PathLayer<{ path: Coordinate[] }>({
        id: "team-route-core",
        data: [{ path: routePath }],
        getPath: (item) => item.path,
        getColor: [255, 255, 255, 245],
        getWidth: 5,
        widthUnits: "pixels",
        capRounded: true,
        jointRounded: true,
        pickable: false
      })
    );
  }

  if (visibleLayers.senses) {
    layers.push(
      new PolygonLayer<SenseNode>({
        id: "team-sense-cones",
        data: senseNodes.filter((node) => node.kind === "vision" || node.kind === "route"),
        getPolygon: (node) => makeSector(node.coordinate, node.bearing, 170, 42),
        getFillColor: (node) => [...colorForSenseKind(node.kind), 34],
        getLineColor: (node) => [...colorForSenseKind(node.kind), 90],
        getLineWidth: 1,
        lineWidthUnits: "pixels",
        filled: true,
        stroked: true,
        pickable: false
      }),
      new ArcLayer<SenseNode>({
        id: "team-sense-links",
        data: senseNodes.slice(0, 14),
        getSourcePosition: (node) => node.coordinate,
        getTargetPosition: () => routePath[0] ?? [2.3522, 48.8566],
        getSourceColor: (node) => [...colorForSenseKind(node.kind), 120],
        getTargetColor: [255, 255, 255, 40],
        getWidth: 1.2,
        greatCircle: false,
        pickable: false
      }),
      new ScatterplotLayer<SenseNode>({
        id: "team-sense-nodes",
        data: senseNodes.slice(0, 18),
        getPosition: (node) => node.coordinate,
        getRadius: (node) => (6 + node.confidence * 8) * pulseScale,
        radiusUnits: "pixels",
        getFillColor: (node) => [...colorForSenseKind(node.kind), 205],
        getLineColor: [255, 255, 255, 210],
        getLineWidth: 1.5,
        lineWidthUnits: "pixels",
        pickable: false
      })
    );
  }

  if (visibleLayers.places) {
    if (backendFeatures.length) {
      layers.push(
        new PolygonLayer<ParisFeature>({
          id: "backend-feature-halos",
          data: backendFeatures,
          getPolygon: (feature) =>
            makeCircle(
              featurePosition(feature),
              feature.properties.id === selectedFeatureId ? 58 : 34,
              44
            ),
          getFillColor: (feature) =>
            withAlpha(
              featureColor(feature, feature.properties.id === selectedFeatureId, accent),
              feature.properties.id === selectedFeatureId ? 82 : 38
            ),
          getLineColor: (feature) =>
            withAlpha(
              featureColor(feature, feature.properties.id === selectedFeatureId, accent),
              feature.properties.id === selectedFeatureId ? 230 : 132
            ),
          getLineWidth: (feature) => (feature.properties.id === selectedFeatureId ? 2.4 : 1.2),
          lineWidthUnits: "pixels",
          filled: true,
          stroked: true,
          pickable: true,
          onClick: ({ object }) => {
            if (!object) return false;
            onFeatureSelect?.(object.properties.id);
            return true;
          }
        }),
        new PolygonLayer<ParisFeature>({
          id: "backend-feature-pulse-rings",
          data: backendFeatures.slice(0, 16),
          getPolygon: (feature) =>
            makeCircle(
              featurePosition(feature),
              (feature.properties.id === selectedFeatureId ? 76 : 46) * pulseScale,
              52
            ),
          getFillColor: [0, 0, 0, 0],
          getLineColor: (feature) =>
            withAlpha(
              featureColor(feature, feature.properties.id === selectedFeatureId, accent),
              feature.properties.id === selectedFeatureId ? 178 : 78
            ),
          getLineWidth: (feature) => (feature.properties.id === selectedFeatureId ? 2 : 1),
          lineWidthUnits: "pixels",
          filled: false,
          stroked: true,
          pickable: false
        }),
        new ColumnLayer<ParisFeature>({
          id: "backend-feature-plinths",
          data: backendFeatures.slice(0, 24),
          diskResolution: 4,
          angle: 45,
          radius: 18,
          coverage: 0.74,
          getPosition: featurePosition,
          getElevation: (feature) =>
            feature.properties.id === selectedFeatureId
              ? 78
              : 34 + Math.min(feature.properties.scoreHint ?? 8, 10) * 2.2,
          getFillColor: (feature) =>
            withAlpha(
              featureColor(feature, feature.properties.id === selectedFeatureId, accent),
              feature.properties.id === selectedFeatureId ? 228 : 174
            ),
          getLineColor: [255, 255, 255, 190],
          getLineWidth: 0.8,
          lineWidthUnits: "pixels",
          material: {
            ambient: 0.35,
            diffuse: 0.58,
            shininess: 28,
            specularColor: [255, 255, 255]
          },
          pickable: true,
          onClick: ({ object }) => {
            if (!object) return false;
            onFeatureSelect?.(object.properties.id);
            return true;
          }
        }),
        new ScatterplotLayer<ParisFeature>({
          id: "backend-feature-points",
          data: backendFeatures,
          getPosition: featurePosition,
          getRadius: (feature) =>
            feature.properties.id === selectedFeatureId ? 32 * pulseScale : 13,
          radiusUnits: "pixels",
          getFillColor: (feature) => featureColor(feature, feature.properties.id === selectedFeatureId, accent),
          getLineColor: [255, 255, 255, 235],
          getLineWidth: 2,
          lineWidthUnits: "pixels",
          pickable: true,
          onClick: ({ object }) => {
            if (!object) return false;
            onFeatureSelect?.(object.properties.id);
            return true;
          }
        }),
        new TextLayer<ParisFeature>({
          id: "backend-feature-labels",
          data: backendFeatures.slice(0, 10),
          getPosition: featurePosition,
          getText: (feature) => feature.properties.name,
          getColor: [247, 243, 234, 235],
          getSize: 11,
          getPixelOffset: [0, 31],
          getTextAnchor: "middle",
          getAlignmentBaseline: "top",
          billboard: true,
          background: true,
          getBackgroundColor: [8, 10, 15, 190],
          backgroundPadding: [6, 4],
          pickable: false
        })
      );
    }

    layers.push(
      new PolygonLayer<Venue>({
        id: "team-venue-halos",
        data: backendFeatures.length ? [] : venues,
        getPolygon: (venue) => makeCircle(venue.coordinate, venue.id === selectedVenueId ? 58 : 36, 44),
        getFillColor: (venue) => [
          accent[0],
          accent[1],
          accent[2],
          venue.id === selectedVenueId ? 80 : 38
        ],
        getLineColor: (venue) =>
          venue.id === selectedVenueId
            ? [accent[0], accent[1], accent[2], 230]
            : [255, 255, 255, 120],
        getLineWidth: (venue) => (venue.id === selectedVenueId ? 2.2 : 1.1),
        lineWidthUnits: "pixels",
        filled: true,
        stroked: true,
        pickable: false
      }),
      new ColumnLayer<Venue>({
        id: "team-venue-plinths",
        data: backendFeatures.length ? [] : venues,
        diskResolution: 4,
        angle: 45,
        radius: 18,
        coverage: 0.74,
        getPosition: (venue) => venue.coordinate,
        getElevation: (venue) => (venue.id === selectedVenueId ? 72 : 32 + venue.score * 0.32),
        getFillColor: (venue) => [
          accent[0],
          accent[1],
          accent[2],
          venue.id === selectedVenueId ? 226 : 164
        ],
        getLineColor: [255, 255, 255, 180],
        getLineWidth: 0.8,
        lineWidthUnits: "pixels",
        material: {
          ambient: 0.35,
          diffuse: 0.58,
          shininess: 28,
          specularColor: [255, 255, 255]
        },
        pickable: false
      }),
      new ScatterplotLayer<Venue>({
        id: "team-venue-points",
        data: backendFeatures.length ? [] : venues,
        getPosition: (venue) => venue.coordinate,
        getRadius: (venue) =>
          venue.id === selectedVenueId ? 30 * pulseScale : 14 + venue.score / 6,
        radiusUnits: "pixels",
        getFillColor: (venue) => (venue.indoor ? [108, 229, 255, 235] : [255, 195, 92, 235]),
        getLineColor: [255, 255, 255, 245],
        getLineWidth: 3,
        lineWidthUnits: "pixels",
        pickable: false
      }),
      new TextLayer<Venue>({
        id: "team-venue-labels",
        data: backendFeatures.length ? [] : venues,
        getPosition: (venue) => venue.coordinate,
        getText: (venue) => `${venue.rank ?? ""}. ${venue.name}`,
        getColor: [247, 243, 234, 230],
        getSize: 12,
        getPixelOffset: [0, 34],
        getTextAnchor: "middle",
        getAlignmentBaseline: "top",
        billboard: true,
        background: true,
        getBackgroundColor: [8, 10, 15, 185],
        backgroundPadding: [7, 4],
        pickable: false
      })
    );
  }

  return layers;
}

function featureColor(
  feature: ParisFeature,
  isSelected: boolean,
  accent: [number, number, number]
): [number, number, number, number] {
  if (isSelected) return [accent[0], accent[1], accent[2], 245];

  switch (feature.properties.layer) {
    case "cafes":
      return [255, 195, 92, 220];
    case "museums":
      return [168, 139, 255, 220];
    case "parks":
    case "trees":
      return [97, 240, 162, 220];
    case "metro":
    case "bikes":
      return [108, 229, 255, 220];
    case "accessibility":
      return [255, 255, 255, 230];
    case "noise":
      return [255, 106, 169, 220];
    case "air-quality":
      return [130, 215, 255, 220];
    default:
      return [accent[0], accent[1], accent[2], 210];
  }
}

function withAlpha(
  color: [number, number, number, number],
  alpha: number
): [number, number, number, number] {
  return [color[0], color[1], color[2], alpha];
}

function featurePosition(feature: ParisFeature): Coordinate {
  const [lon, lat] = feature.geometry.coordinates;
  return [lon, lat];
}

function addBuildingExtrusions(map: maplibregl.Map) {
  if (map.getLayer("living-paris-buildings")) return;

  const firstSymbol = map
    .getStyle()
    .layers?.find((layer) => layer.type === "symbol" && layer.layout?.["text-field"])?.id;

  try {
    map.addLayer(
      {
        id: "living-paris-buildings",
        type: "fill-extrusion",
        source: "openmaptiles",
        "source-layer": "building",
        minzoom: 13,
        paint: {
          "fill-extrusion-color": [
            "interpolate",
            ["linear"],
            ["coalesce", ["get", "render_height"], ["get", "height"], 10],
            0,
            "#11151d",
            40,
            "#273244",
            120,
            "#51657d"
          ],
          "fill-extrusion-height": ["coalesce", ["get", "render_height"], ["get", "height"], 8],
          "fill-extrusion-base": ["coalesce", ["get", "render_min_height"], 0],
          "fill-extrusion-opacity": 0.68,
          "fill-extrusion-vertical-gradient": true
        }
      },
      firstSymbol
    );
  } catch {
    // OpenFreeMap style variants can use different source names; overlays still render.
  }
}
