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
  onSend: (message: string) => void;
}

export default function ChatSheet({ messages, thinking, onSend }: ChatSheetProps) {
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
    <div className="lp-glass pointer-events-auto flex max-h-[42dvh] flex-col rounded-t-[28px] border border-white/10 shadow-[0_-20px_60px_-20px_rgba(0,0,0,0.8)]">
      <div className="flex justify-center pb-1 pt-2.5">
        <div className="h-1 w-10 rounded-full bg-white/15" />
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
                    ? "ml-auto max-w-[82%] rounded-2xl rounded-br-md bg-white/12 px-3.5 py-2.5 text-[13.5px] leading-snug text-[#f5f0e8]"
                    : "mr-auto max-w-[88%] rounded-2xl rounded-bl-md border border-white/8 bg-black/25 px-3.5 py-2.5 text-[13.5px] leading-snug text-[#f5f0e8]"
                }
              >
                {message.role === "paris" && (
                  <span className="mb-0.5 block text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
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
            className="flex items-center gap-2 rounded-2xl border border-white/8 bg-white/5 px-3.5 py-2.5"
          >
            {[0, 1, 2].map((index) => (
              <motion.span
                key={index}
                className="h-1.5 w-1.5 rounded-full bg-[#d9a441]"
                animate={{ opacity: [0.25, 1, 0.25] }}
                transition={{ duration: 1.1, repeat: Infinity, delay: index * 0.18 }}
              />
            ))}
            <span className="text-[12px] font-medium text-white/55">
              Living Paris is planning…
            </span>
          </motion.div>
        </div>
      )}

      <div className="flex items-center gap-2 border-t border-white/8 px-4 pb-[max(0.85rem,env(safe-area-inset-bottom))] pt-2.5">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && send(draft)}
          placeholder={listening ? "Listening…" : "Ask Living Paris anything…"}
          className="min-w-0 flex-1 rounded-full border border-white/10 bg-black/25 px-4 py-2.5 text-[14px] text-[#f5f0e8] outline-none placeholder:text-white/30 focus:border-white/25"
        />
        {voiceSupported && (
          <motion.button
            type="button"
            whileTap={{ scale: 0.9 }}
            onClick={toggleMic}
            aria-label={listening ? "Stop listening" : "Speak to Paris"}
            className={`grid h-11 w-11 shrink-0 place-items-center rounded-full transition-colors ${
              listening ? "bg-[#e879a9] text-white" : "bg-white/10 text-white hover:bg-white/18"
            }`}
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
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#d9a441] text-[#0f1117] transition-opacity disabled:opacity-35"
        >
          →
        </motion.button>
      </div>
    </div>
  );
}
