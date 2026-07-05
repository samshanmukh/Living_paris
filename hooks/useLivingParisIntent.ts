"use client";

import { isUiDevCacheEnabled } from "@/lib/dev/ui-dev-cache";
import {
  PRESET_CHIP_OPTIONS,
  useLivingParisStore,
} from "@/lib/store/living-paris-store";

/** Thin selector over the zustand store — everything derives from currentIntent. */
export function useLivingParisIntent() {
  const store = useLivingParisStore();
  const devCacheEnabled = isUiDevCacheEnabled();

  return {
    currentIntent: store.currentIntent,
    presetIntents: PRESET_CHIP_OPTIONS,
    selectedPresetId: store.selectedPresetId,
    selectPreset: store.selectPreset,
    submitFreeformIntent: store.submitFreeformIntent,
    isGenerating: store.isGenerating,
    livingParisResponse: store.livingParisResponse,
    intentSource: store.intentSource,
    result: store.result,
    route: store.route,
    routeGeometry: store.routeGeometry,
    hiddenLayers: store.hiddenLayers,
    toggleLayer: store.toggleLayer,
    devCache: {
      enabled: devCacheEnabled,
      frozen: devCacheEnabled && !store.useLiveMap && !!store.mapSnapshot,
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
