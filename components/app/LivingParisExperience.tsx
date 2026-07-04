"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  CloudRain,
  Database,
  Layers,
  Map,
  Plus,
  Radio,
  Route,
  Send,
  Sparkles,
  Wifi,
  WifiOff
} from "lucide-react";
import { ParisMapCanvas, type VisibleMapLayers } from "@/components/map/ParisMapCanvas";
import type { BackendSource, ExperienceResponse } from "@/lib/experience-types";
import {
  sceneById,
  sceneMapStateById,
  scenes,
  type Coordinate,
  type SceneId
} from "@/lib/parisVisualizationData";
import type { IntentQuery, LayerMeta, ParisFeature } from "@/lib/types";

type ApiStatus = "checking" | "worker" | "local" | "offline";
type Message = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

type StatusResponse = {
  backendSource: BackendSource;
  datasets: LayerMeta[];
  warnings: string[];
};

type LayerToggle = {
  id: keyof VisibleMapLayers;
  label: string;
  icon: typeof Route;
};

const sceneIcons = {
  "borrowed-senses": Radio,
  "rainy-day": CloudRain,
  "date-night": Sparkles,
  "hidden-gems": Map
} satisfies Record<SceneId, typeof Route>;

const layerToggles: LayerToggle[] = [
  { id: "route", label: "Route", icon: Route },
  { id: "places", label: "Places", icon: Map },
  { id: "risk", label: "Signals", icon: Layers },
  { id: "senses", label: "Senses", icon: Radio }
];

const promptChips = [
  "Plan a romantic evening under EUR 60.",
  "It is raining and I have two hours before my train.",
  "Show me quiet local places tourists miss.",
  "I am blind near the Eiffel Tower. Take me to Trocadero."
];

const commonOptions = [
  {
    label: "Places to see",
    prompt: "Show me places to see near central Paris: museums, parks, and scenic viewpoints.",
    icon: Map
  },
  {
    label: "Cafes",
    prompt: "Find good cafes nearby with a short walk.",
    icon: Sparkles
  },
  {
    label: "Museums",
    prompt: "Show me museums and art places I can visit today.",
    icon: Layers
  },
  {
    label: "Rain plan",
    prompt: "It is raining. Find indoor places and metro-friendly stops.",
    icon: CloudRain
  },
  {
    label: "Accessible route",
    prompt: "Find accessible places and build a step-free walking route.",
    icon: Route
  },
  {
    label: "Local gems",
    prompt: "Show me quiet local places tourists usually miss.",
    icon: Radio
  }
];

const initialPrompt = promptChips[0];

const initialMessages: Message[] = [
  {
    id: "assistant-initial",
    role: "assistant",
    text:
      "Loading Paris datasets. Ask for an experience and I will query the spatial backend, route planner, and 3D map layers."
  }
];

export function LivingParisExperience() {
  const [activeSceneId, setActiveSceneId] = useState<SceneId>("date-night");
  const [visibleLayers, setVisibleLayers] = useState<VisibleMapLayers>({
    route: true,
    places: true,
    risk: true,
    senses: true
  });
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);
  const [selectedFeatureId, setSelectedFeatureId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [apiStatus, setApiStatus] = useState<ApiStatus>("checking");
  const [backendSource, setBackendSource] = useState<BackendSource | null>(null);
  const [datasets, setDatasets] = useState<LayerMeta[]>([]);
  const [experience, setExperience] = useState<ExperienceResponse | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);

  const activeScene = sceneById(activeSceneId);
  const activeMapState = sceneMapStateById(activeSceneId);
  const backendFeatures = experience?.spatial.geojson.features ?? [];
  const routePath = useMemo(
    () =>
      experience?.route?.geometry.geometry.coordinates.map(
        ([lon, lat]) => [lon, lat] as Coordinate
      ),
    [experience?.route]
  );
  const selectedFeature =
    backendFeatures.find((feature) => feature.properties.id === selectedFeatureId) ??
    backendFeatures[0] ??
    null;
  const selectedVenue =
    activeMapState.venues.find((venue) => venue.id === selectedVenueId) ??
    activeMapState.venues[0] ??
    null;
  const panelMetrics = experience
    ? [
        {
          label: "backend matches",
          value: String(experience.spatial.totalFeatures),
          tone: "places"
        },
        {
          label: experience.route?.provider ?? "query radius",
          value: experience.route
            ? `${experience.route.durationMinutes}m`
            : `${Math.round(experience.spatial.meta.radiusMeters)}m`,
          tone: "route"
        },
        {
          label: "query time",
          value: `${experience.spatial.meta.queryMs}ms`,
          tone: "senses"
        }
      ]
    : activeMapState.metrics;

  const applyExperience = useCallback((payload: ExperienceResponse) => {
    setExperience(payload);
    setActiveSceneId(payload.sceneId);
    setBackendSource(payload.backendSource);
    setDatasets(payload.datasets);
    setApiStatus(payload.backendSource === "worker" ? "worker" : "local");
    setSelectedFeatureId(payload.spatial.geojson.features[0]?.properties.id ?? null);
    setSelectedVenueId(null);
  }, []);

  const resetChat = useCallback(() => {
    setMessages([
      {
        id: `assistant-reset-${Date.now()}`,
        role: "assistant",
        text:
          "New chat started. Pick a common option or describe what you want to do in Paris."
      }
    ]);
    setInput("");
    setExperience(null);
    setSelectedFeatureId(null);
    setSelectedVenueId(null);
    setActiveSceneId("date-night");
    setIsThinking(false);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function loadInitialExperience() {
      try {
        const statusResponse = await fetch("/api/chat", {
          cache: "no-store",
          signal: controller.signal
        });

        if (statusResponse.ok) {
          const status = (await statusResponse.json()) as StatusResponse;
          setBackendSource(status.backendSource);
          setDatasets(status.datasets);
          setApiStatus(status.backendSource === "worker" ? "worker" : "local");
        }

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: initialPrompt, currentSceneId: "date-night" }),
          signal: controller.signal
        });

        if (!response.ok) throw new Error("Initial backend query failed");

        const payload = (await response.json()) as ExperienceResponse;
        applyExperience(payload);
        setMessages([
          initialMessages[0],
          {
            id: "assistant-backend-ready",
            role: "assistant",
            text: payload.reply
          }
        ]);
      } catch {
        if (!controller.signal.aborted) {
          setApiStatus("offline");
          setMessages([
            initialMessages[0],
            {
              id: "assistant-backend-error",
              role: "assistant",
              text:
                "I could not reach the spatial backend yet. The static map shell is still available while the API starts."
            }
          ]);
        }
      }
    }

    void loadInitialExperience();

    return () => controller.abort();
  }, [applyExperience]);

  const runPrompt = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isThinking) return;

      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: "user",
        text: trimmed
      };
      setMessages((current) => [...current, userMessage]);
      setInput("");
      setIsThinking(true);

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: trimmed, currentSceneId: activeSceneId })
        });

        if (!response.ok) {
          throw new Error("Chat route failed");
        }

        const payload = (await response.json()) as ExperienceResponse;
        applyExperience(payload);
        setMessages((current) => [
          ...current,
          {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            text: payload.reply
          }
        ]);
      } catch {
        setApiStatus("offline");
        setMessages((current) => [
          ...current,
          {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            text: "The backend query failed. Check that the Next server is still running, then try again."
          }
        ]);
      } finally {
        setIsThinking(false);
      }
    },
    [activeSceneId, applyExperience, isThinking]
  );

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void runPrompt(input);
  };

  const statusLabel = useMemo(() => {
    if (apiStatus === "checking") return "checking backend";
    if (apiStatus === "worker") return "Worker API online";
    if (apiStatus === "local") return "local backend fallback";
    return "backend disconnected";
  }, [apiStatus]);

  const StatusIcon = apiStatus === "offline" ? WifiOff : Wifi;

  return (
    <main className="living-paris-team-app">
      <ParisMapCanvas
        backendFeatures={backendFeatures}
        onFeatureSelect={setSelectedFeatureId}
        queryCenter={experience?.spatial.meta.center}
        queryRadiusMeters={experience?.spatial.meta.radiusMeters}
        routePathOverride={routePath}
        sceneId={activeSceneId}
        selectedFeatureId={selectedFeature?.properties.id ?? null}
        selectedVenueId={selectedVenue?.id ?? null}
        visibleLayers={visibleLayers}
        onReadyChange={setIsMapReady}
      />

      <header className="team-topbar">
        <div className="brand-lockup">
          <span className="brand-mark">LP</span>
          <div>
            <p className="eyebrow">Living Paris</p>
            <h1>Conversation-led city companion</h1>
          </div>
        </div>
        <div className="runtime-status">
          <span className={apiStatus === "worker" ? "status-dot online" : "status-dot"} />
          <StatusIcon size={15} aria-hidden="true" />
          <span>{statusLabel}</span>
          <span className="map-status">{isMapReady ? "3D map ready" : "loading map"}</span>
        </div>
      </header>

      <aside className="conversation-panel" aria-label="AI conversation">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Ask the city</p>
            <h2>Chat interface</h2>
          </div>
          <button className="secondary-command" type="button" onClick={resetChat}>
            <Plus size={16} aria-hidden="true" />
            <span>New chat</span>
          </button>
        </div>

        <div className="message-list">
          {messages.map((message) => (
            <div className={`message-bubble ${message.role}`} key={message.id}>
              {message.text}
            </div>
          ))}
          {isThinking ? (
            <div className="message-bubble assistant">Querying spatial backend...</div>
          ) : null}
        </div>

        <div className="quick-actions" aria-label="Common options">
          {commonOptions.map((option) => {
            const OptionIcon = option.icon;
            return (
              <button
                className="option-chip"
                disabled={isThinking}
                key={option.label}
                type="button"
                onClick={() => void runPrompt(option.prompt)}
              >
                <span className="option-icon">
                  <OptionIcon size={15} aria-hidden="true" />
                </span>
                <strong>{option.label}</strong>
              </button>
            );
          })}
        </div>

        <details className="example-prompts">
          <summary>Examples</summary>
          <div className="example-list">
            {promptChips.map((prompt) => (
              <button
                disabled={isThinking}
                key={prompt}
                type="button"
                onClick={() => void runPrompt(prompt)}
              >
                {prompt}
              </button>
            ))}
          </div>
        </details>

        <form className="composer" onSubmit={handleSubmit}>
          <input
            aria-label="Message"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Describe the experience you want..."
          />
          <button type="submit" aria-label="Send message" disabled={isThinking || input.trim() === ""}>
            <Send size={17} aria-hidden="true" />
          </button>
        </form>
      </aside>

      <aside className="experience-panel" aria-label="Current experience">
        <div className="scene-badge">
          {(() => {
            const SceneIcon = sceneIcons[activeSceneId];
            return <SceneIcon size={18} aria-hidden="true" />;
          })()}
          <span>{activeScene.label}</span>
        </div>
        <h2>{activeScene.headline}</h2>
        <p>{experience?.reply ?? activeMapState.reply}</p>

        <div className="backend-strip">
          <span>
            <Database size={14} aria-hidden="true" />
            {datasets.length || experience?.datasets.length || 0} datasets
          </span>
          <span>{backendSource === "worker" ? "Cloudflare Worker" : "FileDataStore"}</span>
        </div>

        <div className="intent-row">
          {intentTokens(experience?.intent, experience?.spatial.layers).map((token) => (
            <span key={`${token.label}-${token.value}`}>
              {token.label}: {token.value}
            </span>
          ))}
        </div>

        <div className="metric-grid">
          {panelMetrics.map((metric) => (
            <div className={`metric-card ${metric.tone}`} key={metric.label}>
              <strong>{metric.value}</strong>
              <span>{metric.label}</span>
            </div>
          ))}
        </div>

        <div className="stop-list">
          {backendFeatures.length
            ? backendFeatures.slice(0, 14).map((feature, index) => (
                <button
                  className={feature.properties.id === selectedFeature?.properties.id ? "active" : ""}
                  key={feature.properties.id}
                  type="button"
                  onClick={() => setSelectedFeatureId(feature.properties.id)}
                >
                  <span>{index + 1}</span>
                  <div>
                    <strong>{feature.properties.name}</strong>
                    <small>{featureMeta(feature)}</small>
                  </div>
                </button>
              ))
            : activeMapState.venues.map((venue) => (
                <button
                  className={venue.id === selectedVenue?.id ? "active" : ""}
                  key={venue.id}
                  type="button"
                  onClick={() => setSelectedVenueId(venue.id)}
                >
                  <span>{venue.rank ?? "-"}</span>
                  <div>
                    <strong>{venue.name}</strong>
                    <small>
                      {venue.category}
                      {venue.walkMinutes ? ` · ${venue.walkMinutes} min walk` : ""}
                    </small>
                  </div>
                </button>
              ))}
        </div>
      </aside>

      <nav className="scene-rail" aria-label="Experience presets">
        {scenes.map((scene) => {
          const SceneIcon = sceneIcons[scene.id];
          return (
            <button
              className={scene.id === activeSceneId ? "active" : ""}
              key={scene.id}
              type="button"
              onClick={() => void runPrompt(scene.command)}
            >
              <SceneIcon size={17} aria-hidden="true" />
              <span>{scene.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="layer-dock" aria-label="Map layers">
        {layerToggles.map((layer) => {
          const LayerIcon = layer.icon;
          const isActive = visibleLayers[layer.id];
          return (
            <button
              className={isActive ? "active" : ""}
              key={layer.id}
              type="button"
              aria-pressed={isActive}
              onClick={() =>
                setVisibleLayers((current) => ({
                  ...current,
                  [layer.id]: !current[layer.id]
                }))
              }
            >
              <LayerIcon size={16} aria-hidden="true" />
              <span>{layer.label}</span>
            </button>
          );
        })}
      </div>
    </main>
  );
}

function intentTokens(intent?: IntentQuery, layers?: string[]) {
  if (!intent) {
    return [
      { label: "mode", value: "initializing" },
      { label: "layers", value: "scene defaults" }
    ];
  }

  const tokens = [
    { label: "mood", value: intent.mood ?? "general" },
    { label: "layers", value: layers?.join(", ") ?? "auto" },
    { label: "walk", value: intent.walk ? `${intent.walk}m` : "auto" }
  ];

  if (intent.budget) tokens.push({ label: "budget", value: `EUR ${intent.budget}` });
  if (intent.accessibility) tokens.push({ label: "access", value: "step-free" });
  if (intent.rainy) tokens.push({ label: "weather", value: "rain-aware" });

  return tokens;
}

function featureMeta(feature: ParisFeature) {
  const props = feature.properties;
  const parts = [layerLabel(props.layer)];
  if (props.address) parts.push(props.address);
  if (props.arrondissement) parts.push(props.arrondissement);
  if (props.indoor) parts.push("indoor");
  if (props.accessible) parts.push("accessible");
  return parts.join(" · ");
}

function layerLabel(layer: string) {
  return layer
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
