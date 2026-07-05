"use client";

import { useCallback, useRef, useState } from "react";
import type { Feature, LineString } from "geojson";
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

export function useLivingParisIntent() {
  const { sendMessage, intentSource } = useChat();
  const [currentIntent, setCurrentIntent] = useState<LivingParisIntent>(buildIdleIntent());
  const [selectedPresetId, setSelectedPresetId] = useState<PresetIntentId | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [livingParisResponse, setLivingParisResponse] = useState<string | null>(null);
  const [result, setResult] = useState<ExperienceResult | null>(null);
  const [route, setRoute] = useState<RouteResponse | null>(null);
  const [routeGeometry, setRouteGeometry] = useState<Feature<LineString> | null>(null);
  const [hiddenLayers, setHiddenLayers] = useState<Set<LayerType>>(new Set());
  const intentRef = useRef<IntentQuery | undefined>(undefined);
  const abortRef = useRef<AbortController | null>(null);

  const presetIntents = PRESET_INTENTS.map((preset) => ({
    id: preset.id,
    label: preset.label,
    emoji: preset.emoji,
    accentColor: preset.accentColor,
  }));

  const toggleLayer = useCallback((layer: LayerType) => {
    setHiddenLayers((prev) => {
      const next = new Set(prev);
      if (next.has(layer)) next.delete(layer);
      else next.add(layer);
      return next;
    });
  }, []);

  const runQuery = useCallback(
    async (promptText: string, shell: LivingParisIntent, theme: Parameters<typeof buildIntentFromApi>[0]) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setIsGenerating(true);
      setCurrentIntent(shell);
      setLivingParisResponse(null);

      try {
        const data = await sendMessage(promptText, {
          intent: intentRef.current,
          context: { lat: 48.8566, lon: 2.3522 },
          signal: controller.signal,
        });

        intentRef.current = data.intent;
        const enriched = buildIntentFromApi(theme, data.result, data.route, data.reply);
        setCurrentIntent(enriched);
        setResult(data.result);
        setRoute(data.route);
        setRouteGeometry(data.route?.geometry ?? null);
        setHiddenLayers(new Set());
        setLivingParisResponse(data.reply);
        return data;
      } finally {
        if (abortRef.current === controller) {
          setIsGenerating(false);
        }
      }
    },
    [sendMessage]
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
        setCurrentIntent(enriched);
        setResult(data.result);
        setRoute(data.route);
        setRouteGeometry(data.route?.geometry ?? null);
        setHiddenLayers(new Set());
        setLivingParisResponse(data.reply);
        return data;
      } finally {
        if (abortRef.current === controller) {
          setIsGenerating(false);
        }
      }
    },
    [sendMessage]
  );

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
  };
}
