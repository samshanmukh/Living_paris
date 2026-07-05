"use client";

import type { CSSProperties } from "react";

interface MapSnapshotLayerProps {
  src: string;
  accentColor?: string;
}

/** Frozen map image for UI dev — skips MapLibre tile loading on reload. */
export default function MapSnapshotLayer({ src, accentColor }: MapSnapshotLayerProps) {
  return (
    <div
      className="absolute inset-0 z-0 overflow-hidden"
      style={accentColor ? ({ ["--lp-accent"]: accentColor } as CSSProperties) : undefined}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        aria-hidden
        className="h-full w-full object-cover"
        draggable={false}
      />
    </div>
  );
}
