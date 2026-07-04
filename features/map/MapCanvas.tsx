"use client";

import { useEffect, useRef } from "react";
import maplibregl, { Map as MLMap, Marker } from "maplibre-gl";
import type { Feature, LineString } from "geojson";
import type { MapState } from "@/lib/types";

/**
 * Free vector basemap (CARTO Positron) — no API token required.
 * Member 2 (Maps) can swap this for a custom Mapbox style later; the
 * component contract (mapState in, rendered city out) stays the same.
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
  const markersRef = useRef<Marker[]>([]);
  const loadedRef = useRef(false);

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
      map.remove();
      mapRef.current = null;
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

      mapState.markers.forEach((marker, idx) => {
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

      // Camera: fit itinerary stops when there are 2+, otherwise flyTo.
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
