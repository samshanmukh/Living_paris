"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import MapGL, { type MapRef } from "react-map-gl/mapbox";
import { LngLatBounds } from "mapbox-gl";
import type { Feature, LineString } from "geojson";
import { fetchParisWeather } from "@/lib/parisWeather";
import { isMobileViewport, prefersReducedMotion } from "@/lib/map-performance";
import { effectiveRain, useSceneStore } from "@/lib/store/useSceneStore";
import { useCityStore } from "@/lib/store/useCityStore";
import { usePrefsStore } from "@/lib/store/usePrefsStore";
import type { MapState } from "@/lib/types";
import { getMapboxPublicToken } from "@/lib/mapbox-token";
import MapAnnotations from "./MapAnnotations";
import MapControls from "./MapControls";
import { LivingParisOverlay } from "./overlay";
import { routeBadgeLabel } from "./RouteLayer";
import {
  applyStandardMapConfig,
  getStandardMapConfig,
  MAPBOX_STANDARD_STYLE,
  resolveLightPreset,
} from "./standard-style";

const MAPBOX_TOKEN = getMapboxPublicToken();
const PARIS_CENTER = { longitude: 2.3522, latitude: 48.8566 };
const PARIS_LNG_LAT: [number, number] = [2.3522, 48.8566];

interface MapCanvasProps {
  mapState?: MapState | null;
  routeGeometry?: Feature<LineString> | null;
  routeAccentColor?: string;
  snapshotCapture?: boolean;
  onCaptureReady?: (capture: () => Promise<string | null>) => void;
  onMarkerClick?: (id: string) => void;
}

export default function MapCanvas({
  mapState = null,
  routeGeometry = null,
  routeAccentColor,
  snapshotCapture = false,
  onCaptureReady,
  onMarkerClick,
}: MapCanvasProps) {
  const mapRef = useRef<MapRef>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [is3D, setIs3D] = useState(true);
  const [mobile] = useState(() => isMobileViewport());

  const { features, selectedId, route, center, rainMode, select, toggleRainMode } =
    useCityStore();

  const applyWeather = useSceneStore((state) => state.applyWeather);
  const scene = useSceneStore();
  const showRain = effectiveRain(scene) || rainMode;
  const reducedMotion =
    usePrefsStore((state) => state.reducedMotion) || prefersReducedMotion();
  const accent = routeAccentColor ?? "var(--accent, #d9a441)";

  const standardMapConfig = useMemo(
    () => ({
      basemap: {
        ...getStandardMapConfig(mapState?.theme).basemap,
        lightPreset: resolveLightPreset(mapState?.theme, scene.lightPreset),
      },
    }),
    [mapState?.theme, scene.lightPreset]
  );

  useEffect(() => {
    fetchParisWeather()
      .then(applyWeather)
      .catch(() => undefined);
  }, [applyWeather]);

  const selectedFeature = useMemo(
    () => features.find((feature) => feature.properties.id === selectedId) ?? null,
    [features, selectedId]
  );

  const handleLoad = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    setMapLoaded(true);
    applyStandardMapConfig(map, {
      theme: mapState?.theme,
      lightPreset: scene.lightPreset,
    });

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
  }, [mapState?.theme, onCaptureReady, scene.lightPreset, snapshotCapture]);

  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map || !mapLoaded) return;
    applyStandardMapConfig(map, {
      theme: mapState?.theme,
      lightPreset: scene.lightPreset,
    });
  }, [mapLoaded, mapState?.theme, scene.lightPreset]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    if (mapState) {
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
          duration: reducedMotion ? 0 : 2200,
          essential: true,
        });
        return;
      }

      map.flyTo({
        center: mapState.flyTo.center,
        zoom: mapState.flyTo.zoom,
        pitch: mapState.flyTo.pitch,
        duration: reducedMotion ? 0 : 2200,
        essential: true,
      });
      return;
    }

    if (!features.length) return;

    const coords = features.map((feature) => feature.geometry.coordinates as [number, number]);
    if (coords.length >= 2) {
      const bounds = coords.reduce(
        (bound, coord) => bound.extend(coord),
        new LngLatBounds(coords[0], coords[0])
      );
      map.fitBounds(bounds, {
        padding: { top: 210, bottom: 330, left: 70, right: 70 },
        pitch: is3D ? 52 : 0,
        duration: reducedMotion ? 0 : 1800,
        essential: true,
      });
      return;
    }

    map.flyTo({
      center,
      zoom: 14.5,
      pitch: is3D ? 52 : 0,
      duration: reducedMotion ? 0 : 1600,
      essential: true,
    });
  }, [center, features, is3D, mapLoaded, mapState, reducedMotion]);

  const recenter = useCallback(() => {
    mapRef.current?.flyTo({
      center: PARIS_LNG_LAT,
      zoom: mobile ? 14.2 : 14.6,
      pitch: is3D ? 48 : 0,
      bearing: -18,
      duration: 1200,
    });
  }, [is3D, mobile]);

  const toggle3D = useCallback(() => {
    setIs3D((value) => {
      const next = !value;
      mapRef.current?.easeTo({ pitch: next ? 52 : 0, duration: 700 });
      return next;
    });
  }, []);

  const handleMarkerClick = useCallback(
    (id: string) => {
      select(id);
      onMarkerClick?.(id);
    },
    [onMarkerClick, select]
  );

  const badge = routeBadgeLabel(route);

  if (!MAPBOX_TOKEN) {
    return (
      <div className="absolute inset-0 z-0 grid place-items-center bg-[var(--paper,#efe9df)] px-8 text-center">
        <p className="text-sm text-[var(--ink-soft)]">
          Set{" "}
          <code className="font-semibold">NEXT_PUBLIC_MAPBOX_TOKEN</code> or{" "}
          <code className="font-semibold">VITE_MAPBOX_TOKEN</code> in{" "}
          <code className="font-semibold">.env.local</code> to load the map.
        </p>
      </div>
    );
  }

  return (
    <div
      className="absolute inset-0 z-0"
      style={{ ["--accent" as string]: accent } as CSSProperties}
    >
      <MapGL
        ref={mapRef}
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={{
          ...PARIS_CENTER,
          zoom: mobile ? 14.2 : 14.6,
          pitch: is3D ? 48 : 0,
          bearing: -18,
        }}
        mapStyle={MAPBOX_STANDARD_STYLE}
        config={standardMapConfig}
        preserveDrawingBuffer={snapshotCapture}
        antialias={!mobile}
        attributionControl={false}
        onLoad={handleLoad}
        style={{ width: "100%", height: "100%" }}
      >
        <LivingParisOverlay
          mapState={mapState}
          routeGeometry={routeGeometry}
          routeAccentColor={routeAccentColor}
          onMarkerClick={handleMarkerClick}
        />

        <MapAnnotations feature={selectedFeature} accentColor={accent} />
      </MapGL>

      {showRain && <div className="lp-rain-overlay pointer-events-none absolute inset-0 z-10" />}
      {scene.snowing && !showRain && (
        <div className="lp-snow-overlay pointer-events-none absolute inset-0 z-10" />
      )}

      {badge && (
        <div className="pointer-events-none absolute bottom-[28%] left-1/2 z-20 -translate-x-1/2">
          <div className="glass-strong rounded-full px-3 py-1 text-[11px] font-semibold text-[var(--ink)] shadow-lg">
            {badge}
          </div>
        </div>
      )}

      <MapControls
        mapRef={mapRef}
        rainMode={rainMode}
        is3D={is3D}
        onToggleRain={toggleRainMode}
        onToggle3D={toggle3D}
        onRecenter={recenter}
      />
    </div>
  );
}
