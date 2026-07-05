"use client";

import { motion } from "framer-motion";

interface GeneratingIndicatorProps {
  accentColor: string;
  label?: string;
}

export default function GeneratingIndicator({
  accentColor,
  label = "Living Paris is planning…",
}: GeneratingIndicatorProps) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-[#ece2d0] bg-white/70 px-3.5 py-2.5">
      {[0, 1, 2].map((index) => (
        <motion.span
          key={index}
          className="h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: accentColor }}
          animate={{ opacity: [0.25, 1, 0.25] }}
          transition={{
            duration: 1.1,
            repeat: Infinity,
            delay: index * 0.18,
          }}
        />
      ))}
      <span className="text-[12px] font-medium text-[#8a7d6b]">{label}</span>
    </div>
  );
}
