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
      className="lp-glass-strong pointer-events-auto mx-3 mb-2 overflow-hidden rounded-[28px] border border-[#e5dbc9]"
      style={{
        boxShadow: `0 16px 44px -18px rgba(94,76,56,0.35), 0 0 32px ${intent.glowColor}`,
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
      >
        {intent.icon}
        <div className="min-w-0 flex-1">
          <p className="font-display text-[15px] font-semibold leading-tight text-[#2b241c]">
            {intent.title}
          </p>
          <p className="truncate text-[12px] text-[#8a7d6b]">{intent.subtitle}</p>
          <p className="mt-0.5 text-[11px] font-medium text-[#a09380]">
            {isGenerating
              ? "Living Paris is planning…"
              : `${intent.stops.length} stops · ${intent.distance} · ${intent.duration}`}
          </p>
        </div>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#efe7d8] text-[#6b6155]"
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
                <p className="text-[12.5px] text-[#8a7d6b]">
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
                    className={`flex gap-3 rounded-2xl border border-[#ece2d0] bg-white/75 p-2.5 ${
                      focusedStopId === stop.id ? "ring-1 ring-[#d8ccb8]" : ""
                    }`}
                    style={{
                      boxShadow:
                        focusedStopId === stop.id
                          ? `0 0 0 1.5px ${intent.accentColor}66, 0 8px 22px -12px ${intent.glowColor}`
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
                        <p className="truncate text-[13px] font-semibold text-[#2b241c]">
                          {stop.name}
                        </p>
                        <span className="shrink-0 rounded-full bg-[#efe7d8] px-2 py-0.5 text-[10px] uppercase tracking-wide text-[#8a7d6b]">
                          {stop.category}
                        </span>
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-[11.5px] leading-snug text-[#8a7d6b]">
                        {stop.description}
                      </p>
                      <p className="mt-1 text-[10.5px] font-medium text-[#a09380]">
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
