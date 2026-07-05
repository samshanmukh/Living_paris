"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface IntentResponseBubbleProps {
  response: string | null;
  accentColor: string;
}

export default function IntentResponseBubble({
  response,
  accentColor,
}: IntentResponseBubbleProps) {
  const [visible, setVisible] = useState(false);
  const [lastResponse, setLastResponse] = useState<string | null>(null);

  // Derived-state-during-render: show the bubble whenever a new response lands.
  if (response !== lastResponse) {
    setLastResponse(response);
    setVisible(response != null);
  }

  useEffect(() => {
    if (!visible) return;
    const timer = window.setTimeout(() => setVisible(false), 8000);
    return () => window.clearTimeout(timer);
  }, [visible, lastResponse]);

  return (
    <AnimatePresence>
      {response && visible && (
        <motion.div
          key={response}
          initial={{ opacity: 0, y: 10, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 360, damping: 28 }}
          className="pointer-events-none mx-4 mb-2 max-w-md sm:max-w-lg"
        >
          <div
            className="lp-glass-strong rounded-2xl border px-3.5 py-2.5"
            style={{ borderColor: `${accentColor}55` }}
          >
            <p
              className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: accentColor }}
            >
              Paris
            </p>
            <p className="text-[13px] leading-snug text-[#2b241c]">{response}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
