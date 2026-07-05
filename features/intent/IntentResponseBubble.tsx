"use client";

import { AnimatePresence, motion } from "framer-motion";

interface IntentResponseBubbleProps {
  response: string | null;
  accentColor: string;
}

export default function IntentResponseBubble({
  response,
  accentColor,
}: IntentResponseBubbleProps) {
  return (
    <AnimatePresence>
      {response && (
        <motion.div
          key={response}
          initial={{ opacity: 0, y: 10, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 360, damping: 28 }}
          className="pointer-events-none mx-4 mb-2 max-w-md sm:max-w-lg"
        >
          <div
            className="lp-glass rounded-2xl border border-white/10 px-3.5 py-2.5 shadow-lg"
            style={{ borderColor: `${accentColor}33` }}
          >
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">
              Paris
            </p>
            <p className="text-[13px] leading-snug text-[#f5f0e8]">{response}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
