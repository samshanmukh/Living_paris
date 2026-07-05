"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import IntentDrawerShell from "@/features/ui/components/IntentDrawerShell";
import VoiceListeningOverlay from "@/features/ui/components/VoiceListeningOverlay";
import {
  toUiChatMessages,
  toUiIntentSummary,
  toUiPlanStops,
  toUiPresetChips,
} from "@/features/ui/adapters/living-paris";
import { drawerSnap } from "@/features/ui/tokens";
import { type PresetChipOption, type ScenarioChipId } from "@/features/intent/IntentPresetChips";
import { useSpeechRecognition } from "@/features/voice/useSpeechRecognition";
import type { LivingParisIntent } from "@/lib/living-paris-intent";

export interface ChatMessage {
  id: string;
  role: "user" | "paris";
  text: string;
}

interface IntentDrawerProps {
  intent: LivingParisIntent;
  presets: PresetChipOption[];
  selectedPresetId: ScenarioChipId | null;
  messages: ChatMessage[];
  isGenerating: boolean;
  focusedStopId?: string | null;
  expandSignal: number;
  onSend: (text: string) => void;
  onSelectPreset: (id: ScenarioChipId) => void;
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
  const [snap, setSnap] = useState<number | string | null>(drawerSnap.collapsed);
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const expanded = snap === drawerSnap.expanded;

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

  const [lastExpandSignal, setLastExpandSignal] = useState(expandSignal);
  if (expandSignal !== lastExpandSignal) {
    setLastExpandSignal(expandSignal);
    setSnap(drawerSnap.expanded);
  }

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isGenerating]);

  return (
    <>
      <VoiceListeningOverlay
        open={listening}
        accentColor={intent.accentColor}
        transcript={transcript}
        onStop={stop}
      />

      <IntentDrawerShell
        summary={toUiIntentSummary(intent)}
        presets={toUiPresetChips(presets)}
        selectedPresetId={selectedPresetId}
        messages={toUiChatMessages(messages)}
        stops={toUiPlanStops(intent)}
        isGenerating={isGenerating}
        focusedStopId={focusedStopId}
        expanded={expanded}
        onToggleExpanded={() => setSnap(expanded ? drawerSnap.collapsed : drawerSnap.expanded)}
        snap={snap}
        onSnapChange={setSnap}
        draft={draft}
        onDraftChange={setDraft}
        onSend={send}
        onSelectPreset={(id) => onSelectPreset(id as ScenarioChipId)}
        voiceSupported={voiceSupported}
        listening={listening}
        onToggleMic={toggleMic}
        scrollRef={scrollRef}
      />
    </>
  );
}

export { type PresetChipOption, type ScenarioChipId } from "@/features/intent/IntentPresetChips";
