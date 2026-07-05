"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { ExperienceResult } from "@/lib/types";
import type { RouteResponse } from "@/services/routing/route-planner";

const LAYER_DOT: Record<string, string> = {
  cafes: "bg-terracotta",
  museums: "bg-gold",
  parks: "bg-forest",
  trees: "bg-forest",
  metro: "bg-rain",
};

interface ExperienceCardProps {
  result: ExperienceResult | null;
  route: RouteResponse | null;
  open: boolean;
  focusedStopId?: string | null;
  onToggle: () => void;
}

export default function ExperienceCard({
  result,
  route,
  open,
  focusedStopId,
  onToggle,
}: ExperienceCardProps) {
  if (!result) return null;

  const { experience, itinerary, intent, recommendations } = result;
  const hasStops = itinerary.stops.length > 0;
  const topRecommendations = recommendations
    .filter((item) => !itinerary.stops.some((stop) => stop.id === item.id))
    .slice(0, 4);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 26 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
      className="pointer-events-auto mx-4 mb-2 overflow-hidden rounded-3xl bg-cream-soft/95 shadow-[var(--card-shadow)] backdrop-blur-md"
    >
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <span className="text-xl leading-none">{experience.emoji}</span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-[15px] font-semibold leading-tight text-ink">
            {experience.name}
          </p>
          <p className="truncate text-[12px] text-ink-soft">
            {hasStops
              ? `${itinerary.stops.length} stops · ${itinerary.totalDurationMinutes} min`
              : "No stops in range yet"}
            {route
              ? ` · ${Math.round(route.durationMinutes)} min walk (${route.provider})`
              : null}
            {intent.budget != null && ` · under €${intent.budget}`}
            {!itinerary.fitsTimeBudget && hasStops && " · over time budget"}
          </p>
        </div>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ink/5 text-ink-soft"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="details"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
          >
            <div className="space-y-3 px-4 pb-4">
              {route && (
                <div className="rounded-2xl bg-ink/4 px-3.5 py-2.5 text-[12px] text-ink-soft">
                  Route: {(route.distanceMeters / 1000).toFixed(1)} km ·{" "}
                  {Math.round(route.durationMinutes)} min · {route.provider}
                  {route.note ? ` · ${route.note}` : ""}
                </div>
              )}

              {hasStops ? (
                <div className="space-y-0">
                  {itinerary.stops.map((stop, index) => (
                    <motion.div
                      key={stop.id}
                      initial={{ opacity: 0, x: -14 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.06 * index }}
                      className={`flex gap-3 rounded-xl px-1 py-0.5 ${
                        focusedStopId === stop.id ? "bg-terracotta/10 ring-1 ring-terracotta/25" : ""
                      }`}
                    >
                      <div className="flex flex-col items-center">
                        <span
                          className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[12px] font-bold text-cream-soft ${
                            LAYER_DOT[stop.layer] ?? "bg-ink"
                          }`}
                        >
                          {stop.order}
                        </span>
                        {index < itinerary.stops.length - 1 && (
                          <span className="my-0.5 w-px flex-1 border-l border-dashed border-ink/20" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1 pb-3.5">
                        <p className="truncate text-[13.5px] font-semibold leading-tight text-ink">
                          {stop.name}
                        </p>
                        <p className="mt-0.5 text-[11.5px] leading-snug text-ink-soft">
                          {stop.walkFromPreviousMinutes > 0 &&
                            `${Math.round(stop.walkFromPreviousMinutes)} min walk · `}
                          {stop.reasons.slice(0, 2).join(" · ") || stop.layer}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className="text-[12.5px] text-ink-soft">
                  Try widening your walk radius or picking another mood.
                </p>
              )}

              {topRecommendations.length > 0 && (
                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
                    Also nearby
                  </p>
                  <div className="space-y-1.5">
                    {topRecommendations.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-2 rounded-xl bg-white/60 px-3 py-2"
                      >
                        <span className="truncate text-[12.5px] font-medium text-ink">
                          {item.name}
                        </span>
                        <span className="shrink-0 text-[11px] text-ink-soft">
                          {item.score}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {hasStops && (
                <div className="flex items-center justify-between rounded-2xl bg-ink/4 px-3.5 py-2.5">
                  <span className="text-[12px] font-medium text-ink-soft">
                    {Math.round(itinerary.totalWalkMinutes)} min walking
                  </span>
                  <span className="font-display text-[13px] font-semibold text-ink">
                    {itinerary.totalDurationMinutes} min total
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
