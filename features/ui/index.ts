export type {
  UiChatMessage,
  UiChatRole,
  UiExperiencePlan,
  UiExperienceSummary,
  UiIntentSummary,
  UiItineraryStop,
  UiPlanStop,
  UiPresetChip,
  UiRecommendation,
  UiRouteSummary,
} from "@/features/ui/types";

export { palette, drawerSnap, layerDotClass } from "@/features/ui/tokens";
export {
  chipVariants,
  fadeUp,
  messageVariants,
  motionTransition,
  springSnappy,
  stopVariants,
} from "@/features/ui/motion";

export {
  toUiChatMessages,
  toUiExperiencePlan,
  toUiIntentSummary,
  toUiPlanStops,
  toUiPresetChips,
  type DomainChatMessage,
} from "@/features/ui/adapters/living-paris";

export { default as BrandPill } from "@/features/ui/components/BrandPill";
export { default as ChatMessageBubble } from "@/features/ui/components/ChatMessageBubble";
export { default as ComposerBar } from "@/features/ui/components/ComposerBar";
export { default as ExperiencePlanCard } from "@/features/ui/components/ExperiencePlanCard";
export { default as GeneratingIndicator } from "@/features/ui/components/GeneratingIndicator";
export { default as IntentDrawerShell } from "@/features/ui/components/IntentDrawerShell";
export { default as IntentHeaderCard } from "@/features/ui/components/IntentHeaderCard";
export { default as LanguagePicker, type LanguageOption } from "@/features/ui/components/LanguagePicker";
export { default as MoodGlowOverlay } from "@/features/ui/components/MoodGlowOverlay";
export { default as PlanStopCard } from "@/features/ui/components/PlanStopCard";
export { default as PresetChipRow } from "@/features/ui/components/PresetChipRow";
export { default as ResponseBubble } from "@/features/ui/components/ResponseBubble";
export { default as VoiceListeningOverlay } from "@/features/ui/components/VoiceListeningOverlay";

export { uiDemoFixtures } from "@/features/ui/demo/fixtures";
export { default as LivingParisUiDemo } from "@/features/ui/demo/LivingParisUiDemo";
