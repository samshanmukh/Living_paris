"use client";

import { motion } from "framer-motion";
import { Marker } from "react-map-gl/mapbox";
import type { ParisFeature } from "@/lib/types";
import { cn } from "@/lib/utils";

interface PoiMarkerProps {
  feature: ParisFeature;
  selected: boolean;
  hovered: boolean;
  highlighted?: boolean;
  order?: number;
  accentColor?: string;
  reducedMotion?: boolean;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
}

export default function PoiMarker({
  feature,
  selected,
  hovered,
  highlighted,
  order,
  accentColor = "#d9a441",
  reducedMotion,
  onSelect,
  onHover,
}: PoiMarkerProps) {
  const [lon, lat] = feature.geometry.coordinates;
  const active = selected || hovered || highlighted;

  return (
    <Marker longitude={lon} latitude={lat} anchor="center">
      <motion.button
        type="button"
        initial={reducedMotion ? false : { opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: active ? 1.08 : 1 }}
        transition={{ type: "spring", stiffness: 420, damping: 24 }}
        onClick={() => onSelect(feature.properties.id)}
        onMouseEnter={() => onHover(feature.properties.id)}
        onMouseLeave={() => onHover(null)}
        className="group relative grid place-items-center"
        aria-label={feature.properties.name}
      >
        {(active || highlighted) && (
          <span
            className={cn(
              "absolute rounded-full border-2 opacity-70",
              !reducedMotion && "animate-[lp-pulse-ring_1.8s_ease-out_infinite]"
            )}
            style={{
              width: highlighted ? 44 : 36,
              height: highlighted ? 44 : 36,
              borderColor: `${accentColor}88`,
            }}
          />
        )}

        <div className="mb-1 max-w-[140px] translate-y-[-110%] opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
          <div className="glass rounded-xl px-2.5 py-1.5 text-left shadow-lg">
            <p className="truncate text-[11px] font-semibold text-[var(--ink)]">
              {feature.properties.name}
            </p>
            <p className="text-[10px] capitalize text-[var(--ink-soft)]">
              {feature.properties.layer.replace("-", " ")}
            </p>
          </div>
        </div>

        <span
          className={cn(
            "grid place-items-center rounded-full border-2 border-white font-bold text-white shadow-md",
            highlighted ? "h-8 w-8 text-[11px]" : "h-5 w-5 text-[9px]"
          )}
          style={{
            backgroundColor: accentColor,
            boxShadow: active ? `0 0 0 5px ${accentColor}44` : undefined,
          }}
        >
          {order ?? (highlighted ? "★" : "")}
        </span>
      </motion.button>
    </Marker>
  );
}
