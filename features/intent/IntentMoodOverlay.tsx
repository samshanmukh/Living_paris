"use client";

import { motion, useReducedMotion } from "framer-motion";
import { MoodWeatherIcon } from "@/lib/living-paris-intent/icons";
import { fadeUp, motionTransition } from "@/lib/motion-presets";
import type { LivingParisIntent } from "@/lib/living-paris-intent";

interface IntentMoodOverlayProps {
  intent: LivingParisIntent;
}

export default function IntentMoodOverlay({ intent }: IntentMoodOverlayProps) {
  const reducedMotion = useReducedMotion();

  if (intent.id === "idle") return null;

  return (
    <motion.div
      key={intent.id + intent.mapMood}
      variants={fadeUp}
      initial="initial"
      animate={{ opacity: 0.7, y: 0 }}
      exit="exit"
      transition={motionTransition(reducedMotion ?? false, { duration: 0.9, ease: "easeOut" })}
      className="pointer-events-none absolute inset-0 transition-[background] duration-700 ease-in-out"
      style={{
        background: `radial-gradient(ellipse at 50% 18%, ${intent.glowColor}, transparent 58%)`,
      }}
    />
  );
}

interface IntentHeaderProps {
  intent: LivingParisIntent;
  isGenerating: boolean;
  intentSource?: "llm" | "heuristic" | null;
}

export function IntentHeader({ intent, isGenerating, intentSource }: IntentHeaderProps) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      layout={!reducedMotion}
      key={intent.id}
      variants={fadeUp}
      initial="initial"
      animate="animate"
      transition={motionTransition(reducedMotion ?? false)}
      className="lp-glass pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-[22px] border border-[#e5dbc9] px-4 py-3 transition-[border-color,box-shadow] duration-500 sm:max-w-lg"
      style={{ boxShadow: `0 8px 28px -14px ${intent.glowColor}` }}
    >
      <motion.div
        animate={{ scale: 1 }}
        initial={reducedMotion ? false : { scale: 0.92, opacity: 0 }}
        transition={motionTransition(reducedMotion ?? false, { delay: 0.05 })}
      >
        {intent.icon}
      </motion.div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <motion.p
            key={intent.title}
            initial={reducedMotion ? false : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={motionTransition(reducedMotion ?? false, { duration: 0.35 })}
            className="font-display text-[15px] font-semibold text-[#2b241c]"
          >
            {intent.title}
          </motion.p>
          <MoodWeatherIcon mood={intent.mapMood} />
          {intentSource && (
            <span className="rounded-full bg-[#efe7d8] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[#8a7d6b]">
              {intentSource === "llm" ? "Grok" : "local"}
            </span>
          )}
        </div>
        <p className="text-[12px] text-[#8a7d6b]">{intent.subtitle}</p>
        {isGenerating && (
          <motion.p
            className="mt-1 text-[11px] font-medium"
            style={{ color: intent.accentColor }}
            animate={reducedMotion ? undefined : { opacity: [0.45, 1, 0.45] }}
            transition={{ duration: 1.4, repeat: Infinity }}
          >
            Living Paris is planning…
          </motion.p>
        )}
      </div>
    </motion.div>
  );
}
