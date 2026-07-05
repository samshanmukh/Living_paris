"use client";

import { useCallback, useRef, useState } from "react";

function browserSpeak(text: string, lang: string, onDone: () => void): boolean {
  if (typeof window === "undefined" || !window.speechSynthesis) return false;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.onend = onDone;
  utterance.onerror = onDone;
  window.speechSynthesis.speak(utterance);
  return true;
}

export function useSpeechSynthesis(defaultLang = "en-US") {
  const [supported] = useState(() => typeof window !== "undefined");
  const [speaking, setSpeaking] = useState(false);
  const [provider, setProvider] = useState<"grok" | "browser" | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const revokeObjectUrl = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  const cancel = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    audioRef.current?.pause();
    audioRef.current = null;
    revokeObjectUrl();
    setSpeaking(false);
    setProvider(null);
  }, [revokeObjectUrl]);

  const speak = useCallback(
    async (text: string, lang = defaultLang) => {
      if (typeof window === "undefined") return false;

      cancel();
      const trimmed = text.trim();
      if (!trimmed) return false;

      setSpeaking(true);

      try {
        const res = await fetch("/api/voice/speech", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: trimmed }),
        });

        if (res.ok) {
          const blob = await res.blob();
          revokeObjectUrl();
          const url = URL.createObjectURL(blob);
          objectUrlRef.current = url;

          const audio = new Audio(url);
          audioRef.current = audio;
          setProvider("grok");

          await new Promise<void>((resolve, reject) => {
            audio.onended = () => resolve();
            audio.onerror = () => reject(new Error("Audio playback failed"));
            void audio.play().catch(reject);
          });

          setSpeaking(false);
          setProvider(null);
          revokeObjectUrl();
          audioRef.current = null;
          return true;
        }
      } catch {
        // Fall through to browser TTS.
      }

      setProvider("browser");
      const started = browserSpeak(trimmed, lang, () => {
        setSpeaking(false);
        setProvider(null);
      });

      if (!started) {
        setSpeaking(false);
        setProvider(null);
      }

      return started;
    },
    [cancel, defaultLang, revokeObjectUrl]
  );

  return { supported, speaking, provider, speak, cancel };
}
