"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { ExperienceResult } from "@/lib/types";

const LAYER_DOT: Record<string, string> = {
  cafes: "bg-terracotta",
  museums: "bg-gold",
  parks: "bg-forest",
  trees: "bg-forest",
  metro: "bg-rain",
};

interface ExperienceCardProps {
  result: ExperienceResult | null;
  open: boolean;
  onToggle: () => void;
}

export default function ExperienceCard({
  result,
  open,
  onToggle,
}: ExperienceCardProps) {
  if (!result || result.itinerary.stops.length === 0) return null;

  const { experience, itinerary, intent } = result;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 26 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
      className="pointer-events-auto mx-4 mb-2 overflow-hidden rounded-3xl bg-cream-soft/95 shadow-[var(--card-shadow)] backdrop-blur-md"
    >
      {/* header — always visible, tap to expand */}
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
            {itinerary.stops.length} stops · {itinerary.totalDurationMinutes} min
            {intent.budget != null && ` · under €${intent.budget}`}
            {!itinerary.fitsTimeBudget && " · over time budget"}
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

      {/* itinerary steps */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="steps"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
          >
            <div className="space-y-0 px-4 pb-4">
              {itinerary.stops.map((stop, i) => (
                <motion.div
                  key={stop.id}
                  initial={{ opacity: 0, x: -14 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.06 * i }}
                  className="flex gap-3"
                >
                  {/* number + connector */}
                  <div className="flex flex-col items-center">
                    <span
                      className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[12px] font-bold text-cream-soft ${
                        LAYER_DOT[stop.layer] ?? "bg-ink"
                      }`}
                    >
                      {stop.order}
                    </span>
                    {i < itinerary.stops.length - 1 && (
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

              <div className="flex items-center justify-between rounded-2xl bg-ink/4 px-3.5 py-2.5">
                <span className="text-[12px] font-medium text-ink-soft">
                  {Math.round(itinerary.totalWalkMinutes)} min walking
                </span>
                <span className="font-display text-[13px] font-semibold text-ink">
                  {itinerary.totalDurationMinutes} min total
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
