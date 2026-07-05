"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Feature, LineString } from "geojson";
import {
  clearUiDevCache,
  hydrateIntent,
  isUiDevCacheEnabled,
  loadUiDevCache,
  saveUiDevCache,
  serializeIntent,
  type UiDevCachePayload,
} from "@/lib/dev/ui-dev-cache";
import {
  buildIdleIntent,
  buildIntentFromApi,
  buildIntentFromParsedShell,
  buildShellIntent,
  parseFreeformIntent,
  PRESET_INTENTS,
  PRESET_BY_ID,
  type LivingParisIntent,
  type PresetIntentId,
} from "@/lib/living-paris-intent";
import type { ExperienceResult, IntentQuery, LayerType } from "@/lib/types";
import type { RouteResponse } from "@/services/routing/route-planner";
import { useChat } from "@/hooks/useChat";

function emojiForIntent(intentId: string, result: ExperienceResult | null): string {
  if (result?.experience.emoji) return result.experience.emoji;
  const preset = PRESET_INTENTS.find((item) => item.id === intentId);
  return preset?.emoji ?? "✨";
}

function initialFromCache() {
  const cached = loadUiDevCache();
  if (!cached) return null;
  return {
    currentIntent: hydrateIntent(cached.intent),
    selectedPresetId: cached.selectedPresetId,
    livingParisResponse: cached.livingParisResponse,
    result: cached.result,
    routeGeometry: cached.routeGeometry,
    hiddenLayers: new Set(cached.hiddenLayers),
    mapSnapshot: cached.mapSnapshot ?? null,
    savedAt: cached.savedAt,
  };
}

export function useLivingParisIntent() {
  const devCacheEnabled = isUiDevCacheEnabled();
  const boot = devCacheEnabled ? initialFromCache() : null;

  const { sendMessage, intentSource } = useChat();
  const [currentIntent, setCurrentIntent] = useState<LivingParisIntent>(
    boot?.currentIntent ?? buildIdleIntent()
  );
  const [selectedPresetId, setSelectedPresetId] = useState<PresetIntentId | null>(
    boot?.selectedPresetId ?? null
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [livingParisResponse, setLivingParisResponse] = useState<string | null>(
    boot?.livingParisResponse ?? null
  );
  const [result, setResult] = useState<ExperienceResult | null>(boot?.result ?? null);
  const [route, setRoute] = useState<RouteResponse | null>(null);
  const [routeGeometry, setRouteGeometry] = useState<Feature<LineString> | null>(
    boot?.routeGeometry ?? null
  );
  const [hiddenLayers, setHiddenLayers] = useState<Set<LayerType>>(
    boot?.hiddenLayers ?? new Set()
  );
  const [mapSnapshot, setMapSnapshot] = useState<string | null>(boot?.mapSnapshot ?? null);
  const [cacheSavedAt, setCacheSavedAt] = useState<string | null>(boot?.savedAt ?? null);
  const [useLiveMap, setUseLiveMap] = useState(!boot?.mapSnapshot);

  const intentRef = useRef<IntentQuery | undefined>(boot?.result?.intent);
  const abortRef = useRef<AbortController | null>(null);
  const stateRef = useRef({
    currentIntent: boot?.currentIntent ?? buildIdleIntent(),
    selectedPresetId: boot?.selectedPresetId ?? null,
    livingParisResponse: boot?.livingParisResponse ?? null,
    result: boot?.result ?? null,
    routeGeometry: boot?.routeGeometry ?? null,
    hiddenLayers: boot?.hiddenLayers ?? new Set<LayerType>(),
    mapSnapshot: boot?.mapSnapshot ?? null,
  });

  const presetIntents = PRESET_INTENTS.map((preset) => ({
    id: preset.id,
    label: preset.label,
    emoji: preset.emoji,
    accentColor: preset.accentColor,
  }));

  const persistCache = useCallback(
    (snapshot?: string | null) => {
      if (!devCacheEnabled) return;

      const {
        currentIntent: intent,
        selectedPresetId: presetId,
        livingParisResponse: response,
        result: experience,
        routeGeometry: geometry,
        hiddenLayers: layers,
        mapSnapshot: existingSnapshot,
      } = stateRef.current;

      if (!experience) return;

      const nextSnapshot = snapshot ?? existingSnapshot ?? undefined;
      const payload: UiDevCachePayload = {
        version: 1,
        savedAt: new Date().toISOString(),
        selectedPresetId: presetId,
        livingParisResponse: response,
        intent: serializeIntent(intent, emojiForIntent(intent.id, experience)),
        result: experience,
        routeGeometry: geometry,
        hiddenLayers: [...layers],
        mapSnapshot: nextSnapshot,
      };

      if (saveUiDevCache(payload)) {
        setCacheSavedAt(payload.savedAt);
        if (nextSnapshot) {
          setMapSnapshot(nextSnapshot);
          setUseLiveMap(false);
        }
      }
    },
    [devCacheEnabled]
  );

  useEffect(() => {
    stateRef.current = {
      currentIntent,
      selectedPresetId,
      livingParisResponse,
      result,
      routeGeometry,
      hiddenLayers,
      mapSnapshot,
    };
  }, [
    currentIntent,
    hiddenLayers,
    livingParisResponse,
    mapSnapshot,
    result,
    routeGeometry,
    selectedPresetId,
  ]);

  const toggleLayer = useCallback((layer: LayerType) => {
    setHiddenLayers((prev) => {
      const next = new Set(prev);
      if (next.has(layer)) next.delete(layer);
      else next.add(layer);
      return next;
    });
  }, []);

  const applyExperience = useCallback(
    (
      enriched: LivingParisIntent,
      experience: ExperienceResult,
      nextRoute: RouteResponse | null,
      reply: string
    ) => {
      setCurrentIntent(enriched);
      setResult(experience);
      setRoute(nextRoute);
      setRouteGeometry(nextRoute?.geometry ?? null);
      setHiddenLayers(new Set());
      setLivingParisResponse(reply);
      setUseLiveMap(true);
    },
    []
  );

  const runQuery = useCallback(
    async (
      promptText: string,
      shell: LivingParisIntent,
      theme: Parameters<typeof buildIntentFromApi>[0]
    ) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setIsGenerating(true);
      setCurrentIntent(shell);
      setLivingParisResponse(null);
      setUseLiveMap(true);

      try {
        const data = await sendMessage(promptText, {
          intent: intentRef.current,
          context: { lat: 48.8566, lon: 2.3522 },
          signal: controller.signal,
        });

        intentRef.current = data.intent;
        const enriched = buildIntentFromApi(theme, data.result, data.route, data.reply);
        applyExperience(enriched, data.result, data.route, data.reply);
        persistCache();
        return data;
      } finally {
        if (abortRef.current === controller) {
          setIsGenerating(false);
        }
      }
    },
    [applyExperience, persistCache, sendMessage]
  );

  const selectPreset = useCallback(
    async (intentId: PresetIntentId) => {
      const preset = PRESET_BY_ID[intentId];
      setSelectedPresetId(intentId);
      const shell = buildShellIntent(preset, {
        response: "Living Paris is planning…",
      });
      await runQuery(preset.prompt, shell, { preset, shell });
    },
    [runQuery]
  );

  const submitFreeformIntent = useCallback(
    async (text: string) => {
      const parsed = parseFreeformIntent(text);
      setSelectedPresetId(parsed.presetId ?? null);
      const shell = buildIntentFromParsedShell(parsed);
      shell.response = "Living Paris is planning…";
      setCurrentIntent(shell);
      setUseLiveMap(true);

      const prompt = parsed.promptText;
      const preset = parsed.presetId ? PRESET_BY_ID[parsed.presetId] : undefined;

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setIsGenerating(true);
      setLivingParisResponse(null);

      try {
        const patch: IntentQuery = {};
        if (parsed.timeBudgetMinutes != null) patch.timeBudget = parsed.timeBudgetMinutes;
        if (parsed.budget != null) patch.budget = parsed.budget;
        if (parsed.mapMood === "rainy") patch.rainy = true;
        intentRef.current = { ...intentRef.current, ...patch };

        const data = await sendMessage(prompt, {
          intent: intentRef.current,
          context: { lat: 48.8566, lon: 2.3522 },
          signal: controller.signal,
        });

        intentRef.current = data.intent;
        const enriched = buildIntentFromApi(
          { preset, parsed, shell },
          data.result,
          data.route,
          data.reply
        );
        applyExperience(enriched, data.result, data.route, data.reply);
        persistCache();
        return data;
      } finally {
        if (abortRef.current === controller) {
          setIsGenerating(false);
        }
      }
    },
    [applyExperience, persistCache, sendMessage]
  );

  const captureMapSnapshot = useCallback(
    async (capture: () => Promise<string | null>) => {
      const snapshot = await capture();
      if (!snapshot) return false;
      persistCache(snapshot);
      return true;
    },
    [persistCache]
  );

  const clearDevCache = useCallback(() => {
    clearUiDevCache();
    setMapSnapshot(null);
    setCacheSavedAt(null);
    setUseLiveMap(true);
  }, []);

  return {
    currentIntent,
    presetIntents,
    selectedPresetId,
    selectPreset,
    submitFreeformIntent,
    isGenerating,
    livingParisResponse,
    intentSource,
    result,
    route,
    routeGeometry,
    hiddenLayers,
    toggleLayer,
    devCache: {
      enabled: devCacheEnabled,
      frozen: devCacheEnabled && !useLiveMap && !!mapSnapshot,
      useLiveMap,
      mapSnapshot,
      savedAt: cacheSavedAt,
      setUseLiveMap,
      captureMapSnapshot,
      clearDevCache,
      persistCache,
    },
  };
}
