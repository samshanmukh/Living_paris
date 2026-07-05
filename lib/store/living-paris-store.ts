"use client";

import { create } from "zustand";
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
import type { IntegratedChatResponse } from "@/lib/integrated-chat-types";
import type { ExperienceResult, IntentQuery, LayerType } from "@/lib/types";
import type { RouteResponse } from "@/services/routing/route-planner";

function emojiForIntent(intentId: string, result: ExperienceResult | null): string {
  if (result?.experience.emoji) return result.experience.emoji;
  const preset = PRESET_INTENTS.find((item) => item.id === intentId);
  return preset?.emoji ?? "✨";
}

type ChatHistoryEntry = { role: "user" | "assistant"; content: string };

async function postChat(
  message: string,
  intent: IntentQuery | undefined,
  history: ChatHistoryEntry[],
  signal: AbortSignal
): Promise<IntegratedChatResponse> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      intent,
      history,
      context: { lat: 48.8566, lon: 2.3522 },
    }),
    signal,
  });

  const data = (await res.json()) as IntegratedChatResponse & { error?: string };
  if (!res.ok) throw new Error(data.error ?? `Chat failed (${res.status})`);
  if (!data.reply || !data.result?.mapState) {
    throw new Error("Chat response missing reply or result.mapState");
  }
  return data;
}

interface LivingParisState {
  currentIntent: LivingParisIntent;
  selectedPresetId: PresetIntentId | null;
  isGenerating: boolean;
  livingParisResponse: string | null;
  intentSource: IntegratedChatResponse["intentSource"] | null;
  result: ExperienceResult | null;
  route: RouteResponse | null;
  routeGeometry: Feature<LineString> | null;
  hiddenLayers: Set<LayerType>;
  mapSnapshot: string | null;
  cacheSavedAt: string | null;
  useLiveMap: boolean;

  selectPreset: (intentId: PresetIntentId) => Promise<void>;
  submitFreeformIntent: (text: string) => Promise<void>;
  toggleLayer: (layer: LayerType) => void;
  setUseLiveMap: (value: boolean) => void;
  persistCache: (snapshot?: string | null) => void;
  captureMapSnapshot: (capture: () => Promise<string | null>) => Promise<boolean>;
  clearDevCache: () => void;
}

function bootFromCache() {
  if (!isUiDevCacheEnabled()) return null;
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
    cacheSavedAt: cached.savedAt,
    useLiveMap: !cached.mapSnapshot,
  };
}

let intentQuery: IntentQuery | undefined;
let abortController: AbortController | null = null;
let chatHistory: ChatHistoryEntry[] = [];

export const useLivingParisStore = create<LivingParisState>((set, get) => {
  const boot = bootFromCache();
  intentQuery = boot?.result?.intent;

  const applyResponse = (
    enriched: LivingParisIntent,
    data: IntegratedChatResponse
  ) => {
    set({
      currentIntent: enriched,
      result: data.result,
      route: data.route,
      routeGeometry: data.route?.geometry ?? null,
      hiddenLayers: new Set(),
      livingParisResponse: data.reply,
      intentSource: data.intentSource,
      useLiveMap: true,
    });
    get().persistCache();
  };

  const runQuery = async (
    prompt: string,
    theme: Parameters<typeof buildIntentFromApi>[0],
    options: {
      shell: LivingParisIntent;
      presetId: PresetIntentId | null;
      intentPatch?: IntentQuery;
    }
  ) => {
    abortController?.abort();
    const controller = new AbortController();
    abortController = controller;

    // Snapshot for rollback so a failed query doesn't strand the planning shell
    // over the previous plan's map and cards.
    const previous = {
      currentIntent: get().currentIntent,
      selectedPresetId: get().selectedPresetId,
      livingParisResponse: get().livingParisResponse,
    };
    const previousIntentQuery = intentQuery;

    set({
      currentIntent: options.shell,
      selectedPresetId: options.presetId,
      isGenerating: true,
      livingParisResponse: null,
      useLiveMap: true,
    });

    try {
      if (options.intentPatch) intentQuery = { ...intentQuery, ...options.intentPatch };
      const data = await postChat(
        prompt,
        intentQuery,
        chatHistory.slice(-10),
        controller.signal
      );
      intentQuery = data.intent;
      chatHistory = [
        ...chatHistory.slice(-18),
        { role: "user", content: prompt },
        { role: "assistant", content: data.reply },
      ];
      const enriched = buildIntentFromApi(theme, data.result, data.route, data.reply);
      applyResponse(enriched, data);
    } catch (error) {
      // Superseded request — the newer query owns the UI now.
      const aborted = error instanceof DOMException && error.name === "AbortError";
      if (!aborted && abortController === controller) {
        intentQuery = previousIntentQuery;
        set(previous);
      }
      throw error;
    } finally {
      if (abortController === controller) {
        set({ isGenerating: false });
      }
    }
  };

  return {
    currentIntent: boot?.currentIntent ?? buildIdleIntent(),
    selectedPresetId: boot?.selectedPresetId ?? null,
    isGenerating: false,
    livingParisResponse: boot?.livingParisResponse ?? null,
    intentSource: null,
    result: boot?.result ?? null,
    route: null,
    routeGeometry: boot?.routeGeometry ?? null,
    hiddenLayers: boot?.hiddenLayers ?? new Set<LayerType>(),
    mapSnapshot: boot?.mapSnapshot ?? null,
    cacheSavedAt: boot?.cacheSavedAt ?? null,
    useLiveMap: boot?.useLiveMap ?? true,

    selectPreset: async (intentId) => {
      const preset = PRESET_BY_ID[intentId];
      const shell = buildShellIntent(preset, {
        response: "Living Paris is planning…",
      });
      await runQuery(preset.prompt, { preset, shell }, { shell, presetId: intentId });
    },

    submitFreeformIntent: async (text) => {
      const parsed = parseFreeformIntent(text);
      const shell = buildIntentFromParsedShell(parsed);
      shell.response = "Living Paris is planning…";

      const preset = parsed.presetId ? PRESET_BY_ID[parsed.presetId] : undefined;
      const patch: IntentQuery = {};
      if (parsed.timeBudgetMinutes != null) patch.timeBudget = parsed.timeBudgetMinutes;
      if (parsed.budget != null) patch.budget = parsed.budget;
      if (parsed.mapMood === "rainy") patch.rainy = true;

      await runQuery(
        parsed.promptText,
        { preset, parsed, shell },
        { shell, presetId: parsed.presetId ?? null, intentPatch: patch }
      );
    },

    toggleLayer: (layer) => {
      set((state) => {
        const next = new Set(state.hiddenLayers);
        if (next.has(layer)) next.delete(layer);
        else next.add(layer);
        return { hiddenLayers: next };
      });
    },

    setUseLiveMap: (value) => set({ useLiveMap: value }),

    persistCache: (snapshot) => {
      if (!isUiDevCacheEnabled()) return;
      const state = get();
      if (!state.result) return;

      const nextSnapshot = snapshot ?? state.mapSnapshot ?? undefined;
      const payload: UiDevCachePayload = {
        version: 1,
        savedAt: new Date().toISOString(),
        selectedPresetId: state.selectedPresetId,
        livingParisResponse: state.livingParisResponse,
        intent: serializeIntent(
          state.currentIntent,
          emojiForIntent(state.currentIntent.id, state.result)
        ),
        result: state.result,
        routeGeometry: state.routeGeometry,
        hiddenLayers: [...state.hiddenLayers],
        mapSnapshot: nextSnapshot,
      };

      if (saveUiDevCache(payload)) {
        // Keep the live map for this session; frozen mode only kicks in on reload.
        set({
          cacheSavedAt: payload.savedAt,
          ...(nextSnapshot ? { mapSnapshot: nextSnapshot } : {}),
        });
      }
    },

    captureMapSnapshot: async (capture) => {
      const snapshot = await capture();
      if (!snapshot) return false;
      get().persistCache(snapshot);
      return true;
    },

    clearDevCache: () => {
      clearUiDevCache();
      set({ mapSnapshot: null, cacheSavedAt: null, useLiveMap: true });
    },
  };
});

export const PRESET_CHIP_OPTIONS = PRESET_INTENTS.map((preset) => ({
  id: preset.id,
  label: preset.label,
  emoji: preset.emoji,
  accentColor: preset.accentColor,
}));
