"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import MapGL, { useControl, type MapRef } from "react-map-gl/mapbox";
import { LngLatBounds } from "mapbox-gl";
import { MapboxOverlay } from "@deck.gl/mapbox";
import type { Layer } from "@deck.gl/core";
import type { Feature, LineString } from "geojson";
import { CONTEXT_OVERLAY_LAYERS } from "@/lib/map-layer-styles";
import { isMobileViewport, prefersReducedMotion } from "@/lib/map-performance";
import type { LayerType, MapState } from "@/lib/types";
import { buildDeckLayers } from "./build-deck-layers";
import { LivingParisOverlay } from "./overlay";
import { addToyBuildings, applyToyCityStyle } from "./toy-city-style";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const PARIS_CENTER = { longitude: 2.3522, latitude: 48.8566 };
const PULSE_INTERVAL_MS = 200;

interface MapCanvasProps {
  mapState: MapState | null;
  routeGeometry: Feature<LineString> | null;
  hiddenLayers?: Set<LayerType>;
  routeAccentColor?: string;
  onMarkerClick?: (id: string) => void;
  /** Only enable when dev snapshot capture is active — preserveDrawingBuffer is costly. */
  snapshotCapture?: boolean;
  onCaptureReady?: (capture: () => Promise<string | null>) => void;
}

/** Mounts the deck.gl canvas inside react-map-gl with zero conflict. */
function DeckGLOverlay({ layers }: { layers: Layer[] }) {
  const overlay = useControl<MapboxOverlay>(
    () => new MapboxOverlay({ interleaved: true, layers: [] })
  );
  overlay.setProps({ layers });
  return null;
}

function routeNeedsPulse(
  mapState: MapState | null,
  routeGeometry: Feature<LineString> | null
): boolean {
  if (!mapState) return false;
  if (routeGeometry?.geometry?.coordinates?.length) return true;
  return mapState.markers.some(
    (marker) =>
      CONTEXT_OVERLAY_LAYERS.includes(marker.layer) &&
      mapState.visibleLayers.includes(marker.layer)
  );
}

export default function MapCanvas({
  mapState,
  routeGeometry,
  hiddenLayers,
  routeAccentColor,
  onMarkerClick,
  snapshotCapture = false,
  onCaptureReady,
}: MapCanvasProps) {
  const mapRef = useRef<MapRef>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [pulse, setPulse] = useState(0);
  const [mobile] = useState(() => isMobileViewport());
  const animateDeck = routeNeedsPulse(mapState, routeGeometry);

  useEffect(() => {
    if (!animateDeck || prefersReducedMotion()) return;

    const tick = () => {
      if (document.hidden) return;
      setPulse((value) => (value + 1) % 120);
    };

    const timer = window.setInterval(tick, PULSE_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [animateDeck]);

  const routeAccentRgb = useMemo<[number, number, number] | undefined>(() => {
    if (!routeAccentColor) return undefined;
    const hex = routeAccentColor.replace("#", "");
    if (hex.length !== 6) return undefined;
    return [
      parseInt(hex.slice(0, 2), 16),
      parseInt(hex.slice(2, 4), 16),
      parseInt(hex.slice(4, 6), 16),
    ];
  }, [routeAccentColor]);

  const deckLayers = useMemo(() => {
    if (!mapState) return [];
    return buildDeckLayers({
      mapState,
      routeGeometry,
      pulse: animateDeck ? pulse : 0,
      hiddenLayers,
      routeAccentRgb,
      animate: animateDeck && !prefersReducedMotion(),
    }).filter((layer) => layer.id !== "lp-route-glow" && layer.id !== "lp-route-core");
  }, [mapState, routeGeometry, pulse, hiddenLayers, routeAccentRgb, animateDeck]);

  const handleLoad = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    setMapLoaded(true);
    applyToyCityStyle(map);
    addToyBuildings(map, { lite: mobile });

    if (!prefersReducedMotion()) {
      map.easeTo({
        bearing: 8,
        pitch: mobile ? 42 : 50,
        duration: mobile ? 2500 : 4000,
        easing: (t) => t,
      });
    }

    if (snapshotCapture) {
      onCaptureReady?.(
        () =>
          new Promise<string | null>((resolve) => {
            map.once("render", () => {
              try {
                resolve(map.getCanvas().toDataURL("image/jpeg", 0.82));
              } catch {
                resolve(null);
              }
            });
            map.triggerRepaint();
          })
      );
    }
  }, [mobile, onCaptureReady, snapshotCapture]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapState || !mapLoaded) return;

    const heroCoords = mapState.markers
      .filter((marker) => marker.highlighted)
      .map((marker) => marker.coords);

    if (heroCoords.length >= 2) {
      const bounds = heroCoords.reduce(
        (bound, coord) => bound.extend(coord),
        new LngLatBounds(heroCoords[0], heroCoords[0])
      );
      map.fitBounds(bounds, {
        padding: { top: 210, bottom: 330, left: 70, right: 70 },
        pitch: mapState.flyTo.pitch,
        duration: prefersReducedMotion() ? 0 : 2200,
        essential: true,
      });
    } else {
      map.flyTo({
        center: mapState.flyTo.center,
        zoom: mapState.flyTo.zoom,
        pitch: mapState.flyTo.pitch,
        duration: prefersReducedMotion() ? 0 : 2200,
        essential: true,
      });
    }
  }, [mapState, mapLoaded]);

  if (!MAPBOX_TOKEN) {
    return (
      <div className="absolute inset-0 z-0 grid place-items-center bg-[#efe9df] px-8 text-center">
        <p className="text-sm text-[#8a7d6b]">
          Set <code className="font-semibold">NEXT_PUBLIC_MAPBOX_TOKEN</code> in{" "}
          <code className="font-semibold">.env.local</code> to load the map.
        </p>
      </div>
    );
  }

  return (
    <div
      className="absolute inset-0 z-0"
      style={
        routeAccentColor
          ? ({ ["--lp-accent"]: routeAccentColor } as CSSProperties)
          : undefined
      }
    >
      <MapGL
        ref={mapRef}
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={{
          ...PARIS_CENTER,
          zoom: mobile ? 14.2 : 14.6,
          pitch: mobile ? 42 : 48,
          bearing: -18,
        }}
        mapStyle="mapbox://styles/mapbox/light-v11"
        preserveDrawingBuffer={snapshotCapture}
        antialias={!mobile}
        attributionControl={false}
        onLoad={handleLoad}
        style={{ width: "100%", height: "100%" }}
      >
        {deckLayers.length > 0 ? <DeckGLOverlay layers={deckLayers} /> : null}

        <LivingParisOverlay
          mapState={mapState}
          routeGeometry={routeGeometry}
          routeAccentColor={routeAccentColor}
          onMarkerClick={onMarkerClick}
        />
      </MapGL>
    </div>
  );
}
