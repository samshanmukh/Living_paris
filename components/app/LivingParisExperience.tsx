"use client";

import { useCallback, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import type { Feature, LineString } from "geojson";
import { LanguageProvider, useLanguage } from "@/components/app/LanguageProvider";
import { LanguageSelector } from "@/components/app/LanguageSelector";
import ChatSheet, { type ChatMessage } from "@/features/chat/ChatSheet";
import ExperienceCard from "@/features/experience/ExperienceCard";
import { useSpeechSynthesis } from "@/features/voice/useSpeechSynthesis";
import { MODE_PROMPTS, OPENING_CHIP_IDS } from "@/lib/mode-prompts";
import type { IntegratedChatResponse } from "@/lib/integrated-chat-types";
import type { ExperienceResult, IntentQuery, MapTheme } from "@/lib/types";

const MapCanvas = dynamic(() => import("@/features/map/MapCanvas"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 grid place-items-center bg-cream">
      <span className="font-display text-sm text-ink-soft">Waking Paris…</span>
    </div>
  ),
});

const THEME_TINT: Record<MapTheme, string> = {
  romantic:
    "bg-[radial-gradient(ellipse_at_50%_30%,rgba(217,164,65,0.16),rgba(196,89,58,0.10)_60%,transparent)]",
  rain: "bg-[linear-gradient(rgba(91,122,153,0.22),rgba(55,65,92,0.14))]",
  family: "bg-[radial-gradient(ellipse_at_50%_30%,rgba(62,107,74,0.12),transparent_70%)]",
  night: "bg-[linear-gradient(rgba(55,65,92,0.35),rgba(43,36,28,0.25))]",
  day: "",
};

const FOLLOWUP_CHIPS = [
  "It's raining",
  "We only have an hour",
  "She's vegetarian",
  "Make it wheelchair friendly",
];

let messageId = 0;
const nextId = () => `m${++messageId}`;

export function LivingParisExperience() {
  return (
    <LanguageProvider>
      <LivingParisExperienceInner />
    </LanguageProvider>
  );
}

function LivingParisExperienceInner() {
  const { t, locale } = useLanguage();
  const speechLang = locale === "fr" ? "fr-FR" : "en-US";
  const { speak } = useSpeechSynthesis(speechLang);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "paris",
      text: t.messages.loading.split(".")[0] + ".",
    },
  ]);
  const [thinking, setThinking] = useState(false);
  const [result, setResult] = useState<ExperienceResult | null>(null);
  const [routeGeometry, setRouteGeometry] = useState<Feature<LineString> | null>(null);
  const [cardOpen, setCardOpen] = useState(true);
  const [redrawing, setRedrawing] = useState(false);
  const intentRef = useRef<IntentQuery | undefined>(undefined);
  const abortRef = useRef<AbortController | null>(null);
  const redrawTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openingChips = OPENING_CHIP_IDS.map((id) => MODE_PROMPTS[id]);

  const handleSend = useCallback(
    async (text: string) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setMessages((prev) => [...prev, { id: nextId(), role: "user", text }]);
      setThinking(true);

      try {
        const history = messages
          .filter((m) => m.id !== "welcome")
          .map((m) => ({
            role: (m.role === "user" ? "user" : "assistant") as "user" | "assistant",
            content: m.text,
          }));

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            intent: intentRef.current,
            history,
            context: { lat: 48.8566, lon: 2.3522 },
          }),
          signal: controller.signal,
        });

        if (!res.ok) throw new Error(`chat failed: ${res.status}`);
        const data = (await res.json()) as IntegratedChatResponse;

        intentRef.current = data.intent;
        setRedrawing(true);
        setResult(data.result);
        setRouteGeometry(data.route?.geometry ?? null);
        setCardOpen(true);
        setMessages((prev) => [
          ...prev,
          { id: nextId(), role: "paris", text: data.reply },
        ]);
        speak(data.reply, speechLang);

        if (redrawTimerRef.current) clearTimeout(redrawTimerRef.current);
        redrawTimerRef.current = setTimeout(() => setRedrawing(false), 2400);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setResult(null);
        setRouteGeometry(null);
        setRedrawing(false);
        setMessages((prev) => [
          ...prev,
          {
            id: nextId(),
            role: "paris",
            text: t.messages.queryFailed,
          },
        ]);
      } finally {
        if (abortRef.current === controller) {
          setThinking(false);
        }
      }
    },
    [messages, speak, speechLang, t.messages.queryFailed]
  );

  const theme: MapTheme = result?.mapState.theme ?? "day";
  const hasStarted = messages.length > 1;

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-cream">
      <MapCanvas mapState={result?.mapState ?? null} routeGeometry={routeGeometry} />

      <AnimatePresence>
        {theme !== "day" && (
          <motion.div
            key={theme}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.4 }}
            className={`pointer-events-none absolute inset-0 ${THEME_TINT[theme]}`}
          />
        )}
      </AnimatePresence>

      <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_120px_40px_rgba(43,36,28,0.10)]" />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex flex-col items-center gap-2 px-4 pt-[max(0.9rem,env(safe-area-inset-top))]">
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="pointer-events-auto flex w-full max-w-md items-center justify-between gap-2 rounded-full bg-cream-soft/92 px-4 py-2 shadow-[var(--pill-shadow)] backdrop-blur-md sm:max-w-lg"
        >
          <div className="flex items-center gap-2">
            <span className="grid h-5 w-5 place-items-center rounded-full bg-terracotta text-[10px] font-bold text-cream-soft">
              P
            </span>
            <span className="font-display text-[14px] font-semibold tracking-tight text-ink">
              {t.brand.eyebrow}
            </span>
          </div>
          <LanguageSelector />
        </motion.div>

        <AnimatePresence>
          {redrawing && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              className="flex items-center gap-2 rounded-full bg-ink/85 px-3.5 py-1.5 backdrop-blur-sm"
            >
              <motion.span
                className="h-1.5 w-1.5 rounded-full bg-gold"
                animate={{ scale: [1, 1.5, 1] }}
                transition={{ duration: 0.9, repeat: Infinity }}
              />
              <span className="text-[11.5px] font-medium text-cream-soft">
                Paris is redrawing your view
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-10 mx-auto flex w-full max-w-md flex-col justify-end sm:max-w-lg">
        <ExperienceCard result={result} open={cardOpen} onToggle={() => setCardOpen((v) => !v)} />
        <ChatSheet
          messages={messages}
          chips={hasStarted ? FOLLOWUP_CHIPS : openingChips}
          thinking={thinking}
          onSend={(text) => void handleSend(text)}
        />
      </div>
    </main>
  );
}
