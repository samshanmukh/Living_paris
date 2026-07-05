"use client";

import type { RefObject } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronUp } from "lucide-react";
import ChatMessageBubble from "@/features/ui/components/ChatMessageBubble";
import ComposerBar from "@/features/ui/components/ComposerBar";
import GeneratingIndicator from "@/features/ui/components/GeneratingIndicator";
import PlanStopCard from "@/features/ui/components/PlanStopCard";
import PresetChipRow from "@/features/ui/components/PresetChipRow";
import type { UiChatMessage, UiIntentSummary, UiPlanStop, UiPresetChip } from "@/features/ui/types";
import { drawerSnap } from "@/features/ui/tokens";
import { motionTransition } from "@/features/ui/motion";
import { cn } from "@/lib/utils";
import { Drawer } from "vaul";

export interface IntentDrawerShellProps {
  summary: UiIntentSummary;
  presets: UiPresetChip[];
  selectedPresetId: string | null;
  messages: UiChatMessage[];
  stops: UiPlanStop[];
  isGenerating: boolean;
  focusedStopId?: string | null;
  expanded: boolean;
  onToggleExpanded: () => void;
  snap: number | string | null;
  onSnapChange: (snap: number | string | null) => void;
  draft: string;
  onDraftChange: (value: string) => void;
  onSend: (text: string) => void;
  onSelectPreset: (id: string) => void;
  voiceSupported?: boolean;
  listening?: boolean;
  onToggleMic?: () => void;
  scrollRef?: RefObject<HTMLDivElement | null>;
}

export default function IntentDrawerShell({
  summary,
  presets,
  selectedPresetId,
  messages,
  stops,
  isGenerating,
  focusedStopId,
  expanded,
  onToggleExpanded,
  snap,
  onSnapChange,
  draft,
  onDraftChange,
  onSend,
  onSelectPreset,
  voiceSupported,
  listening,
  onToggleMic,
  scrollRef,
}: IntentDrawerShellProps) {
  const reducedMotion = useReducedMotion() ?? false;
  const hasPlan = stops.length > 0;

  const planMeta = isGenerating
    ? "Living Paris is planning…"
    : hasPlan
      ? [`${stops.length} stops`, summary.distance, summary.duration].filter(Boolean).join(" · ")
      : summary.subtitle;

  return (
    <Drawer.Root
      open
      modal={false}
      dismissible={false}
      snapPoints={[drawerSnap.collapsed, drawerSnap.expanded]}
      activeSnapPoint={snap}
      setActiveSnapPoint={onSnapChange}
    >
      <Drawer.Portal>
        <Drawer.Content
          aria-describedby={undefined}
          className="lp-drawer-accent lp-glass-strong fixed inset-x-0 bottom-0 z-20 mx-auto flex h-full max-h-[96%] w-full max-w-md flex-col rounded-t-[28px] border border-[#e5dbc9] outline-none sm:max-w-lg"
          style={{
            boxShadow: `0 -12px 44px -18px rgba(94,76,56,0.4), 0 0 32px ${summary.glowColor}`,
          }}
        >
          <Drawer.Title className="sr-only">Living Paris plan</Drawer.Title>

          <div className="flex justify-center pb-1 pt-2.5">
            <div className="h-1 w-10 rounded-full bg-[#d8ccb8]" />
          </div>

          <button
            type="button"
            onClick={onToggleExpanded}
            className="flex w-full items-center gap-3 px-4 pb-2 pt-1 text-left"
          >
            {summary.icon}
            <div className="min-w-0 flex-1">
              <motion.p
                key={summary.title}
                initial={reducedMotion ? false : { opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={motionTransition(reducedMotion, { duration: 0.35 })}
                className="font-display text-[15px] font-semibold leading-tight text-[#2b241c]"
              >
                {summary.title}
              </motion.p>
              <AnimatePresence mode="wait" initial={false}>
                <motion.p
                  key={
                    isGenerating
                      ? "planning"
                      : hasPlan
                        ? `plan-${stops.length}`
                        : "subtitle"
                  }
                  initial={reducedMotion ? false : { opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reducedMotion ? undefined : { opacity: 0, y: -5 }}
                  transition={motionTransition(reducedMotion, { duration: 0.28 })}
                  className="truncate text-[12px] text-[#8a7d6b]"
                >
                  {planMeta}
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

          <PresetChipRow
            presets={presets}
            selectedId={selectedPresetId}
            disabled={isGenerating}
            onSelect={onSelectPreset}
          />

          <ComposerBar
            draft={draft}
            accentColor={summary.accentColor}
            isGenerating={isGenerating}
            listening={listening}
            voiceSupported={voiceSupported}
            onDraftChange={onDraftChange}
            onSend={() => onSend(draft)}
            onToggleMic={onToggleMic}
          />

          <div
            ref={scrollRef}
            className={cn(
              "no-scrollbar flex-1 space-y-2 border-t border-[#ece2d0] px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3",
              expanded ? "overflow-y-auto" : "overflow-hidden"
            )}
          >
            {isGenerating && <GeneratingIndicator accentColor={summary.accentColor} />}

            <AnimatePresence mode="wait" initial={false}>
              {hasPlan && !isGenerating && (
                <motion.div
                  key={summary.id + stops.length}
                  initial={reducedMotion ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={reducedMotion ? undefined : { opacity: 0 }}
                  transition={motionTransition(reducedMotion, { duration: 0.25 })}
                  className="space-y-2"
                >
                  {stops.map((stop, index) => (
                    <PlanStopCard
                      key={stop.id}
                      stop={stop}
                      index={index}
                      accentColor={summary.accentColor}
                      glowColor={summary.glowColor}
                      focused={focusedStopId === stop.id}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence initial={false}>
              {messages.map((message) => (
                <ChatMessageBubble
                  key={message.id}
                  message={message}
                  accentColor={summary.accentColor}
                />
              ))}
            </AnimatePresence>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
