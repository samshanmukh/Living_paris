"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useChat } from "@/hooks/useChat";
import { useSpeechRecognition } from "./useSpeechRecognition";
import { useSpeechSynthesis } from "./useSpeechSynthesis";

type StepStatus = "idle" | "running" | "ok" | "error" | "skip";

interface TraceEntry {
  id: string;
  step: string;
  status: StepStatus;
  message: string;
  at: string;
}

const STATUS_STYLE: Record<StepStatus, string> = {
  idle: "text-zinc-500",
  running: "text-amber-600",
  ok: "text-green-700",
  error: "text-red-600",
  skip: "text-zinc-400",
};

export function VoicePipelineDemo() {
  const [mounted, setMounted] = useState(false);
  const [trace, setTrace] = useState<TraceEntry[]>([]);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [typedMessage, setTypedMessage] = useState(
    "Plan a romantic evening under 60 euros"
  );
  const pipelineBusyRef = useRef(false);

  const { sendMessage, loading, error: chatError, lastResponse, reset: resetChat } =
    useChat();
  const { speak, speaking, supported: ttsSupported, cancel: cancelSpeak } =
    useSpeechSynthesis();

  useEffect(() => {
    setMounted(true);
  }, []);

  const pushTrace = useCallback(
    (step: string, status: StepStatus, message: string) => {
      const entry: TraceEntry = {
        id: `${step}-${status}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        step,
        status,
        message,
        at: new Date().toLocaleTimeString(),
      };
      setTrace((prev) => [...prev, entry]);
      return entry.id;
    },
    []
  );

  const updateTrace = useCallback((id: string, status: StepStatus, message: string) => {
    setTrace((prev) =>
      prev.map((entry) => (entry.id === id ? { ...entry, status, message } : entry))
    );
  }, []);

  const runPipeline = useCallback(
    async (text: string, source: "voice" | "typed") => {
      if (pipelineBusyRef.current) return;

      const trimmed = text.trim();
      if (!trimmed) {
        pushTrace("Input", "error", "Empty message — say or type something first.");
        return;
      }

      pipelineBusyRef.current = true;

      pushTrace(
        source === "voice" ? "1. Speech (STT)" : "1. Input (typed)",
        "ok",
        `"${trimmed}"`
      );
      const chatTraceId = pushTrace(
        "2. POST /api/chat",
        "running",
        "Grok intent → spatial query → response…"
      );

      try {
        const data = await sendMessage(trimmed);

        updateTrace(chatTraceId, "ok", "200 OK");
        pushTrace("3. Intent (Grok)", "ok", JSON.stringify(data.intent, null, 0));
        pushTrace(
          "4. MapState",
          "ok",
          `theme=${data.mapState.theme}, center=[${data.mapState.center.join(", ")}], features=${data.mapState.highlights.features.length}, layers=${data.mapState.activeLayers.join(",")}`
        );
        pushTrace("5. Assistant message", "ok", data.message);

        if (autoSpeak) {
          if (!ttsSupported) {
            pushTrace("6. TTS", "skip", "Speech synthesis not supported in this browser.");
          } else {
            const ttsId = pushTrace("6. TTS", "running", "Reading reply aloud…");
            const started = speak(data.message);
            updateTrace(
              ttsId,
              started ? "ok" : "error",
              started ? "Playback started" : "Could not start speech"
            );
          }
        } else {
          pushTrace("6. TTS", "skip", "Auto-speak off");
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Chat request failed";
        updateTrace(chatTraceId, "error", msg);
      } finally {
        pipelineBusyRef.current = false;
      }
    },
    [autoSpeak, pushTrace, sendMessage, speak, ttsSupported, updateTrace]
  );

  const onFinalTranscript = useCallback(
    (text: string) => runPipeline(text, "voice"),
    [runPipeline]
  );

  const {
    supported: sttSupported,
    listening,
    transcript,
    error: sttError,
    start,
    stop,
  } = useSpeechRecognition({ onFinalTranscript });

  useEffect(() => {
    if (sttError) {
      pushTrace("1. Speech (STT)", "error", sttError);
    }
  }, [sttError, pushTrace]);

  const clearAll = () => {
    stop();
    cancelSpeak();
    resetChat();
    setTrace([]);
    pipelineBusyRef.current = false;
  };

  const showStt = mounted && sttSupported;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-6 font-sans">
      <header>
        <p className="text-xs font-medium uppercase tracking-wide text-amber-700">
          Dev only — not for production
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-900">
          AI Voice Pipeline Test
        </h1>
        <p className="mt-2 text-sm text-zinc-600">
          Mic → Grok intent → spatial API → message + mapState → optional TTS.
          Open{" "}
          <code className="rounded bg-zinc-100 px-1 text-xs">/voice-test</code>{" "}
          with <code className="rounded bg-zinc-100 px-1 text-xs">npm run dev</code>{" "}
          + <code className="rounded bg-zinc-100 px-1 text-xs">npm run dev:api</code>.
        </p>
      </header>

      <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-zinc-800">Controls</h2>

        <div className="flex flex-wrap items-center gap-3">
          {!mounted ? (
            <span className="text-sm text-zinc-500">Checking browser support…</span>
          ) : !showStt ? (
            <span className="text-sm text-red-600">
              Speech recognition not supported — use Chrome/Edge, or type below.
            </span>
          ) : (
            <button
              type="button"
              onClick={listening ? stop : start}
              disabled={loading}
              className={`rounded-full px-5 py-3 text-sm font-medium text-white transition ${
                listening
                  ? "animate-pulse bg-red-600 hover:bg-red-700"
                  : "bg-blue-600 hover:bg-blue-700"
              } disabled:opacity-50`}
            >
              {listening ? "■ Stop mic" : "🎤 Start mic & speak"}
            </button>
          )}

          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <input
              type="checkbox"
              checked={autoSpeak}
              onChange={(e) => setAutoSpeak(e.target.checked)}
            />
            Auto-speak reply
          </label>

          <button
            type="button"
            onClick={clearAll}
            className="rounded border border-zinc-300 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
          >
            Clear trace
          </button>
        </div>

        {listening && (
          <p className="mt-3 text-sm text-amber-700">
            Listening… say e.g. &quot;Plan a romantic evening under 60 euros&quot;
          </p>
        )}
        {transcript && (
          <p className="mt-2 text-sm text-zinc-600">
            Live transcript: <em>{transcript}</em>
          </p>
        )}
        {(loading || speaking) && (
          <p className="mt-2 text-sm text-amber-600">
            {loading ? "Waiting for /api/chat…" : "Speaking…"}
          </p>
        )}
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-zinc-800">
          Typed fallback (no mic)
        </h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={typedMessage}
            onChange={(e) => setTypedMessage(e.target.value)}
            className="min-w-0 flex-1 rounded border border-zinc-300 px-3 py-2 text-sm"
            placeholder="Type a message…"
          />
          <button
            type="button"
            onClick={() => runPipeline(typedMessage, "typed")}
            disabled={loading}
            className="rounded bg-zinc-800 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-900 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-zinc-950 p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-zinc-200">Pipeline trace</h2>
        {trace.length === 0 ? (
          <p className="font-mono text-sm text-zinc-500">
            No steps yet — click the mic or Send.
          </p>
        ) : (
          <ol className="space-y-2 font-mono text-xs">
            {trace.map((entry) => (
              <li key={entry.id} className="flex gap-2">
                <span className="shrink-0 text-zinc-500">{entry.at}</span>
                <span className={`shrink-0 font-semibold ${STATUS_STYLE[entry.status]}`}>
                  [{entry.status.toUpperCase()}]
                </span>
                <span className="shrink-0 text-zinc-400">{entry.step}</span>
                <span className="break-all text-zinc-200">{entry.message}</span>
              </li>
            ))}
          </ol>
        )}
        {chatError && (
          <p className="mt-3 font-mono text-xs text-red-400">Chat error: {chatError}</p>
        )}
      </section>

      {lastResponse && (
        <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
          <h2 className="mb-2 text-sm font-semibold text-zinc-800">Last response</h2>
          <p className="text-sm text-zinc-800">{lastResponse.message}</p>
          <pre className="mt-3 max-h-40 overflow-auto rounded bg-zinc-100 p-2 text-xs text-zinc-700">
            {JSON.stringify(
              {
                intent: lastResponse.intent,
                mapState: {
                  center: lastResponse.mapState.center,
                  theme: lastResponse.mapState.theme,
                  features: lastResponse.mapState.highlights.features.length,
                  activeLayers: lastResponse.mapState.activeLayers,
                },
              },
              null,
              2
            )}
          </pre>
          {ttsSupported && lastResponse.message && (
            <button
              type="button"
              onClick={() => speak(lastResponse.message)}
              className="mt-3 rounded border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50"
            >
              🔊 Replay message
            </button>
          )}
        </section>
      )}

      <section className="rounded border border-dashed border-zinc-300 p-3 text-xs text-zinc-500">
        <strong>How to read the trace:</strong> Green [OK] = that step worked. Red [ERROR] on
        step 1 after green steps often meant mic &quot;aborted&quot; (harmless) — fixed in latest
        code. Refresh the page after saving.
        <br />
        <strong>Browser support:</strong> STT {mounted && sttSupported ? "✓" : mounted ? "✗" : "…"}{" "}
        · TTS {mounted && ttsSupported ? "✓" : mounted ? "✗" : "…"}
        <br />
        <strong>If step 2 fails:</strong> check Terminal 1 (
        <code>npm run dev:api</code>) and <code>.env.local</code>.
      </section>
    </div>
  );
}
