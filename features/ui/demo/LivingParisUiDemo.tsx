"use client";

import { useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import {
  BrandPill,
  IntentDrawerShell,
  IntentHeaderCard,
  LanguagePicker,
  MoodGlowOverlay,
  ResponseBubble,
  VoiceListeningOverlay,
  uiDemoFixtures,
} from "@/features/ui";
import { drawerSnap } from "@/features/ui/tokens";

/**
 * Standalone UI preview — safe to copy into Lovable.
 * Depends only on features/ui/* and app/globals.css tokens.
 */
export default function LivingParisUiDemo() {
  const [snap, setSnap] = useState<number | string | null>(drawerSnap.collapsed);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState(uiDemoFixtures.messages);
  const [selectedPreset, setSelectedPreset] = useState<string | null>("date-night");
  const [listening, setListening] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const expanded = snap === drawerSnap.expanded;

  const handleSend = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setDraft("");
    setMessages((prev) => [
      ...prev,
      { id: `m${prev.length + 1}`, role: "user", text: trimmed },
    ]);
  };

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-[#efe9df]">
      <div className="pointer-events-none absolute inset-0 z-[1]">
        <AnimatePresence>
          <MoodGlowOverlay glowColor={uiDemoFixtures.glowColor} />
        </AnimatePresence>
        <div className="absolute inset-0 bg-[linear-gradient(165deg,rgba(255,193,120,0.16),transparent_38%,rgba(255,170,90,0.05)_70%,rgba(94,60,30,0.10))]" />
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex flex-col items-center gap-2 px-4 pt-[max(0.9rem,env(safe-area-inset-top))]">
        <div className="pointer-events-auto flex w-full max-w-md items-center justify-between gap-2 sm:max-w-lg">
          <BrandPill accentColor={uiDemoFixtures.accentColor} />
          <LanguagePicker
            value="en"
            ariaLabel="Language"
            options={[
              { code: "en", label: "English" },
              { code: "fr", label: "Français" },
            ]}
            onChange={() => undefined}
          />
        </div>
        <IntentHeaderCard summary={uiDemoFixtures.summary} />
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-[240px] z-10 mx-auto w-full max-w-md sm:max-w-lg">
        <ResponseBubble
          response={uiDemoFixtures.response}
          accentColor={uiDemoFixtures.accentColor}
        />
      </div>

      <VoiceListeningOverlay
        open={listening}
        accentColor={uiDemoFixtures.accentColor}
        onStop={() => setListening(false)}
      />

      <IntentDrawerShell
        summary={uiDemoFixtures.summary}
        presets={uiDemoFixtures.presets}
        selectedPresetId={selectedPreset}
        messages={messages}
        stops={uiDemoFixtures.stops}
        isGenerating={false}
        expanded={expanded}
        onToggleExpanded={() =>
          setSnap(expanded ? drawerSnap.collapsed : drawerSnap.expanded)
        }
        snap={snap}
        onSnapChange={setSnap}
        draft={draft}
        onDraftChange={setDraft}
        onSend={handleSend}
        onSelectPreset={setSelectedPreset}
        voiceSupported
        listening={listening}
        onToggleMic={() => setListening((value) => !value)}
        scrollRef={scrollRef}
      />
    </main>
  );
}
