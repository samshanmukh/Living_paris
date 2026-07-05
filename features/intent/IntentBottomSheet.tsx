"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { LivingParisIntent } from "@/lib/living-paris-intent";

interface IntentBottomSheetProps {
  intent: LivingParisIntent;
  open: boolean;
  isGenerating: boolean;
  focusedStopId?: string | null;
  onToggle: () => void;
}

export default function IntentBottomSheet({
  intent,
  open,
  isGenerating,
  focusedStopId,
  onToggle,
}: IntentBottomSheetProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 26 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
      className="lp-glass pointer-events-auto mx-3 mb-2 overflow-hidden rounded-[28px] border border-white/10 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.65)]"
      style={{
        boxShadow: `0 20px 60px -20px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.06), 0 0 40px ${intent.glowColor}`,
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
      >
        {intent.icon}
        <div className="min-w-0 flex-1">
          <p
            className="font-display text-[15px] font-semibold leading-tight text-[#f5f0e8]"
            style={{ color: "#f5f0e8" }}
          >
            {intent.title}
          </p>
          <p className="truncate text-[12px] text-white/55">{intent.subtitle}</p>
          <p className="mt-0.5 text-[11px] font-medium text-white/40">
            {isGenerating
              ? "Living Paris is planning…"
              : `${intent.stops.length} stops · ${intent.distance} · ${intent.duration}`}
          </p>
        </div>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/8 text-white/70"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </motion.span>
      </button>

      <AnimatePresence mode="wait" initial={false}>
        {open && (
          <motion.div
            key={intent.id + intent.stops.length}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
          >
            <div className="space-y-3 px-4 pb-4">
              {intent.stops.length === 0 && !isGenerating && (
                <p className="text-[12.5px] text-white/50">
                  No stops yet — try another mood or widen your request.
                </p>
              )}

              <div className="space-y-2">
                {intent.stops.map((stop, index) => (
                  <motion.div
                    key={stop.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * index }}
                    className={`flex gap-3 rounded-2xl border border-white/6 bg-white/5 p-2.5 ${
                      focusedStopId === stop.id ? "ring-1 ring-white/20" : ""
                    }`}
                    style={{
                      boxShadow:
                        focusedStopId === stop.id
                          ? `0 0 0 1px ${intent.accentColor}55, 0 8px 24px -12px ${intent.glowColor}`
                          : undefined,
                    }}
                  >
                    <div
                      className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl"
                      style={{ background: stop.image }}
                    >
                      <span
                        className="absolute bottom-1 right-1 grid h-5 w-5 place-items-center rounded-full text-[10px] font-bold text-white"
                        style={{ backgroundColor: intent.accentColor }}
                      >
                        {stop.number}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-[13px] font-semibold text-[#f5f0e8]">
                          {stop.name}
                        </p>
                        <span className="shrink-0 rounded-full bg-white/8 px-2 py-0.5 text-[10px] uppercase tracking-wide text-white/45">
                          {stop.category}
                        </span>
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-[11.5px] leading-snug text-white/50">
                        {stop.description}
                      </p>
                      <p className="mt-1 text-[10.5px] font-medium text-white/35">
                        {stop.duration}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
