import type { SceneId } from "@/lib/parisVisualizationData";

export type Locale = "en" | "fr";

export type CommonOption = {
  label: string;
  userText: string;
  apiText: string;
};

export type SceneCopy = {
  label: string;
  headline: string;
  command: string;
};

export type Messages = {
  language: {
    label: string;
    english: string;
    french: string;
  };
  brand: {
    eyebrow: string;
    title: string;
  };
  status: {
    checking: string;
    worker: string;
    local: string;
    offline: string;
    mapReady: string;
    mapLoading: string;
  };
  chat: {
    panelEyebrow: string;
    panelTitle: string;
    newChat: string;
    thinking: string;
    examples: string;
    placeholder: string;
    send: string;
  };
  messages: {
    loading: string;
    reset: string;
    backendError: string;
    queryFailed: string;
  };
  commonOptions: CommonOption[];
  promptChips: CommonOption[];
  layers: {
    route: string;
    places: string;
    signals: string;
    senses: string;
  };
  experience: {
    panelLabel: string;
    datasets: string;
    workerBackend: string;
    localBackend: string;
    backendMatches: string;
    queryRadius: string;
    queryTime: string;
    minWalk: string;
    indoor: string;
    accessible: string;
  };
  intent: {
    mode: string;
    layers: string;
    mood: string;
    walk: string;
    budget: string;
    access: string;
    weather: string;
    initializing: string;
    sceneDefaults: string;
    general: string;
    auto: string;
    rainAware: string;
    stepFree: string;
  };
  scenes: Record<SceneId, SceneCopy>;
};
