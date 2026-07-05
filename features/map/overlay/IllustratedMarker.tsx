"use client";

import { Marker } from "react-map-gl/mapbox";
import { motion } from "framer-motion";
import { prefersReducedMotion } from "@/lib/map-performance";
import type { MapMarker } from "@/lib/types";
import DestinationGlow from "./DestinationGlow";
import DestinationIllustration from "./DestinationIllustration";
import FloatingAnnotation from "./FloatingAnnotation";
import { overlayPalette } from "./palette";
import { pickAnnotation, resolveSceneKind } from "./types";

interface IllustratedMarkerProps {
  marker: MapMarker;
  index: number;
  order?: number;
  accentColor?: string;
  onClick?: (id: string) => void;
}

export default function IllustratedMarker({
  marker,
  index,
  order,
  accentColor,
  onClick,
}: IllustratedMarkerProps) {
  const reduced = prefersReducedMotion();
  const scene = resolveSceneKind(marker);
  const reason = pickAnnotation(marker);
  const side = index % 2 === 0 ? "right" : "left";
  const showAnnotation = Boolean(reason) || order === 1;
  const annotationText = reason ?? marker.name;

  return (
    <Marker
      longitude={marker.coords[0]}
      latitude={marker.coords[1]}
      anchor="bottom"
      style={{ zIndex: marker.highlighted ? 12 : 8 }}
    >
      <motion.button
        type="button"
        aria-label={marker.name}
        onClick={() => onClick?.(marker.id)}
        className="group relative flex cursor-pointer flex-col items-center border-0 bg-transparent p-0 outline-none"
        initial={reduced ? false : { opacity: 0, scale: 0.82, y: 16 }}
        animate={
          reduced
            ? { opacity: 1, scale: 1, y: 0 }
            : {
                opacity: 1,
                scale: [1, 1.025, 1],
                y: [0, -4, 0],
              }
        }
        exit={reduced ? undefined : { opacity: 0, scale: 0.88, y: 10 }}
        transition={{
          opacity: { duration: 0.55, delay: Math.min(index * 0.06, 0.45) },
          scale: reduced
            ? { duration: 0.4 }
            : { duration: 4.2, repeat: Infinity, ease: "easeInOut", delay: index * 0.08 },
          y: reduced
            ? { duration: 0.4 }
            : { duration: 4.8, repeat: Infinity, ease: "easeInOut", delay: index * 0.08 },
        }}
        whileHover={reduced ? undefined : { scale: 1.06, y: -6 }}
      >
        {showAnnotation ? (
          <FloatingAnnotation
            text={annotationText}
            tag={order === 1 ? "Start here" : undefined}
            side={side}
          />
        ) : null}

        {order ? (
          <span
            className="absolute -top-1 left-1/2 z-30 flex h-5 w-5 -translate-x-1/2 items-center justify-center rounded-full text-[10px] font-semibold shadow-[0_4px_12px_rgba(43,36,28,0.22)]"
            style={{
              background: accentColor ?? overlayPalette.terracotta,
              color: overlayPalette.cream,
            }}
          >
            {order}
          </span>
        ) : null}

        <DestinationGlow accentColor={accentColor} highlighted={marker.highlighted} />
        <DestinationIllustration scene={scene} highlighted={marker.highlighted} />
      </motion.button>
    </Marker>
  );
}
