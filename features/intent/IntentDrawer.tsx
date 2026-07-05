"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronUp, Mic, Send, Square } from "lucide-react";
import { Drawer } from "vaul";
import IntentPresetChips from "@/features/intent/IntentPresetChips";
import { useSpeechRecognition } from "@/features/voice/useSpeechRecognition";
import { messageVariants, motionTransition, stopVariants } from "@/lib/motion-presets";
import { cn } from "@/lib/utils";
import type { LivingParisIntent, PresetIntentId } from "@/lib/living-paris-intent";

const COLLAPSED_SNAP = "232px";
const EXPANDED_SNAP = 0.74;

export interface ChatMessage {
  id: string;
  role: "user" | "paris";
  text: string;
}

interface PresetChip {
  id: PresetIntentId;
  label: string;
  emoji: string;
  accentColor: string;
}

interface IntentDrawerProps {
  intent: LivingParisIntent;
  presets: PresetChip[];
  selectedPresetId: PresetIntentId | null;
  messages: ChatMessage[];
  isGenerating: boolean;
  focusedStopId?: string | null;
  expandSignal: number;
  onSend: (text: string) => void;
  onSelectPreset: (id: PresetIntentId) => void;
}

export default function IntentDrawer({
  intent,
  presets,
  selectedPresetId,
  messages,
  isGenerating,
  focusedStopId,
  expandSignal,
  onSend,
  onSelectPreset,
}: IntentDrawerProps) {
  const [snap, setSnap] = useState<number | string | null>(COLLAPSED_SNAP);
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const expanded = snap === EXPANDED_SNAP;
  const reducedMotion = useReducedMotion() ?? false;

  const send = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isGenerating) return;
      setDraft("");
      onSend(trimmed);
    },
    [isGenerating, onSend]
  );

  const onFinalTranscript = useCallback((text: string) => send(text), [send]);

  const {
    supported: voiceSupported,
    listening,
    transcript,
    start,
    stop,
  } = useSpeechRecognition({ lang: "en-US", onFinalTranscript });

  const toggleMic = useCallback(() => {
    if (listening) stop();
    else start();
  }, [listening, start, stop]);

  // Derived-state-during-render: parent bumps expandSignal to force-expand.
  const [lastExpandSignal, setLastExpandSignal] = useState(expandSignal);
  if (expandSignal !== lastExpandSignal) {
    setLastExpandSignal(expandSignal);
    setSnap(EXPANDED_SNAP);
  }

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isGenerating]);

  const hasPlan = intent.stops.length > 0;

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
            className="pointer-events-auto fixed inset-0 z-[70] flex flex-col items-center justify-center gap-6 bg-[#f3ede2]/85 backdrop-blur-xl"
          >
            <div className="relative grid place-items-center">
              {[0, 1, 2].map((ring) => (
                <motion.span
                  key={ring}
                  className="absolute rounded-full border-2"
                  style={{ borderColor: `${intent.accentColor}55` }}
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
                style={{ backgroundColor: intent.accentColor }}
              >
                <Mic size={38} />
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

      <Drawer.Root
        open
        modal={false}
        dismissible={false}
        snapPoints={[COLLAPSED_SNAP, EXPANDED_SNAP]}
        activeSnapPoint={snap}
        setActiveSnapPoint={setSnap}
      >
        <Drawer.Portal>
          <Drawer.Content
            aria-describedby={undefined}
            className="lp-drawer-accent lp-glass-strong fixed inset-x-0 bottom-0 z-20 mx-auto flex h-full max-h-[96%] w-full max-w-md flex-col rounded-t-[28px] border border-[#e5dbc9] outline-none sm:max-w-lg"
            style={{ boxShadow: `0 -12px 44px -18px rgba(94,76,56,0.4), 0 0 32px ${intent.glowColor}` }}
          >
            <Drawer.Title className="sr-only">Living Paris plan</Drawer.Title>

            <div className="flex justify-center pb-1 pt-2.5">
              <div className="h-1 w-10 rounded-full bg-[#d8ccb8]" />
            </div>

            <button
              type="button"
              onClick={() => setSnap(expanded ? COLLAPSED_SNAP : EXPANDED_SNAP)}
              className="flex w-full items-center gap-3 px-4 pb-2 pt-1 text-left"
            >
              {intent.icon}
              <div className="min-w-0 flex-1">
                <motion.p
                  key={intent.title}
                  initial={reducedMotion ? false : { opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={motionTransition(reducedMotion, { duration: 0.35 })}
                  className="font-display text-[15px] font-semibold leading-tight text-[#2b241c]"
                >
                  {intent.title}
                </motion.p>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.p
                    key={
                      isGenerating
                        ? "planning"
                        : hasPlan
                          ? `plan-${intent.stops.length}`
                          : "subtitle"
                    }
                    initial={reducedMotion ? false : { opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reducedMotion ? undefined : { opacity: 0, y: -5 }}
                    transition={motionTransition(reducedMotion, { duration: 0.28 })}
                    className="truncate text-[12px] text-[#8a7d6b]"
                  >
                    {isGenerating
                      ? "Living Paris is planning…"
                      : hasPlan
                        ? `${intent.stops.length} stops · ${intent.distance} · ${intent.duration}`
                        : intent.subtitle}
                  </motion.p>
                </AnimatePresence>
              </div>
              <motion.span
                animate={{ rotate: expanded ? 180 : 0 }}
                transition={motionTransition(reducedMotion, { duration: 0.3 })}
                className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#efe7d8] text-[#6b6155]"
              >
                <ChevronUp size={14} />
              </motion.span>
            </button>

            <IntentPresetChips
              presets={presets}
              selectedId={selectedPresetId}
              disabled={isGenerating}
              onSelect={onSelectPreset}
            />

            <div className="flex items-center gap-2 px-4 pb-2.5 pt-0.5">
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
                  className={cn(
                    "grid h-11 w-11 shrink-0 place-items-center rounded-full transition-colors",
                    listening
                      ? "text-white"
                      : "bg-[#efe7d8] text-[#6b6155] hover:bg-[#e6dcc8]"
                  )}
                  style={listening ? { backgroundColor: intent.accentColor } : undefined}
                >
                  {listening ? <Square size={17} /> : <Mic size={18} />}
                </motion.button>
              )}
              <motion.button
                type="button"
                whileTap={reducedMotion ? undefined : { scale: 0.9 }}
                onClick={() => send(draft)}
                disabled={!draft.trim() || isGenerating}
                aria-label="Send"
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-white transition-[background-color,opacity] duration-500 disabled:opacity-35"
                style={{ backgroundColor: intent.accentColor }}
              >
                <Send size={17} />
              </motion.button>
            </div>

            <div
              ref={scrollRef}
              className={cn(
                "no-scrollbar flex-1 space-y-2 border-t border-[#ece2d0] px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3",
                expanded ? "overflow-y-auto" : "overflow-hidden"
              )}
            >
              {isGenerating && (
                <div className="flex items-center gap-2 rounded-2xl border border-[#ece2d0] bg-white/70 px-3.5 py-2.5">
                  {[0, 1, 2].map((index) => (
                    <motion.span
                      key={index}
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: intent.accentColor }}
                      animate={{ opacity: [0.25, 1, 0.25] }}
                      transition={{
                        duration: 1.1,
                        repeat: Infinity,
                        delay: index * 0.18,
                      }}
                    />
                  ))}
                  <span className="text-[12px] font-medium text-[#8a7d6b]">
                    Living Paris is planning…
                  </span>
                </div>
              )}

              <AnimatePresence mode="wait" initial={false}>
                {hasPlan && !isGenerating && (
                  <motion.div
                    key={intent.id + intent.stops.length}
                    initial={reducedMotion ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={reducedMotion ? undefined : { opacity: 0 }}
                    transition={motionTransition(reducedMotion, { duration: 0.25 })}
                    className="space-y-2"
                  >
                    {intent.stops.map((stop, index) => (
                      <motion.div
                        key={stop.id}
                        variants={stopVariants(index, reducedMotion)}
                        initial={reducedMotion ? false : "initial"}
                        animate="animate"
                        className={cn(
                          "flex gap-3 rounded-2xl border border-[#ece2d0] bg-white/75 p-2.5",
                          focusedStopId === stop.id && "ring-1 ring-[#d8ccb8]"
                        )}
                        style={{
                          boxShadow:
                            focusedStopId === stop.id
                              ? `0 0 0 1.5px ${intent.accentColor}66, 0 8px 22px -12px ${intent.glowColor}`
                              : undefined,
                        }}
                      >
                        <div
                          className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl"
                          style={{ background: stop.image }}
                        >
                          <span
                            className="absolute bottom-1 right-1 grid h-5 w-5 place-items-center rounded-full text-[10px] font-bold text-white"
                            style={{ backgroundColor: intent.accentColor }}
                          >
                            {stop.number}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-[13px] font-semibold text-[#2b241c]">
                              {stop.name}
                            </p>
                            <span className="shrink-0 rounded-full bg-[#efe7d8] px-2 py-0.5 text-[10px] uppercase tracking-wide text-[#8a7d6b]">
                              {stop.category}
                            </span>
                          </div>
                          <p className="mt-0.5 line-clamp-2 text-[11.5px] leading-snug text-[#8a7d6b]">
                            {stop.description}
                          </p>
                          <p className="mt-1 text-[10.5px] font-medium text-[#a09380]">
                            {stop.duration}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence initial={false}>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    variants={messageVariants(message.role)}
                    initial={reducedMotion ? false : "initial"}
                    animate="animate"
                    exit="exit"
                    transition={motionTransition(reducedMotion)}
                    className={cn(
                      "max-w-[88%] rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-snug",
                      message.role === "user"
                        ? "ml-auto rounded-br-md text-white"
                        : "mr-auto rounded-bl-md border border-[#ece2d0] bg-white/80 text-[#2b241c]"
                    )}
                    style={
                      message.role === "user"
                        ? { backgroundColor: intent.accentColor }
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
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </>
  );
}
