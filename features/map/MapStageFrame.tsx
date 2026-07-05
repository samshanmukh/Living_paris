"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { motionTransition } from "@/features/ui/motion";

interface MapStageFrameProps {
  children: ReactNode;
  accentColor?: string;
  /** Show idle hint before the user picks a scenario. */
  idle?: boolean;
}

/**
 * Diorama-style floating platform — wraps the live map like the reference screens.
 * Pointer events pass through the chrome; the map stays fully interactive inside.
 */
export default function MapStageFrame({
  children,
  accentColor = "#d9a441",
  idle = false,
}: MapStageFrameProps) {
  const reducedMotion = useReducedMotion() ?? false;

  return (
    <div
      className="absolute inset-0 z-0 overflow-hidden bg-[#1c1814]"
      style={{ ["--lp-accent" as string]: accentColor }}
    >
      {/* Ambient backdrop */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_20%,rgba(255,210,140,0.14),transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_85%,rgba(40,30,20,0.55),transparent_62%)]" />

      <motion.div
        className="absolute inset-x-[3%] top-[5%] bottom-[19%] sm:inset-x-[7%] sm:top-[4%] sm:bottom-[21%]"
        animate={reducedMotion ? undefined : { y: [0, -3, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="relative h-full w-full overflow-hidden rounded-[26px] shadow-[0_28px_70px_-22px_rgba(30,22,14,0.72)] ring-1 ring-white/18 sm:rounded-[30px]">
          {children}

          {/* Golden-hour wash */}
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(165deg,rgba(255,193,120,0.12),transparent_42%,rgba(255,170,90,0.04)_68%,rgba(40,28,16,0.12))]" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_8%,rgba(255,250,240,0.18),transparent_52%)]" />
          <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_100px_24px_rgba(50,38,24,0.18)]" />

          {/* Accent pulse when a plan is active */}
          {!idle && (
            <motion.div
              className="pointer-events-none absolute inset-0 rounded-[inherit]"
              initial={false}
              animate={{ opacity: [0.35, 0.55, 0.35] }}
              transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
              style={{
                boxShadow: `inset 0 0 0 1px ${accentColor}33, inset 0 -40px 80px -40px ${accentColor}18`,
              }}
            />
          )}
        </div>
      </motion.div>

      {/* Platform shadow */}
      <div className="pointer-events-none absolute inset-x-[8%] bottom-[16%] h-8 rounded-[50%] bg-black/25 blur-2xl sm:inset-x-[12%]" />

      {idle && (
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={motionTransition(reducedMotion, { delay: 0.4 })}
          className="pointer-events-none absolute inset-x-0 top-[42%] z-[1] flex justify-center px-6 text-center"
        >
          <p className="max-w-xs font-display text-[15px] font-semibold leading-snug text-[#faf6ee]/90 drop-shadow-sm">
            Pick a mood below — Paris reshapes around you
          </p>
        </motion.div>
      )}
    </div>
  );
}
