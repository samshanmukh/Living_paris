"use client";

import { Marker } from "react-map-gl/mapbox";
import type { ParisFeature } from "@/lib/types";

interface MapAnnotationsProps {
  feature: ParisFeature | null;
  accentColor?: string;
}

/** Speech-style annotation for the selected POI. */
export default function MapAnnotations({ feature, accentColor = "#d9a441" }: MapAnnotationsProps) {
  if (!feature) return null;

  const [lon, lat] = feature.geometry.coordinates;

  return (
    <Marker longitude={lon} latitude={lat} anchor="bottom" offset={[0, -28]}>
      <div
        className="glass-strong max-w-[180px] rounded-2xl border px-3 py-2 shadow-lg"
        style={{ borderColor: `${accentColor}55` }}
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: accentColor }}>
          Start here
        </p>
        <p className="text-[12px] font-semibold text-[var(--ink)]">{feature.properties.name}</p>
      </div>
    </Marker>
  );
}
