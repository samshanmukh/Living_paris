"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import maplibregl, { Map as MLMap, Marker } from "maplibre-gl";
import { MapboxOverlay } from "@deck.gl/mapbox";
import type { Feature, LineString } from "geojson";
import { CONTEXT_OVERLAY_LAYERS } from "@/lib/map-layer-styles";
import type { MapState } from "@/lib/types";
import { buildDeckLayers } from "./build-deck-layers";

/**
 * Free vector basemap (CARTO Positron) — no API token required.
 * deck.gl overlay adds route glow, 3D plinths, and ambient heatmaps.
 */
const BASEMAP_STYLE =
  "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

const PARIS_CENTER: [number, number] = [2.3522, 48.8566];

const ROUTE_SOURCE = "lp-route";
const ROUTE_LAYER = "lp-route-line";
const ROUTE_CASING = "lp-route-casing";

const THEME_ROUTE_COLOR: Record<MapState["theme"], string> = {
  romantic: "#c4593a",
  rain: "#5b7a99",
  family: "#3e6b4a",
  night: "#d9a441",
  day: "#c4593a",
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

interface MapCanvasProps {
  mapState: MapState | null;
  routeGeometry: Feature<LineString> | null;
  onMarkerClick?: (id: string) => void;
}

export default function MapCanvas({
  mapState,
  routeGeometry,
  onMarkerClick,
}: MapCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);
  const overlayRef = useRef<MapboxOverlay | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const loadedRef = useRef(false);
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setPulse((value) => (value + 1) % 120);
    }, 70);
    return () => window.clearInterval(timer);
  }, []);

  const deckLayers = useMemo(() => {
    if (!mapState) return [];
    return buildDeckLayers({ mapState, routeGeometry, pulse });
  }, [mapState, routeGeometry, pulse]);

  useEffect(() => {
    overlayRef.current?.setProps({ layers: deckLayers });
  }, [deckLayers]);

  // Init map once.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: BASEMAP_STYLE,
      center: PARIS_CENTER,
      zoom: 12.5,
      pitch: 45,
      bearing: -12,
      attributionControl: { compact: true },
    });

    const overlay = new MapboxOverlay({ interleaved: true, layers: [] });
    overlayRef.current = overlay;
    map.addControl(overlay as unknown as maplibregl.IControl);

    map.on("load", () => {
      loadedRef.current = true;

      map.addSource(ROUTE_SOURCE, {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.addLayer({
        id: ROUTE_CASING,
        type: "line",
        source: ROUTE_SOURCE,
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": "#faf6ee",
          "line-width": 9,
          "line-opacity": 0.9,
        },
      });
      map.addLayer({
        id: ROUTE_LAYER,
        type: "line",
        source: ROUTE_SOURCE,
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": THEME_ROUTE_COLOR.day,
          "line-width": 4.5,
          "line-dasharray": [0, 2],
        },
      });
    });

    mapRef.current = map;
    return () => {
      markersRef.current.forEach((m) => m.remove());
      overlay.finalize();
      map.remove();
      mapRef.current = null;
      overlayRef.current = null;
      loadedRef.current = false;
    };
  }, []);

  // Sync markers + camera when mapState changes (after map load).
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapState) return;

    let cancelled = false;

    const sync = () => {
      if (cancelled) return;

      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      const stopOrder = new Map(
        mapState.routeWaypoints.map((w, i) => [`${w.lon},${w.lat}`, i + 1])
      );

      const domMarkers = mapState.markers.filter(
        (marker) => !CONTEXT_OVERLAY_LAYERS.includes(marker.layer)
      );

      domMarkers.forEach((marker, idx) => {
        const el = document.createElement("div");
        el.className = "lp-marker";
        el.dataset.layer = marker.layer;
        el.style.animationDelay = `${Math.min(idx * 35, 800)}ms`;

        if (marker.highlighted) {
          el.classList.add("lp-marker-hero");
          const order = stopOrder.get(`${marker.coords[0]},${marker.coords[1]}`);
          if (order) el.textContent = String(order);
        }

        if (onMarkerClick) {
          el.addEventListener("click", () => onMarkerClick(marker.id));
        }

        const reasons = escapeHtml(marker.reasons.slice(0, 2).join(" · "));
        const popup = new maplibregl.Popup({ offset: 18, closeButton: false }).setHTML(
          `<strong>${escapeHtml(marker.name)}</strong>${
            marker.reasons.length
              ? `<br/><span style="color:#6b6155">${reasons}</span>`
              : ""
          }`
        );

        const m = new maplibregl.Marker({ element: el })
          .setLngLat(marker.coords)
          .setPopup(popup)
          .addTo(map);
        markersRef.current.push(m);
      });

      const heroCoords = mapState.markers
        .filter((m) => m.highlighted)
        .map((m) => m.coords);

      if (heroCoords.length >= 2) {
        const bounds = heroCoords.reduce(
          (b, c) => b.extend(c),
          new maplibregl.LngLatBounds(heroCoords[0], heroCoords[0])
        );
        map.fitBounds(bounds, {
          padding: { top: 110, bottom: 330, left: 60, right: 60 },
          pitch: mapState.flyTo.pitch,
          duration: 2200,
          essential: true,
        });
      } else {
        map.flyTo({
          center: mapState.flyTo.center,
          zoom: mapState.flyTo.zoom,
          pitch: mapState.flyTo.pitch,
          duration: 2200,
          essential: true,
        });
      }
    };

    if (loadedRef.current) sync();
    else map.once("load", sync);

    return () => {
      cancelled = true;
    };
  }, [mapState, onMarkerClick]);

  // Sync route line + theme color.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const apply = () => {
      const source = map.getSource(ROUTE_SOURCE) as maplibregl.GeoJSONSource | undefined;
      if (!source) return;
      source.setData(
        routeGeometry ?? { type: "FeatureCollection", features: [] }
      );
      if (mapState) {
        map.setPaintProperty(
          ROUTE_LAYER,
          "line-color",
          THEME_ROUTE_COLOR[mapState.theme]
        );
      }
    };

    if (loadedRef.current) apply();
    else map.once("load", apply);
  }, [routeGeometry, mapState]);

  return <div ref={containerRef} className="absolute inset-0" />;
}
