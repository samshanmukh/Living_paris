"use client";

import { useCallback, useState } from "react";

export function useSpeechSynthesis(defaultLang = "en-US") {
  const [supported] = useState(
    () => typeof window !== "undefined" && "speechSynthesis" in window
  );
  const [speaking, setSpeaking] = useState(false);

  const cancel = useCallback(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  const speak = useCallback(
    (text: string, lang = defaultLang) => {
      if (typeof window === "undefined" || !window.speechSynthesis) {
        return false;
      }

      cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setSpeaking(true);
      return true;
    },
    [cancel, defaultLang]
  );

  return { supported, speaking, speak, cancel };
}
