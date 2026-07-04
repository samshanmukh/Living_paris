import type { Messages } from "../types";

export const en: Messages = {
  language: {
    label: "Language",
    english: "English",
    french: "French",
  },
  brand: {
    eyebrow: "Living Paris",
    title: "Conversation-led city companion",
  },
  status: {
    checking: "checking backend",
    worker: "Worker API online",
    local: "local backend fallback",
    offline: "backend disconnected",
    mapReady: "3D map ready",
    mapLoading: "loading map",
  },
  chat: {
    panelEyebrow: "Ask the city",
    panelTitle: "Chat interface",
    newChat: "New chat",
    thinking: "Querying spatial backend...",
    examples: "Examples",
    placeholder: "Describe the experience you want...",
    send: "Send message",
  },
  messages: {
    loading:
      "Loading Paris datasets. Ask for an experience and I will query the spatial backend, route planner, and 3D map layers.",
    reset:
      "New chat started. Pick a common option or describe what you want to do in Paris.",
    backendError:
      "I could not reach the spatial backend yet. The static map shell is still available while the API starts.",
    queryFailed:
      "The backend query failed. Check that the Next server is still running, then try again.",
  },
  commonOptions: [
    {
      label: "Places to see",
      userText: "Show me places to see near central Paris.",
      apiText:
        "Show me places to see near central Paris: museums, parks, and scenic viewpoints.",
    },
    {
      label: "Cafes",
      userText: "Find good cafes nearby with a short walk.",
      apiText: "Find good cafes nearby with a short walk.",
    },
    {
      label: "Museums",
      userText: "Show me museums and art places I can visit today.",
      apiText: "Show me museums and art places I can visit today.",
    },
    {
      label: "Rain plan",
      userText: "It is raining. Find indoor places and metro-friendly stops.",
      apiText: "It is raining. Find indoor places and metro-friendly stops.",
    },
    {
      label: "Accessible route",
      userText: "Find accessible places and build a step-free walking route.",
      apiText: "Find accessible places and build a step-free walking route.",
    },
    {
      label: "Local gems",
      userText: "Show me quiet local places tourists usually miss.",
      apiText: "Show me quiet local places tourists usually miss.",
    },
  ],
  promptChips: [
    {
      label: "Romantic evening",
      userText: "Plan a romantic evening under EUR 60.",
      apiText: "Plan a romantic evening under EUR 60.",
    },
    {
      label: "Rainy day",
      userText: "It is raining and I have two hours before my train.",
      apiText: "It is raining and I have two hours before my train.",
    },
    {
      label: "Hidden gems",
      userText: "Show me quiet local places tourists miss.",
      apiText: "Show me quiet local places tourists miss.",
    },
    {
      label: "Accessible route",
      userText: "I am blind near the Eiffel Tower. Take me to Trocadero.",
      apiText: "I am blind near the Eiffel Tower. Take me to Trocadero.",
    },
  ],
  layers: {
    route: "Route",
    places: "Places",
    signals: "Signals",
    senses: "Senses",
  },
  experience: {
    panelLabel: "Current experience",
    datasets: "datasets",
    workerBackend: "Cloudflare Worker",
    localBackend: "FileDataStore",
    backendMatches: "backend matches",
    queryRadius: "query radius",
    queryTime: "query time",
    minWalk: "min walk",
    indoor: "indoor",
    accessible: "accessible",
  },
  intent: {
    mode: "mode",
    layers: "layers",
    mood: "mood",
    walk: "walk",
    budget: "budget",
    access: "access",
    weather: "weather",
    initializing: "initializing",
    sceneDefaults: "scene defaults",
    general: "general",
    auto: "auto",
    rainAware: "rain-aware",
    stepFree: "step-free",
  },
  scenes: {
    "borrowed-senses": {
      label: "Borrowed Senses",
      headline: "Paris becomes a live sensory mesh.",
      command: "I am blind near the Eiffel Tower. Take me to Trocadero.",
    },
    "rainy-day": {
      label: "Rainy Day",
      headline: "The city reshapes around weather and time.",
      command: "It is raining and I have two hours before my train.",
    },
    "date-night": {
      label: "Date Night",
      headline: "Recommendations become animated city choreography.",
      command: "Plan a cinematic date night under 60 euros.",
    },
    "hidden-gems": {
      label: "Hidden Gems",
      headline: "The obvious city fades; the hidden city lights up.",
      command: "Show me quiet local places tourists miss.",
    },
  },
};
