"use client";

import { motion } from "framer-motion";
import { prefersReducedMotion } from "@/lib/map-performance";
import { overlayPalette } from "./palette";

interface DestinationGlowProps {
  accentColor?: string;
  highlighted?: boolean;
}

export default function DestinationGlow({
  accentColor = overlayPalette.amber,
  highlighted,
}: DestinationGlowProps) {
  const reduced = prefersReducedMotion();

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute left-1/2 top-[72%] -z-10 h-16 w-24 -translate-x-1/2 rounded-[100%] blur-xl"
      style={{
        background: `radial-gradient(circle, ${accentColor}55 0%, transparent 72%)`,
      }}
      animate={
        reduced
          ? undefined
          : {
              opacity: highlighted ? [0.45, 0.75, 0.45] : [0.25, 0.42, 0.25],
              scale: highlighted ? [1, 1.08, 1] : [0.95, 1.03, 0.95],
            }
      }
      transition={{ duration: highlighted ? 2.8 : 3.6, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}
