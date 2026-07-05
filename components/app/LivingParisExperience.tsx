"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence } from "framer-motion";
import { LanguageProvider } from "@/components/app/LanguageProvider";
import { LanguageSelector } from "@/components/app/LanguageSelector";
import ChatSheet, { type ChatMessage } from "@/features/chat/ChatSheet";
import IntentBottomSheet from "@/features/intent/IntentBottomSheet";
import IntentMoodOverlay, { IntentHeader } from "@/features/intent/IntentMoodOverlay";
import IntentPresetChips from "@/features/intent/IntentPresetChips";
import IntentResponseBubble from "@/features/intent/IntentResponseBubble";
import MapLayerControls from "@/features/map/MapLayerControls";
import { useSpeechSynthesis } from "@/features/voice/useSpeechSynthesis";
import { useLivingParisIntent } from "@/hooks/useLivingParisIntent";

const MapCanvas = dynamic(() => import("@/features/map/MapCanvas"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 grid place-items-center bg-[#0f1117]">
      <span className="font-display text-sm text-white/50">Waking Paris…</span>
    </div>
  ),
});

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
  const { speak } = useSpeechSynthesis("en-US");
  const {
    currentIntent,
    presetIntents,
    selectedPresetId,
    selectPreset,
    submitFreeformIntent,
    isGenerating,
    livingParisResponse,
    intentSource,
    result,
    routeGeometry,
    hiddenLayers,
    toggleLayer,
  } = useLivingParisIntent();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sheetOpen, setSheetOpen] = useState(true);
  const [focusedStopId, setFocusedStopId] = useState<string | null>(null);
  const lastSpokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (!livingParisResponse || livingParisResponse === lastSpokenRef.current) return;
    lastSpokenRef.current = livingParisResponse;
    setMessages((prev) => {
      if (prev.some((m) => m.role === "paris" && m.text === livingParisResponse)) return prev;
      return [...prev, { id: nextId(), role: "paris", text: livingParisResponse }];
    });
    void speak(livingParisResponse);
  }, [livingParisResponse, speak]);

  const handleSubmit = useCallback(
    async (text: string) => {
      setMessages((prev) => [...prev, { id: nextId(), role: "user", text }]);
      setFocusedStopId(null);
      setSheetOpen(true);
      try {
        await submitFreeformIntent(text);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: nextId(),
            role: "paris",
            text: "Something went wrong — try again in a moment.",
          },
        ]);
      }
    },
    [submitFreeformIntent]
  );

  const handlePreset = useCallback(
    async (id: (typeof presetIntents)[number]["id"]) => {
      const label = presetIntents.find((p) => p.id === id)?.label ?? id;
      setMessages((prev) => [...prev, { id: nextId(), role: "user", text: label }]);
      setFocusedStopId(null);
      setSheetOpen(true);
      try {
        await selectPreset(id);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: nextId(),
            role: "paris",
            text: "Something went wrong — try again in a moment.",
          },
        ]);
      }
    },
    [presetIntents, selectPreset]
  );

  const hasStarted =
    selectedPresetId != null || messages.length > 0 || currentIntent.id !== "idle";

  return (
    <main className="lp-dark relative h-dvh w-full overflow-hidden bg-[#0f1117]">
      <MapCanvas
        mapState={result?.mapState ?? null}
        routeGeometry={routeGeometry}
        hiddenLayers={hiddenLayers}
        routeAccentColor={currentIntent.accentColor}
        onMarkerClick={(id) => {
          setSheetOpen(true);
          setFocusedStopId(id);
        }}
      />

      <AnimatePresence>
        <IntentMoodOverlay intent={currentIntent} />
      </AnimatePresence>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.04),transparent_45%)]" />
      <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_140px_50px_rgba(0,0,0,0.55)]" />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex flex-col items-center gap-2 px-4 pt-[max(0.9rem,env(safe-area-inset-top))]">
        <div className="pointer-events-auto flex w-full max-w-md items-center justify-between gap-2 sm:max-w-lg">
          <div className="lp-glass flex flex-1 items-center rounded-full border border-white/10 px-3 py-2">
            <span className="mr-2 grid h-5 w-5 place-items-center rounded-full bg-white/10 text-[10px] font-bold text-[#f5f0e8]">
              P
            </span>
            <span className="font-display text-[14px] font-semibold tracking-tight text-[#f5f0e8]">
              Living Paris
            </span>
          </div>
          <LanguageSelector />
        </div>

        {hasStarted && (
          <IntentHeader
            intent={currentIntent}
            isGenerating={isGenerating}
            intentSource={intentSource}
          />
        )}

        {result?.mapState.visibleLayers && (
          <MapLayerControls
            visibleLayers={result.mapState.visibleLayers}
            hiddenLayers={hiddenLayers}
            onToggle={toggleLayer}
          />
        )}
      </div>

      <div className="absolute inset-x-0 bottom-0 z-10 mx-auto flex w-full max-w-md flex-col justify-end sm:max-w-lg">
        <IntentResponseBubble
          response={livingParisResponse}
          accentColor={currentIntent.accentColor}
        />

        {(hasStarted || currentIntent.stops.length > 0) && (
          <IntentBottomSheet
            intent={currentIntent}
            open={sheetOpen}
            isGenerating={isGenerating}
            focusedStopId={focusedStopId}
            onToggle={() => setSheetOpen((value) => !value)}
          />
        )}

        <IntentPresetChips
          presets={presetIntents}
          selectedId={selectedPresetId}
          disabled={isGenerating}
          onSelect={(id) => void handlePreset(id)}
        />

        <ChatSheet
          messages={messages}
          thinking={isGenerating}
          onSend={(text) => void handleSubmit(text)}
        />
      </div>
    </main>
  );
}
