"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { UiExperiencePlan } from "@/features/ui/types";

interface ExperiencePlanCardProps {
  plan: UiExperiencePlan;
  open: boolean;
  focusedStopId?: string | null;
  onToggle: () => void;
}

export default function ExperiencePlanCard({
  plan,
  open,
  focusedStopId,
  onToggle,
}: ExperiencePlanCardProps) {
  const { summary, route, stops, recommendations, totalWalkMinutes, totalDurationMinutes, fitsTimeBudget } =
    plan;
  const hasStops = stops.length > 0;

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
        <span className="text-xl leading-none">{summary.emoji}</span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-[15px] font-semibold leading-tight text-ink">
            {summary.name}
          </p>
          <p className="truncate text-[12px] text-ink-soft">{summary.subtitle}</p>
        </div>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ink/5 text-ink-soft"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
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
                  Route: {route.distanceKm} km · {Math.round(route.durationMinutes)} min ·{" "}
                  {route.provider}
                  {route.note ? ` · ${route.note}` : ""}
                </div>
              )}

              {hasStops ? (
                <div className="space-y-0">
                  {stops.map((stop, index) => (
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
                            stop.layerDotClass
                          }`}
                        >
                          {stop.order}
                        </span>
                        {index < stops.length - 1 && (
                          <span className="my-0.5 w-px flex-1 border-l border-dashed border-ink/20" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1 pb-3.5">
                        <p className="truncate text-[13.5px] font-semibold leading-tight text-ink">
                          {stop.name}
                        </p>
                        <p className="mt-0.5 text-[11.5px] leading-snug text-ink-soft">
                          {stop.detailLine}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className="text-[12.5px] text-ink-soft">
                  {plan.emptyMessage ?? "Try widening your walk radius or picking another mood."}
                </p>
              )}

              {recommendations.length > 0 && (
                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
                    Also nearby
                  </p>
                  <div className="space-y-1.5">
                    {recommendations.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-2 rounded-xl bg-white/60 px-3 py-2"
                      >
                        <span className="truncate text-[12.5px] font-medium text-ink">
                          {item.name}
                        </span>
                        <span className="shrink-0 text-[11px] text-ink-soft">{item.score}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {hasStops && (
                <div className="flex items-center justify-between rounded-2xl bg-ink/4 px-3.5 py-2.5">
                  <span className="text-[12px] font-medium text-ink-soft">
                    {Math.round(totalWalkMinutes)} min walking
                  </span>
                  <span className="font-display text-[13px] font-semibold text-ink">
                    {totalDurationMinutes} min total
                    {!fitsTimeBudget && " · over time budget"}
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
