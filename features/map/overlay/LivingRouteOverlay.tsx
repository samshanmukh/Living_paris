"use client";

import { useEffect, useId, useMemo, useState } from "react";
import type { Feature, LineString } from "geojson";
import { AnimatePresence, motion } from "framer-motion";
import { useMap } from "react-map-gl/mapbox";
import { prefersReducedMotion } from "@/lib/map-performance";
import { overlayPalette } from "./palette";

interface LivingRouteOverlayProps {
  routeGeometry: Feature<LineString> | null;
  accentColor?: string;
  experienceKey: string;
}

function buildPath(points: [number, number][]): string {
  return points
    .map(([x, y], index) => `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`)
    .join(" ");
}

export default function LivingRouteOverlay({
  routeGeometry,
  accentColor,
  experienceKey,
}: LivingRouteOverlayProps) {
  const { current: mapRef } = useMap();
  const uid = useId().replace(/:/g, "");
  const reduced = prefersReducedMotion();
  const accent = accentColor ?? overlayPalette.amber;

  const coordinates = useMemo(
    () => routeGeometry?.geometry?.coordinates ?? [],
    [routeGeometry]
  );

  const [points, setPoints] = useState<[number, number][]>([]);
  const [pathLength, setPathLength] = useState(0);

  useEffect(() => {
    const map = mapRef?.getMap();
    if (!map || coordinates.length < 2) {
      setPoints([]);
      setPathLength(0);
      return;
    }

    const project = () => {
      setPoints(
        coordinates.map(([lng, lat]) => {
          const projected = map.project([lng, lat]);
          return [projected.x, projected.y] as [number, number];
        })
      );
    };

    project();
    map.on("move", project);
    map.on("resize", project);
    return () => {
      map.off("move", project);
      map.off("resize", project);
    };
  }, [mapRef, coordinates]);

  const pathD = useMemo(() => buildPath(points), [points]);
  const visible = points.length > 1 && pathD.length > 0;

  useEffect(() => {
    if (!visible) {
      setPathLength(0);
      return;
    }
    const pathEl = document.getElementById(`lp-route-path-${uid}`) as SVGPathElement | null;
    setPathLength(pathEl?.getTotalLength() ?? 0);
  }, [pathD, uid, visible]);

  return (
    <div className="pointer-events-none absolute inset-0 z-[1] overflow-hidden">
      <AnimatePresence mode="wait">
        {visible ? (
          <motion.svg
            key={experienceKey}
            className="h-full w-full"
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduced ? undefined : { opacity: 0 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            aria-hidden
          >
            <defs>
              <filter id={`lp-route-bloom-${uid}`} x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <radialGradient id={`lp-route-light-${uid}`} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={accent} stopOpacity="0.95" />
                <stop offset="55%" stopColor={accent} stopOpacity="0.35" />
                <stop offset="100%" stopColor={accent} stopOpacity="0" />
              </radialGradient>
            </defs>

            <path
              d={pathD}
              fill="none"
              stroke={accent}
              strokeWidth={16}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.18}
              filter={`url(#lp-route-bloom-${uid})`}
            />

            <path
              id={`lp-route-path-${uid}`}
              d={pathD}
              fill="none"
              stroke={accent}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="2 9"
              opacity={0.82}
            />

            {!reduced && pathLength > 0 ? (
              <>
                <path
                  d={pathD}
                  fill="none"
                  stroke={overlayPalette.amberGlow}
                  strokeWidth={4}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray={`${Math.max(pathLength * 0.08, 12)} ${Math.max(pathLength, 24)}`}
                  opacity={0.75}
                >
                  <animate
                    attributeName="stroke-dashoffset"
                    from={String(pathLength)}
                    to="0"
                    dur="5.5s"
                    repeatCount="indefinite"
                  />
                </path>

                <circle r="5" fill={`url(#lp-route-light-${uid})`} opacity={0.95}>
                  <animateMotion dur="5.5s" repeatCount="indefinite" path={pathD} />
                </circle>
              </>
            ) : null}
          </motion.svg>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
