"use client";

import { motion, useReducedMotion } from "framer-motion";
import { fadeUp, motionTransition } from "@/features/ui/motion";

interface MoodGlowOverlayProps {
  glowColor: string;
}

export default function MoodGlowOverlay({ glowColor }: MoodGlowOverlayProps) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      variants={fadeUp}
      initial="initial"
      animate={{ opacity: 0.7, y: 0 }}
      exit="exit"
      transition={motionTransition(reducedMotion ?? false, { duration: 0.9, ease: "easeOut" })}
      className="pointer-events-none absolute inset-0 transition-[background] duration-700 ease-in-out"
      style={{
        background: `radial-gradient(ellipse at 50% 18%, ${glowColor}, transparent 58%)`,
      }}
    />
  );
}
