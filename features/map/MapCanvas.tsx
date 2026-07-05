"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import maplibregl, { Map as MLMap, Marker } from "maplibre-gl";
import { MapboxOverlay } from "@deck.gl/mapbox";
import type { Feature, LineString } from "geojson";
import { CONTEXT_OVERLAY_LAYERS } from "@/lib/map-layer-styles";
import type { LayerType, MapState } from "@/lib/types";
import { addBuildingExtrusions } from "./building-extrusions";
import { buildDeckLayers } from "./build-deck-layers";

const BASEMAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";
const PARIS_CENTER: [number, number] = [2.3522, 48.8566];

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
  hiddenLayers?: Set<LayerType>;
  routeAccentColor?: string;
  onMarkerClick?: (id: string) => void;
}

export default function MapCanvas({
  mapState,
  routeGeometry,
  hiddenLayers,
  routeAccentColor,
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
      pulse,
      hiddenLayers,
      routeAccentRgb,
    });
  }, [mapState, routeGeometry, pulse, hiddenLayers, routeAccentRgb]);

  useEffect(() => {
    overlayRef.current?.setProps({ layers: deckLayers });
  }, [deckLayers]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: BASEMAP_STYLE,
      center: PARIS_CENTER,
      zoom: 12.5,
      pitch: 48,
      bearing: -12,
      attributionControl: { compact: true },
    });

    const overlay = new MapboxOverlay({ interleaved: true, layers: [] });
    overlayRef.current = overlay;
    map.addControl(overlay as unknown as maplibregl.IControl);

    map.on("load", () => {
      loadedRef.current = true;
      addBuildingExtrusions(map);
    });

    mapRef.current = map;
    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      overlay.finalize();
      map.remove();
      mapRef.current = null;
      overlayRef.current = null;
      loadedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapState) return;

    let cancelled = false;

    const sync = () => {
      if (cancelled) return;

      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];

      const stopOrder = new Map(
        mapState.routeWaypoints.map((waypoint, index) => [
          `${waypoint.lon},${waypoint.lat}`,
          index + 1,
        ])
      );

      const domMarkers = mapState.markers.filter(
        (marker) => !CONTEXT_OVERLAY_LAYERS.includes(marker.layer)
      );

      domMarkers.forEach((marker, index) => {
        const el = document.createElement("div");
        el.className = "lp-marker";
        el.dataset.layer = marker.layer;
        el.style.animationDelay = `${Math.min(index * 35, 800)}ms`;

        if (marker.highlighted) {
          el.classList.add("lp-marker-hero");
          if (routeAccentColor) {
            el.style.background = routeAccentColor;
            el.style.boxShadow = `0 0 0 6px ${routeAccentColor}44`;
          }
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

        const mapMarker = new maplibregl.Marker({ element: el })
          .setLngLat(marker.coords)
          .setPopup(popup)
          .addTo(map);
        markersRef.current.push(mapMarker);
      });

      const heroCoords = mapState.markers
        .filter((marker) => marker.highlighted)
        .map((marker) => marker.coords);

      if (heroCoords.length >= 2) {
        const bounds = heroCoords.reduce(
          (bound, coord) => bound.extend(coord),
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
  }, [mapState, onMarkerClick, routeAccentColor]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0"
      style={
        routeAccentColor
          ? ({ ["--lp-accent"]: routeAccentColor } as CSSProperties)
          : undefined
      }
    />
  );
}
