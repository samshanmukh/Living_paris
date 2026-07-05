"use client";

import { motion } from "framer-motion";
import { palette } from "@/features/ui/tokens";

interface BrandPillProps {
  label?: string;
  accentColor?: string;
  monogram?: string;
}

export default function BrandPill({
  label = "Living Paris",
  accentColor = palette.gold,
  monogram = "P",
}: BrandPillProps) {
  return (
    <div className="lp-glass flex flex-1 items-center rounded-full border border-[#e5dbc9] px-3 py-2">
      <motion.span
        className="mr-2 grid h-6 w-6 place-items-center rounded-full text-[11px] font-bold text-white"
        animate={{ backgroundColor: accentColor }}
        transition={{ duration: 0.55, ease: "easeInOut" }}
      >
        {monogram}
      </motion.span>
      <span className="font-display text-[14px] font-semibold tracking-tight text-[#2b241c]">
        {label}
      </span>
    </div>
  );
}
