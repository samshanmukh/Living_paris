"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { UiIntentSummary } from "@/features/ui/types";
import { fadeUp, motionTransition } from "@/features/ui/motion";

interface IntentHeaderCardProps {
  summary: UiIntentSummary;
  isGenerating?: boolean;
}

export default function IntentHeaderCard({ summary, isGenerating }: IntentHeaderCardProps) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      layout={!reducedMotion}
      key={summary.id}
      variants={fadeUp}
      initial="initial"
      animate="animate"
      transition={motionTransition(reducedMotion ?? false)}
      className="lp-glass pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-[22px] border border-[#e5dbc9] px-4 py-3 transition-[border-color,box-shadow] duration-500 sm:max-w-lg"
      style={{ boxShadow: `0 8px 28px -14px ${summary.glowColor}` }}
    >
      <motion.div
        animate={{ scale: 1 }}
        initial={reducedMotion ? false : { scale: 0.92, opacity: 0 }}
        transition={motionTransition(reducedMotion ?? false, { delay: 0.05 })}
      >
        {summary.icon}
      </motion.div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <motion.p
            key={summary.title}
            initial={reducedMotion ? false : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={motionTransition(reducedMotion ?? false, { duration: 0.35 })}
            className="font-display text-[15px] font-semibold text-[#2b241c]"
          >
            {summary.title}
          </motion.p>
          {summary.moodEmoji && <span className="text-sm">{summary.moodEmoji}</span>}
          {summary.sourceBadge && (
            <span className="rounded-full bg-[#efe7d8] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[#8a7d6b]">
              {summary.sourceBadge}
            </span>
          )}
        </div>
        <p className="text-[12px] text-[#8a7d6b]">{summary.subtitle}</p>
        {isGenerating && (
          <motion.p
            className="mt-1 text-[11px] font-medium"
            style={{ color: summary.accentColor }}
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
