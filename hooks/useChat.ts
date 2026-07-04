"use client";

import { useCallback, useState } from "react";
import type { ChatRequest, ChatResponse } from "@/lib/chat-types";

export interface UseChatState {
  loading: boolean;
  error: string | null;
  lastResponse: ChatResponse | null;
}

export function useChat() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<ChatResponse | null>(null);

  const sendMessage = useCallback(
    async (message: string, options?: Omit<ChatRequest, "message">) => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message, ...options }),
        });

        const data = (await res.json()) as ChatResponse & { error?: string; hint?: string };

        if (!res.ok) {
          throw new Error(data.error ?? `Chat failed (${res.status})`);
        }

        setLastResponse(data);
        return data;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Chat request failed";
        setError(msg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setError(null);
    setLastResponse(null);
  }, []);

  return { sendMessage, loading, error, lastResponse, reset };
}
