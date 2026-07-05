"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { DemoBundle } from "@/lib/demo-bundles";
import { motionTransition } from "@/lib/motion-presets";
import { cn } from "@/lib/utils";
import { DioramaScene } from "./DioramaScenes";

interface DioramaStageProps {
  bundle: DemoBundle | null;
  routeAccentColor?: string;
  onMarkerClick?: (id: string) => void;
}

export default function DioramaStage({
  bundle,
  routeAccentColor,
  onMarkerClick,
}: DioramaStageProps) {
  const reducedMotion = useReducedMotion() ?? false;
  const accent = routeAccentColor ?? bundle?.accentColor ?? "#d9a441";

  if (!bundle) {
    return (
      <div className="absolute inset-0 z-0 grid place-items-center bg-[#efe9df]">
        <p className="font-display text-sm text-[#8a7d6b]">
          Pick a scenario below — Paris comes to life
        </p>
      </div>
    );
  }

  return (
    <div
      className="absolute inset-0 z-0 overflow-hidden bg-[#1a1a1a]"
      style={{ ["--lp-accent" as string]: accent }}
    >
      {/* Vignette backdrop */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,transparent_0%,rgba(30,25,20,0.35)_100%)]" />

      {/* Floating platform frame */}
      <div className="absolute inset-x-[6%] top-[8%] bottom-[22%] sm:inset-x-[10%] sm:top-[6%] sm:bottom-[24%]">
        <div className="relative h-full w-full overflow-hidden rounded-[28px] shadow-[0_24px_60px_-20px_rgba(40,30,20,0.55)] ring-1 ring-white/20">
          <DioramaScene sceneId={bundle.sceneId} />

          {/* Route + markers overlay */}
          <svg
            key={bundle.id}
            viewBox="0 0 400 280"
            className="pointer-events-none absolute inset-0 h-full w-full"
            preserveAspectRatio="xMidYMid slice"
          >
            <motion.path
              d={bundle.routePath}
              fill="none"
              stroke={accent}
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.35"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={motionTransition(reducedMotion, {
                duration: 1.4,
                ease: "easeInOut",
                delay: 0.32,
              })}
            />
            <motion.path
              d={bundle.routePath}
              fill="none"
              stroke={accent}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={motionTransition(reducedMotion, {
                duration: 1.4,
                ease: "easeInOut",
                delay: 0.4,
              })}
            />
          </svg>

          {bundle.markers.map((marker, index) => (
            <motion.button
              key={marker.id}
              type="button"
              initial={reducedMotion ? false : { opacity: 0, scale: 0.5, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={motionTransition(reducedMotion, {
                delay: 0.35 + index * 0.12,
                ...{ type: "spring", stiffness: 420, damping: 26 },
              })}
              onClick={() => onMarkerClick?.(marker.id)}
              className="pointer-events-auto absolute z-10 -translate-x-1/2 -translate-y-full text-left"
              style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
              aria-label={marker.label}
            >
              <div className="mb-1.5 max-w-[130px] rounded-2xl border border-white/30 bg-[rgba(255,253,248,0.94)] px-2.5 py-1.5 shadow-lg backdrop-blur-sm">
                <p className="text-[11px] font-semibold leading-tight text-[#2b241c]">
                  {marker.label}
                  {marker.sublabel && (
                    <span className="font-normal text-[#8a7d6b]"> · {marker.sublabel}</span>
                  )}
                </p>
              </div>
              <span
                className={cn(
                  "mx-auto grid h-7 w-7 place-items-center rounded-full border-2 border-white text-[10px] font-bold text-white shadow-md",
                  marker.highlighted && "h-8 w-8"
                )}
                style={{
                  backgroundColor: accent,
                  boxShadow: `0 0 0 4px ${accent}44`,
                }}
              >
                {marker.stopNumber ?? ""}
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Header pill on stage — matches reference */}
      <motion.div
        initial={reducedMotion ? false : { opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={motionTransition(reducedMotion, { delay: 0.15 })}
        className="absolute left-1/2 top-[max(0.75rem,env(safe-area-inset-top))] z-10 -translate-x-1/2"
      >
        <div className="flex items-center gap-2 rounded-full border border-white/40 bg-[rgba(255,253,248,0.92)] px-3.5 py-1.5 shadow-lg backdrop-blur-sm">
          <span
            className="grid h-6 w-6 place-items-center rounded-full text-[11px] font-bold text-white"
            style={{ backgroundColor: accent }}
          >
            P
          </span>
          <span className="font-display text-[13px] font-semibold tracking-tight text-[#2b241c]">
            {bundle.headerPill}
          </span>
        </div>
      </motion.div>
    </div>
  );
}
