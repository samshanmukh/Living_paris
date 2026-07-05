"use client";

import { motion } from "framer-motion";
import { MoodWeatherIcon } from "@/lib/living-paris-intent/icons";
import type { LivingParisIntent } from "@/lib/living-paris-intent";

interface IntentMoodOverlayProps {
  intent: LivingParisIntent;
}

export default function IntentMoodOverlay({ intent }: IntentMoodOverlayProps) {
  if (intent.id === "idle") return null;

  return (
    <motion.div
      key={intent.id + intent.mapMood}
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.7 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.1 }}
      className="pointer-events-none absolute inset-0"
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
  return (
    <motion.div
      layout
      key={intent.id}
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      className="lp-glass pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-[22px] border border-[#e5dbc9] px-4 py-3 sm:max-w-lg"
    >
      {intent.icon}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="font-display text-[15px] font-semibold text-[#2b241c]">
            {intent.title}
          </p>
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
            animate={{ opacity: [0.45, 1, 0.45] }}
            transition={{ duration: 1.4, repeat: Infinity }}
          >
            Living Paris is planning…
          </motion.p>
        )}
      </div>
    </motion.div>
  );
}
