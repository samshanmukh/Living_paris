"use client";

import { isUiDevCacheEnabled } from "@/lib/dev/ui-dev-cache";
import { isDemoMode, isSandboxRoute } from "@/lib/demo-mode";
import type { DemoScenarioId } from "@/lib/demo-bundles";
import type { PresetIntentId } from "@/lib/living-paris-intent";
import {
  DEMO_CHIP_OPTIONS,
  PRESET_CHIP_OPTIONS,
  useLivingParisStore,
} from "@/lib/store/living-paris-store";

/** Thin selector over the zustand store — everything derives from currentIntent. */
export function useLivingParisIntent() {
  const store = useLivingParisStore();
  const devCacheEnabled = isUiDevCacheEnabled();
  const demoMode = isDemoMode() && !isSandboxRoute();

  return {
    currentIntent: store.currentIntent,
    presetIntents: demoMode ? DEMO_CHIP_OPTIONS : PRESET_CHIP_OPTIONS,
    selectedPresetId: demoMode ? store.selectedDemoId : store.selectedPresetId,
    selectPreset: demoMode
      ? (id: PresetIntentId | DemoScenarioId) =>
          store.selectDemoScenario(id as DemoScenarioId)
      : store.selectPreset,
    submitFreeformIntent: store.submitFreeformIntent,
    isGenerating: store.isGenerating,
    livingParisResponse: store.livingParisResponse,
    intentSource: store.intentSource,
    result: store.result,
    route: store.route,
    routeGeometry: store.routeGeometry,
    hiddenLayers: store.hiddenLayers,
    toggleLayer: store.toggleLayer,
    activeDemoBundle: store.activeDemoBundle,
    isDemoMode: demoMode,
    devCache: {
      enabled: devCacheEnabled && !demoMode,
      frozen: devCacheEnabled && !demoMode && !store.useLiveMap && !!store.mapSnapshot,
      useLiveMap: store.useLiveMap,
      mapSnapshot: store.mapSnapshot,
      savedAt: store.cacheSavedAt,
      setUseLiveMap: store.setUseLiveMap,
      captureMapSnapshot: store.captureMapSnapshot,
      clearDevCache: store.clearDevCache,
      persistCache: store.persistCache,
    },
  };
}
