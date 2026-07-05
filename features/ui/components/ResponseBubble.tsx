"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { motionTransition, springSnappy } from "@/features/ui/motion";

interface ResponseBubbleProps {
  response: string | null;
  accentColor: string;
  senderLabel?: string;
  revealDelay?: number;
  autoDismissMs?: number;
}

export default function ResponseBubble({
  response,
  accentColor,
  senderLabel = "Paris",
  revealDelay = 0.4,
  autoDismissMs = 8000,
}: ResponseBubbleProps) {
  const reducedMotion = useReducedMotion();
  const [visible, setVisible] = useState(false);
  const [lastResponse, setLastResponse] = useState<string | null>(null);

  if (response !== lastResponse) {
    setLastResponse(response);
    setVisible(response != null);
  }

  useEffect(() => {
    if (!visible) return;
    const timer = window.setTimeout(() => setVisible(false), autoDismissMs);
    return () => window.clearTimeout(timer);
  }, [autoDismissMs, visible, lastResponse]);

  return (
    <AnimatePresence>
      {response && visible && (
        <motion.div
          key={response}
          initial={{ opacity: 0, y: 12, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.96 }}
          transition={motionTransition(reducedMotion ?? false, {
            ...springSnappy,
            delay: reducedMotion ? 0 : revealDelay,
          })}
          className="pointer-events-none mx-4 mb-2 max-w-md sm:max-w-lg"
        >
          <div
            className="lp-glass-strong rounded-2xl border px-3.5 py-2.5 transition-[border-color,box-shadow] duration-500"
            style={{
              borderColor: `${accentColor}55`,
              boxShadow: `0 10px 28px -12px ${accentColor}44`,
            }}
          >
            <p
              className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] transition-colors duration-500"
              style={{ color: accentColor }}
            >
              {senderLabel}
            </p>
            <p className="text-[13px] leading-snug text-[#2b241c]">{response}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
