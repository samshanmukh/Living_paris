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
  WifiOff,
} from "lucide-react";
import { LanguageProvider, useLanguage } from "@/components/app/LanguageProvider";
import { LanguageSelector } from "@/components/app/LanguageSelector";
import { ParisMapCanvas, type VisibleMapLayers } from "@/components/map/ParisMapCanvas";
import type { BackendSource, ExperienceResponse } from "@/lib/experience-types";
import {
  sceneMapStateById,
  scenes,
  type Coordinate,
  type SceneId,
} from "@/lib/parisVisualizationData";
import type { Messages } from "@/lib/i18n";
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

const sceneIcons = {
  "borrowed-senses": Radio,
  "rainy-day": CloudRain,
  "date-night": Sparkles,
  "hidden-gems": Map,
} satisfies Record<SceneId, typeof Route>;

export function LivingParisExperience() {
  return (
    <LanguageProvider>
      <LivingParisExperienceInner />
    </LanguageProvider>
  );
}

function LivingParisExperienceInner() {
  const { t, ready } = useLanguage();
  const [activeSceneId, setActiveSceneId] = useState<SceneId>("date-night");
  const [visibleLayers, setVisibleLayers] = useState<VisibleMapLayers>({
    route: true,
    places: true,
    risk: true,
    senses: true,
  });
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);
  const [selectedFeatureId, setSelectedFeatureId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [apiStatus, setApiStatus] = useState<ApiStatus>("checking");
  const [backendSource, setBackendSource] = useState<BackendSource | null>(null);
  const [datasets, setDatasets] = useState<LayerMeta[]>([]);
  const [experience, setExperience] = useState<ExperienceResponse | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const [bootstrapped, setBootstrapped] = useState(false);

  const layerToggles = useMemo(
    () =>
      [
        { id: "route" as const, label: t.layers.route, icon: Route },
        { id: "places" as const, label: t.layers.places, icon: Map },
        { id: "risk" as const, label: t.layers.signals, icon: Layers },
        { id: "senses" as const, label: t.layers.senses, icon: Radio },
      ] as const,
    [t]
  );

  const activeScene = t.scenes[activeSceneId];
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
          label: t.experience.backendMatches,
          value: String(experience.spatial.totalFeatures),
          tone: "places" as const,
        },
        {
          label: experience.route?.provider ?? t.experience.queryRadius,
          value: experience.route
            ? `${experience.route.durationMinutes}m`
            : `${Math.round(experience.spatial.meta.radiusMeters)}m`,
          tone: "route" as const,
        },
        {
          label: t.experience.queryTime,
          value: `${experience.spatial.meta.queryMs}ms`,
          tone: "senses" as const,
        },
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
        text: t.messages.reset,
      },
    ]);
    setInput("");
    setExperience(null);
    setSelectedFeatureId(null);
    setSelectedVenueId(null);
    setActiveSceneId("date-night");
    setIsThinking(false);
  }, [t.messages.reset]);

  const runPrompt = useCallback(
    async (userText: string, apiText = userText) => {
      const trimmed = userText.trim();
      if (!trimmed || isThinking) return;

      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: "user",
        text: trimmed,
      };
      setMessages((current) => [...current, userMessage]);
      setInput("");
      setIsThinking(true);

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: apiText, currentSceneId: activeSceneId }),
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
            text: payload.reply,
          },
        ]);
      } catch {
        setApiStatus("offline");
        setMessages((current) => [
          ...current,
          {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            text: t.messages.queryFailed,
          },
        ]);
      } finally {
        setIsThinking(false);
      }
    },
    [activeSceneId, applyExperience, isThinking, t.messages.queryFailed]
  );

  useEffect(() => {
    if (!ready || bootstrapped) return;

    const controller = new AbortController();
    const initialPrompt = t.promptChips[0]?.apiText ?? t.promptChips[0]?.userText;

    async function loadInitialExperience() {
      setMessages([
        {
          id: "assistant-initial",
          role: "assistant",
          text: t.messages.loading,
        },
      ]);

      try {
        const statusResponse = await fetch("/api/chat", {
          cache: "no-store",
          signal: controller.signal,
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
          signal: controller.signal,
        });

        if (!response.ok) throw new Error("Initial backend query failed");

        const payload = (await response.json()) as ExperienceResponse;
        applyExperience(payload);
        setMessages([
          {
            id: "assistant-initial",
            role: "assistant",
            text: t.messages.loading,
          },
          {
            id: "assistant-backend-ready",
            role: "assistant",
            text: payload.reply,
          },
        ]);
      } catch {
        if (!controller.signal.aborted) {
          setApiStatus("offline");
          setMessages([
            {
              id: "assistant-initial",
              role: "assistant",
              text: t.messages.loading,
            },
            {
              id: "assistant-backend-error",
              role: "assistant",
              text: t.messages.backendError,
            },
          ]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setBootstrapped(true);
        }
      }
    }

    void loadInitialExperience();

    return () => controller.abort();
  }, [applyExperience, bootstrapped, ready, t]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void runPrompt(input);
  };

  const statusLabel = useMemo(() => {
    if (apiStatus === "checking") return t.status.checking;
    if (apiStatus === "worker") return t.status.worker;
    if (apiStatus === "local") return t.status.local;
    return t.status.offline;
  }, [apiStatus, t.status]);

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
            <p className="eyebrow">{t.brand.eyebrow}</p>
            <h1>{t.brand.title}</h1>
          </div>
        </div>
        <div className="runtime-status">
          <LanguageSelector />
          <span className={apiStatus === "worker" ? "status-dot online" : "status-dot"} />
          <StatusIcon size={15} aria-hidden="true" />
          <span>{statusLabel}</span>
          <span className="map-status">
            {isMapReady ? t.status.mapReady : t.status.mapLoading}
          </span>
        </div>
      </header>

      <aside className="conversation-panel" aria-label={t.chat.panelTitle}>
        <div className="panel-header">
          <div>
            <p className="eyebrow">{t.chat.panelEyebrow}</p>
            <h2>{t.chat.panelTitle}</h2>
          </div>
          <button className="secondary-command" type="button" onClick={resetChat}>
            <Plus size={16} aria-hidden="true" />
            <span>{t.chat.newChat}</span>
          </button>
        </div>

        <div className="message-list">
          {messages.map((message) => (
            <div className={`message-bubble ${message.role}`} key={message.id}>
              {message.text}
            </div>
          ))}
          {isThinking ? (
            <div className="message-bubble assistant">{t.chat.thinking}</div>
          ) : null}
        </div>

        <div className="quick-actions" aria-label={t.chat.panelEyebrow}>
          {t.commonOptions.map((option, index) => {
            const optionIcons = [Map, Sparkles, Layers, CloudRain, Route, Radio] as const;
            const OptionIcon = optionIcons[index] ?? Map;
            return (
              <button
                className="option-chip"
                disabled={isThinking}
                key={option.label}
                type="button"
                onClick={() => void runPrompt(option.userText, option.apiText)}
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
          <summary>{t.chat.examples}</summary>
          <div className="example-list">
            {t.promptChips.map((prompt) => (
              <button
                disabled={isThinking}
                key={prompt.label}
                type="button"
                onClick={() => void runPrompt(prompt.userText, prompt.apiText)}
              >
                {prompt.userText}
              </button>
            ))}
          </div>
        </details>

        <form className="composer" onSubmit={handleSubmit}>
          <input
            aria-label={t.chat.send}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={t.chat.placeholder}
          />
          <button
            type="submit"
            aria-label={t.chat.send}
            disabled={isThinking || input.trim() === ""}
          >
            <Send size={17} aria-hidden="true" />
          </button>
        </form>
      </aside>

      <aside className="experience-panel" aria-label={t.experience.panelLabel}>
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
            {datasets.length || experience?.datasets.length || 0} {t.experience.datasets}
          </span>
          <span>
            {backendSource === "worker"
              ? t.experience.workerBackend
              : t.experience.localBackend}
          </span>
        </div>

        <div className="intent-row">
          {intentTokens(t, experience?.intent, experience?.spatial.layers).map((token) => (
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
                    <small>{featureMeta(t, feature)}</small>
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
                      {venue.walkMinutes
                        ? ` · ${venue.walkMinutes} ${t.experience.minWalk}`
                        : ""}
                    </small>
                  </div>
                </button>
              ))}
        </div>
      </aside>

      <nav className="scene-rail" aria-label={t.experience.panelLabel}>
        {scenes.map((scene) => {
          const SceneIcon = sceneIcons[scene.id];
          const copy = t.scenes[scene.id];
          return (
            <button
              className={scene.id === activeSceneId ? "active" : ""}
              key={scene.id}
              type="button"
              onClick={() => void runPrompt(copy.command, copy.command)}
            >
              <SceneIcon size={17} aria-hidden="true" />
              <span>{copy.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="layer-dock" aria-label={t.layers.places}>
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
                  [layer.id]: !current[layer.id],
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

function intentTokens(t: Messages, intent?: IntentQuery, layers?: string[]) {
  if (!intent) {
    return [
      { label: t.intent.mode, value: t.intent.initializing },
      { label: t.intent.layers, value: t.intent.sceneDefaults },
    ];
  }

  const tokens = [
    { label: t.intent.mood, value: intent.mood ?? t.intent.general },
    { label: t.intent.layers, value: layers?.join(", ") ?? t.intent.auto },
    { label: t.intent.walk, value: intent.walk ? `${intent.walk}m` : t.intent.auto },
  ];

  if (intent.budget) tokens.push({ label: t.intent.budget, value: `EUR ${intent.budget}` });
  if (intent.accessibility) tokens.push({ label: t.intent.access, value: t.intent.stepFree });
  if (intent.rainy) tokens.push({ label: t.intent.weather, value: t.intent.rainAware });

  return tokens;
}

function featureMeta(t: Messages, feature: ParisFeature) {
  const props = feature.properties;
  const parts = [layerLabel(props.layer)];
  if (props.address) parts.push(props.address);
  if (props.arrondissement) parts.push(props.arrondissement);
  if (props.indoor) parts.push(t.experience.indoor);
  if (props.accessible) parts.push(t.experience.accessible);
  return parts.join(" · ");
}

function layerLabel(layer: string) {
  return layer
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
