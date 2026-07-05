"use client";

import { motion } from "framer-motion";
import { prefersReducedMotion } from "@/lib/map-performance";
import { overlayPalette } from "./palette";

interface FloatingAnnotationProps {
  text: string;
  tag?: string;
  side?: "left" | "right";
}

export default function FloatingAnnotation({
  text,
  tag,
  side = "right",
}: FloatingAnnotationProps) {
  const reduced = prefersReducedMotion();

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 6, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={reduced ? undefined : { opacity: 0, y: 4, scale: 0.98 }}
      transition={{ duration: 0.45, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
      className={`pointer-events-none absolute top-1 z-20 max-w-[132px] ${
        side === "right" ? "left-[calc(100%+8px)]" : "right-[calc(100%+8px)] text-right"
      }`}
    >
      <div
        className="rounded-2xl border px-2.5 py-1.5 shadow-[0_10px_28px_-12px_rgba(43,36,28,0.35)] backdrop-blur-md"
        style={{
          background: overlayPalette.glass,
          borderColor: "rgba(229, 219, 201, 0.85)",
        }}
      >
        {tag ? (
          <span className="mb-0.5 block text-[8px] font-semibold uppercase tracking-[0.08em] text-[#9a8775]">
            {tag}
          </span>
        ) : null}
        <p className="text-[10px] font-medium leading-snug text-[#5c5248]">{text}</p>
      </div>
    </motion.div>
  );
}
