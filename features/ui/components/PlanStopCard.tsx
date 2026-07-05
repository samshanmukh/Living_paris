"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { UiPlanStop } from "@/features/ui/types";
import { stopVariants } from "@/features/ui/motion";
import { cn } from "@/lib/utils";

interface PlanStopCardProps {
  stop: UiPlanStop;
  index: number;
  accentColor: string;
  glowColor: string;
  focused?: boolean;
}

export default function PlanStopCard({
  stop,
  index,
  accentColor,
  glowColor,
  focused,
}: PlanStopCardProps) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      variants={stopVariants(index, reducedMotion ?? false)}
      initial={reducedMotion ? false : "initial"}
      animate="animate"
      className={cn(
        "flex gap-3 rounded-2xl border border-[#ece2d0] bg-white/75 p-2.5",
        focused && "ring-1 ring-[#d8ccb8]"
      )}
      style={{
        boxShadow: focused
          ? `0 0 0 1.5px ${accentColor}66, 0 8px 22px -12px ${glowColor}`
          : undefined,
      }}
    >
      <div
        className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl"
        style={{ background: stop.imageBackground }}
      >
        <span
          className="absolute bottom-1 right-1 grid h-5 w-5 place-items-center rounded-full text-[10px] font-bold text-white"
          style={{ backgroundColor: accentColor }}
        >
          {stop.number}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-[13px] font-semibold text-[#2b241c]">{stop.name}</p>
          <span className="shrink-0 rounded-full bg-[#efe7d8] px-2 py-0.5 text-[10px] uppercase tracking-wide text-[#8a7d6b]">
            {stop.category}
          </span>
        </div>
        <p className="mt-0.5 line-clamp-2 text-[11.5px] leading-snug text-[#8a7d6b]">
          {stop.description}
        </p>
        <p className="mt-1 text-[10.5px] font-medium text-[#a09380]">{stop.duration}</p>
      </div>
    </motion.div>
  );
}
