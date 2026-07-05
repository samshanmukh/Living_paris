"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useSpeechRecognition } from "@/features/voice/useSpeechRecognition";

export interface ChatMessage {
  id: string;
  role: "user" | "paris";
  text: string;
}

interface ChatSheetProps {
  messages: ChatMessage[];
  thinking: boolean;
  accentColor?: string;
  onSend: (message: string) => void;
}

export default function ChatSheet({
  messages,
  thinking,
  accentColor = "#c4593a",
  onSend,
}: ChatSheetProps) {
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const send = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || thinking) return;
      setDraft("");
      onSend(trimmed);
    },
    [onSend, thinking]
  );

  const onFinalTranscript = useCallback((text: string) => send(text), [send]);

  const {
    supported: voiceSupported,
    listening,
    transcript,
    start,
    stop,
  } = useSpeechRecognition({ lang: "en-US", onFinalTranscript });

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, thinking, transcript]);

  const toggleMic = useCallback(() => {
    if (listening) stop();
    else start();
  }, [listening, start, stop]);

  return (
    <>
      <AnimatePresence>
        {listening && (
          <motion.button
            type="button"
            key="voice-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={stop}
            aria-label="Stop listening"
            className="pointer-events-auto fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-[#f3ede2]/85 backdrop-blur-xl"
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
                className="grid h-24 w-24 place-items-center rounded-full text-4xl shadow-xl"
                style={{ backgroundColor: accentColor }}
              >
                🎤
              </motion.span>
            </div>
            <div className="px-8 text-center">
              <p className="font-display text-[19px] font-semibold text-[#2b241c]">
                Paris is listening…
              </p>
              <p className="mt-1.5 min-h-[1.4em] text-[14px] text-[#8a7d6b]">
                {transcript || "Say something like “plan a cozy rainy afternoon”"}
              </p>
              <p className="mt-5 text-[11px] font-medium uppercase tracking-[0.16em] text-[#b3a893]">
                Tap anywhere to stop
              </p>
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      <div className="lp-glass-strong pointer-events-auto flex max-h-[42dvh] flex-col rounded-t-[28px] border border-[#e5dbc9]">
      <div className="flex justify-center pb-1 pt-2.5">
        <div className="h-1 w-10 rounded-full bg-[#d8ccb8]" />
      </div>

      {messages.length > 0 && (
        <div
          ref={scrollRef}
          className="no-scrollbar max-h-[22dvh] flex-1 space-y-2 overflow-y-auto px-4 pb-2 pt-1"
        >
          <AnimatePresence initial={false}>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 14, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={
                  message.role === "user"
                    ? "ml-auto max-w-[82%] rounded-2xl rounded-br-md px-3.5 py-2.5 text-[13.5px] leading-snug text-white"
                    : "mr-auto max-w-[88%] rounded-2xl rounded-bl-md border border-[#ece2d0] bg-white/80 px-3.5 py-2.5 text-[13.5px] leading-snug text-[#2b241c]"
                }
                style={
                  message.role === "user"
                    ? { backgroundColor: accentColor }
                    : undefined
                }
              >
                {message.role === "paris" && (
                  <span className="mb-0.5 block text-[10px] font-semibold uppercase tracking-[0.14em] text-[#a09380]">
                    Paris
                  </span>
                )}
                {message.text}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {thinking && (
        <div className="px-4 pb-2">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 rounded-2xl border border-[#ece2d0] bg-white/70 px-3.5 py-2.5"
          >
            {[0, 1, 2].map((index) => (
              <motion.span
                key={index}
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: accentColor }}
                animate={{ opacity: [0.25, 1, 0.25] }}
                transition={{ duration: 1.1, repeat: Infinity, delay: index * 0.18 }}
              />
            ))}
            <span className="text-[12px] font-medium text-[#8a7d6b]">
              Living Paris is planning…
            </span>
          </motion.div>
        </div>
      )}

      <div className="flex items-center gap-2 border-t border-[#ece2d0] px-4 pb-[max(0.85rem,env(safe-area-inset-bottom))] pt-2.5">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && send(draft)}
          placeholder={listening ? "Listening…" : "Ask Living Paris anything…"}
          className="min-w-0 flex-1 rounded-full border border-[#e0d5c2] bg-white/85 px-4 py-2.5 text-[14px] text-[#2b241c] outline-none placeholder:text-[#b3a893] focus:border-[#c9b995]"
        />
        {voiceSupported && (
          <motion.button
            type="button"
            whileTap={{ scale: 0.9 }}
            onClick={toggleMic}
            aria-label={listening ? "Stop listening" : "Speak to Paris"}
            className={`grid h-11 w-11 shrink-0 place-items-center rounded-full transition-colors ${
              listening
                ? "text-white"
                : "bg-[#efe7d8] text-[#6b6155] hover:bg-[#e6dcc8]"
            }`}
            style={listening ? { backgroundColor: accentColor } : undefined}
          >
            {listening ? "■" : "🎤"}
          </motion.button>
        )}
        <motion.button
          type="button"
          whileTap={{ scale: 0.9 }}
          onClick={() => send(draft)}
          disabled={!draft.trim() || thinking}
          aria-label="Send"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-white transition-opacity disabled:opacity-35"
          style={{ backgroundColor: accentColor }}
        >
          →
        </motion.button>
      </div>
      </div>
    </>
  );
}
