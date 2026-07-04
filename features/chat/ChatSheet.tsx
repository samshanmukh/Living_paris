"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "framer-motion";

export interface ChatMessage {
  id: string;
  role: "user" | "paris";
  text: string;
}

interface ChatSheetProps {
  messages: ChatMessage[];
  chips: string[];
  thinking: boolean;
  onSend: (message: string) => void;
}

/** Minimal typing for the vendor-prefixed Web Speech API. */
interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: { results: { [i: number]: { [j: number]: { transcript: string } } } }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
}

function getSpeechRecognition(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, unknown>;
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null) as
    | (new () => SpeechRecognitionLike)
    | null;
}

const subscribeNoop = () => () => {};

export default function ChatSheet({
  messages,
  chips,
  thinking,
  onSend,
}: ChatSheetProps) {
  const [draft, setDraft] = useState("");
  const [listening, setListening] = useState(false);
  // SSR-safe browser capability check without setState-in-effect.
  const voiceSupported = useSyncExternalStore(
    subscribeNoop,
    () => getSpeechRecognition() != null,
    () => false
  );
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, thinking]);

  const send = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || thinking) return;
      setDraft("");
      onSend(trimmed);
    },
    [onSend, thinking]
  );

  const toggleMic = useCallback(() => {
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const SR = getSpeechRecognition();
    if (!SR) return;

    const recognition = new SR();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      send(transcript);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);

    recognitionRef.current = recognition;
    setListening(true);
    recognition.start();
  }, [listening, send]);

  return (
    <div className="pointer-events-auto flex max-h-[46dvh] flex-col rounded-t-[26px] bg-cream-soft/95 shadow-[0_-12px_44px_-14px_rgba(43,36,28,0.35)] backdrop-blur-md">
      {/* grabber */}
      <div className="flex justify-center pb-1 pt-2.5">
        <div className="h-1 w-10 rounded-full bg-ink/15" />
      </div>

      {/* messages */}
      <div
        ref={scrollRef}
        className="no-scrollbar flex-1 space-y-2.5 overflow-y-auto px-4 pb-2 pt-1"
      >
        <AnimatePresence initial={false}>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 14, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className={
                message.role === "user"
                  ? "ml-auto max-w-[82%] rounded-2xl rounded-br-md bg-terracotta px-3.5 py-2.5 text-[13.5px] leading-snug text-cream-soft"
                  : "mr-auto max-w-[88%] rounded-2xl rounded-bl-md bg-white/85 px-3.5 py-2.5 text-[13.5px] leading-snug text-ink shadow-sm"
              }
            >
              {message.role === "paris" && (
                <span className="mb-0.5 block font-display text-[11px] font-semibold uppercase tracking-[0.12em] text-terracotta">
                  Paris
                </span>
              )}
              {message.text}
            </motion.div>
          ))}
        </AnimatePresence>

        {thinking && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mr-auto flex items-center gap-1.5 rounded-2xl rounded-bl-md bg-white/85 px-3.5 py-3 shadow-sm"
          >
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="h-1.5 w-1.5 rounded-full bg-terracotta"
                animate={{ opacity: [0.25, 1, 0.25] }}
                transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.18 }}
              />
            ))}
          </motion.div>
        )}
      </div>

      {/* suggestion chips */}
      {chips.length > 0 && (
        <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-2">
          {chips.map((chip) => (
            <motion.button
              key={chip}
              whileTap={{ scale: 0.94 }}
              onClick={() => send(chip)}
              disabled={thinking}
              className="shrink-0 rounded-full border border-ink/10 bg-white/70 px-3.5 py-1.5 text-[12.5px] font-medium text-ink-soft transition-colors hover:border-terracotta/40 hover:text-terracotta disabled:opacity-50"
            >
              {chip}
            </motion.button>
          ))}
        </div>
      )}

      {/* input row */}
      <div className="flex items-center gap-2 border-t border-ink/8 px-4 pb-[max(0.85rem,env(safe-area-inset-bottom))] pt-2.5">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send(draft)}
          placeholder={listening ? "Listening…" : "Talk to Paris…"}
          className="min-w-0 flex-1 rounded-full border border-ink/10 bg-white/80 px-4 py-2.5 text-[14px] text-ink outline-none placeholder:text-ink/35 focus:border-terracotta/50"
        />
        {voiceSupported && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={toggleMic}
            aria-label={listening ? "Stop listening" : "Speak to Paris"}
            className={`grid h-11 w-11 shrink-0 place-items-center rounded-full transition-colors ${
              listening
                ? "bg-terracotta text-cream-soft"
                : "bg-ink text-cream-soft hover:bg-terracotta"
            }`}
          >
            {listening ? (
              <motion.span
                className="block h-3.5 w-3.5 rounded-[3px] bg-cream-soft"
                animate={{ scale: [1, 0.8, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            ) : (
              <MicIcon />
            )}
          </motion.button>
        )}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => send(draft)}
          disabled={!draft.trim() || thinking}
          aria-label="Send"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-terracotta text-cream-soft transition-opacity disabled:opacity-35"
        >
          <SendIcon />
        </motion.button>
      </div>
    </div>
  );
}

function MicIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m5 12 14 0" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}
