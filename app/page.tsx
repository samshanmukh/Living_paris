"use client";

import { useCallback, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import type { Feature, LineString } from "geojson";
import type { ExperienceResult, IntentQuery, MapTheme } from "@/lib/types";

interface ChatApiResponse {
  reply: string;
  intent: IntentQuery;
  result: ExperienceResult;
  route: { geometry: Feature<LineString> } | null;
}
import ChatSheet, { type ChatMessage } from "@/features/chat/ChatSheet";
import ExperienceCard from "@/features/experience/ExperienceCard";

const MapCanvas = dynamic(() => import("@/features/map/MapCanvas"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 grid place-items-center bg-cream">
      <span className="font-display text-sm text-ink-soft">Waking Paris…</span>
    </div>
  ),
});

/** Theme tints layered over the basemap so the whole city changes mood. */
const THEME_TINT: Record<MapTheme, string> = {
  romantic:
    "bg-[radial-gradient(ellipse_at_50%_30%,rgba(217,164,65,0.16),rgba(196,89,58,0.10)_60%,transparent)]",
  rain: "bg-[linear-gradient(rgba(91,122,153,0.22),rgba(55,65,92,0.14))]",
  family: "bg-[radial-gradient(ellipse_at_50%_30%,rgba(62,107,74,0.12),transparent_70%)]",
  night: "bg-[linear-gradient(rgba(55,65,92,0.35),rgba(43,36,28,0.25))]",
  day: "",
};

const OPENING_CHIPS = [
  "First date tonight, under €60",
  "I'm traveling with kids",
  "Show me hidden gems",
  "Best food within a 15-min walk",
];

const FOLLOWUP_CHIPS = [
  "It's raining",
  "We only have an hour",
  "She's vegetarian",
  "Make it wheelchair friendly",
];

const WELCOME: ChatMessage = {
  id: "welcome",
  role: "paris",
  text: "Bonsoir. Tell me what tonight should feel like — I'll reshape the city around it.",
};

let messageId = 0;
const nextId = () => `m${++messageId}`;

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [thinking, setThinking] = useState(false);
  const [result, setResult] = useState<ExperienceResult | null>(null);
  const [routeGeometry, setRouteGeometry] = useState<Feature<LineString> | null>(null);
  const [cardOpen, setCardOpen] = useState(true);
  const [redrawing, setRedrawing] = useState(false);
  const intentRef = useRef<IntentQuery | undefined>(undefined);

  const handleSend = useCallback(async (text: string) => {
    setMessages((prev) => [...prev, { id: nextId(), role: "user", text }]);
    setThinking(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, intent: intentRef.current }),
      });

      if (!res.ok) throw new Error(`chat failed: ${res.status}`);
      const data = (await res.json()) as ChatApiResponse;

      intentRef.current = data.intent;
      setRedrawing(true);
      setResult(data.result);
      setRouteGeometry(data.route?.geometry ?? null);
      setCardOpen(true);
      setMessages((prev) => [
        ...prev,
        { id: nextId(), role: "paris", text: data.reply },
      ]);
      setTimeout(() => setRedrawing(false), 2400);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: nextId(),
          role: "paris",
          text: "Pardon — I lost my train of thought. Try that again?",
        },
      ]);
    } finally {
      setThinking(false);
    }
  }, []);

  const theme: MapTheme = result?.mapState.theme ?? "day";
  const hasStarted = messages.length > 1;

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-cream">
      {/* map */}
      <MapCanvas
        mapState={result?.mapState ?? null}
        routeGeometry={routeGeometry}
      />

      {/* mood tint over the city */}
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

      {/* soft edge vignette — miniature diorama feel */}
      <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_120px_40px_rgba(43,36,28,0.10)]" />

      {/* top bar */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex flex-col items-center gap-2 px-4 pt-[max(0.9rem,env(safe-area-inset-top))]">
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="pointer-events-auto flex items-center gap-2 rounded-full bg-cream-soft/92 px-4 py-2 shadow-[var(--pill-shadow)] backdrop-blur-md"
        >
          <span className="grid h-5 w-5 place-items-center rounded-full bg-terracotta text-[10px] font-bold text-cream-soft">
            P
          </span>
          <span className="font-display text-[14px] font-semibold tracking-tight text-ink">
            Living Paris
          </span>
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

      {/* bottom stack: experience card + chat sheet */}
      <div className="absolute inset-x-0 bottom-0 z-10 mx-auto flex w-full max-w-md flex-col justify-end sm:max-w-lg">
        <ExperienceCard
          result={result}
          open={cardOpen}
          onToggle={() => setCardOpen((v) => !v)}
        />
        <ChatSheet
          messages={messages}
          chips={hasStarted ? FOLLOWUP_CHIPS : OPENING_CHIPS}
          thinking={thinking}
          onSend={handleSend}
        />
      </div>
    </main>
  );
}
