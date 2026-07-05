"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence } from "framer-motion";
import { LanguageProvider } from "@/components/app/LanguageProvider";
import { LanguageSelector } from "@/components/app/LanguageSelector";
import UiDevToolbar from "@/features/dev/UiDevToolbar";
import IntentDrawer, { type ChatMessage } from "@/features/intent/IntentDrawer";
import IntentMoodOverlay, { IntentHeader } from "@/features/intent/IntentMoodOverlay";
import IntentResponseBubble from "@/features/intent/IntentResponseBubble";
import MapLayerControls from "@/features/map/MapLayerControls";
import MapSnapshotLayer from "@/features/map/MapSnapshotLayer";
import { useSpeechSynthesis } from "@/features/voice/useSpeechSynthesis";
import { useLivingParisIntent } from "@/hooks/useLivingParisIntent";

const MapCanvas = dynamic(() => import("@/features/map/MapCanvas"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 grid place-items-center bg-[#efe9df]">
      <span className="font-display text-sm text-[#8a7d6b]">Waking Paris…</span>
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
    devCache,
  } = useLivingParisIntent();

  const {
    enabled: devCacheEnabled,
    useLiveMap,
    captureMapSnapshot,
    persistCache,
    frozen: mapFrozen,
    mapSnapshot,
    savedAt: cacheSavedAt,
    setUseLiveMap,
    clearDevCache,
  } = devCache;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [focusedStopId, setFocusedStopId] = useState<string | null>(null);
  const [expandSignal, setExpandSignal] = useState(0);
  const lastSpokenRef = useRef<string | null>(null);
  const mapCaptureRef = useRef<(() => Promise<string | null>) | null>(null);

  useEffect(() => {
    if (!livingParisResponse || livingParisResponse === lastSpokenRef.current) return;
    lastSpokenRef.current = livingParisResponse;
    setMessages((prev) => {
      if (prev.some((m) => m.role === "paris" && m.text === livingParisResponse)) return prev;
      return [...prev, { id: nextId(), role: "paris", text: livingParisResponse }];
    });
    void speak(livingParisResponse);
  }, [livingParisResponse, speak]);

  useEffect(() => {
    if (!devCacheEnabled || !useLiveMap || !result || isGenerating) return;

    const timer = window.setTimeout(async () => {
      if (!mapCaptureRef.current) return;
      await captureMapSnapshot(mapCaptureRef.current);
    }, 2800);

    return () => window.clearTimeout(timer);
  }, [captureMapSnapshot, devCacheEnabled, isGenerating, result, useLiveMap]);

  const handleCaptureSnapshot = useCallback(async () => {
    if (mapCaptureRef.current) {
      await captureMapSnapshot(mapCaptureRef.current);
      return;
    }
    persistCache();
  }, [captureMapSnapshot, persistCache]);

  const handleCaptureReady = useCallback((capture: () => Promise<string | null>) => {
    mapCaptureRef.current = capture;
  }, []);

  const pushErrorUnlessAborted = useCallback((error: unknown) => {
    // Superseded requests abort silently — the newer query owns the UI.
    if (error instanceof DOMException && error.name === "AbortError") return;
    setMessages((prev) => [
      ...prev,
      {
        id: nextId(),
        role: "paris",
        text: "Something went wrong — try again in a moment.",
      },
    ]);
  }, []);

  const handleSubmit = useCallback(
    async (text: string) => {
      setMessages((prev) => [...prev, { id: nextId(), role: "user", text }]);
      setFocusedStopId(null);
      try {
        await submitFreeformIntent(text);
      } catch (error) {
        pushErrorUnlessAborted(error);
      }
    },
    [pushErrorUnlessAborted, submitFreeformIntent]
  );

  const handlePreset = useCallback(
    async (id: (typeof presetIntents)[number]["id"]) => {
      const label = presetIntents.find((p) => p.id === id)?.label ?? id;
      setMessages((prev) => [...prev, { id: nextId(), role: "user", text: label }]);
      setFocusedStopId(null);
      try {
        await selectPreset(id);
      } catch (error) {
        pushErrorUnlessAborted(error);
      }
    },
    [presetIntents, pushErrorUnlessAborted, selectPreset]
  );

  const hasStarted =
    selectedPresetId != null || messages.length > 0 || currentIntent.id !== "idle";

  return (
    <main className="lp-dark relative h-dvh w-full overflow-hidden bg-[#efe9df]">
      {mapFrozen && mapSnapshot ? (
        <MapSnapshotLayer
          src={mapSnapshot}
          accentColor={currentIntent.accentColor}
        />
      ) : (
        <MapCanvas
          mapState={result?.mapState ?? null}
          routeGeometry={routeGeometry}
          hiddenLayers={hiddenLayers}
          routeAccentColor={currentIntent.accentColor}
          onCaptureReady={handleCaptureReady}
          onMarkerClick={(id) => {
            setFocusedStopId(id);
            setExpandSignal((value) => value + 1);
          }}
        />
      )}

      <div className="pointer-events-none absolute inset-0 z-[1]">
        <AnimatePresence>
          <IntentMoodOverlay intent={currentIntent} />
        </AnimatePresence>
        <div className="absolute inset-0 bg-[linear-gradient(165deg,rgba(255,193,120,0.16),transparent_38%,rgba(255,170,90,0.05)_70%,rgba(94,60,30,0.10))]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(255,250,240,0.2),transparent_55%)]" />
        <div className="absolute inset-0 shadow-[inset_0_0_120px_30px_rgba(94,76,56,0.16)]" />
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex flex-col items-center gap-2 px-4 pt-[max(0.9rem,env(safe-area-inset-top))]">
        <div className="pointer-events-auto flex w-full max-w-md items-center justify-between gap-2 sm:max-w-lg">
          <div className="lp-glass flex flex-1 items-center rounded-full border border-[#e5dbc9] px-3 py-2">
            <span
              className="mr-2 grid h-6 w-6 place-items-center rounded-full text-[11px] font-bold text-white"
              style={{ backgroundColor: currentIntent.accentColor }}
            >
              P
            </span>
            <span className="font-display text-[14px] font-semibold tracking-tight text-[#2b241c]">
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

      <div className="pointer-events-none absolute inset-x-0 bottom-[240px] z-10 mx-auto w-full max-w-md sm:max-w-lg">
        <IntentResponseBubble
          response={livingParisResponse}
          accentColor={currentIntent.accentColor}
        />
      </div>

      <IntentDrawer
        intent={currentIntent}
        presets={presetIntents}
        selectedPresetId={selectedPresetId}
        messages={messages}
        isGenerating={isGenerating}
        focusedStopId={focusedStopId}
        expandSignal={expandSignal}
        onSend={(text) => void handleSubmit(text)}
        onSelectPreset={(id) => void handlePreset(id)}
      />

      {devCacheEnabled && (
        <UiDevToolbar
          savedAt={cacheSavedAt}
          frozen={mapFrozen}
          onCapture={() => void handleCaptureSnapshot()}
          onUseLiveMap={() => setUseLiveMap(true)}
          onClear={clearDevCache}
        />
      )}
    </main>
  );
}
