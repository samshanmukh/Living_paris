"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Mic } from "lucide-react";

interface VoiceListeningOverlayProps {
  open: boolean;
  accentColor: string;
  transcript?: string;
  hint?: string;
  onStop: () => void;
}

export default function VoiceListeningOverlay({
  open,
  accentColor,
  transcript,
  hint = "Say something like “plan a cozy rainy afternoon”",
  onStop,
}: VoiceListeningOverlayProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.button
          type="button"
          key="voice-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onStop}
          aria-label="Stop listening"
          className="pointer-events-auto fixed inset-0 z-[70] flex flex-col items-center justify-center gap-6 bg-[#f3ede2]/85 backdrop-blur-xl"
        >
          <div className="relative grid place-items-center">
            {[0, 1, 2].map((ring) => (
              <motion.span
                key={ring}
                className="absolute rounded-full border-2"
                style={{ borderColor: `${accentColor}55` }}
                initial={{ width: 96, height: 96, opacity: 0.8 }}
                animate={{ width: 230, height: 230, opacity: 0 }}
                transition={{
                  duration: 2.2,
                  repeat: Infinity,
                  delay: ring * 0.7,
                  ease: "easeOut",
                }}
              />
            ))}
            <motion.span
              animate={{ scale: [1, 1.07, 1] }}
              transition={{ duration: 1.4, repeat: Infinity }}
              className="grid h-24 w-24 place-items-center rounded-full text-white shadow-xl"
              style={{ backgroundColor: accentColor }}
            >
              <Mic size={38} />
            </motion.span>
          </div>
          <div className="px-8 text-center">
            <p className="font-display text-[19px] font-semibold text-[#2b241c]">
              Paris is listening…
            </p>
            <p className="mt-1.5 min-h-[1.4em] text-[14px] text-[#8a7d6b]">
              {transcript || hint}
            </p>
            <p className="mt-5 text-[11px] font-medium uppercase tracking-[0.16em] text-[#b3a893]">
              Tap anywhere to stop
            </p>
          </div>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
