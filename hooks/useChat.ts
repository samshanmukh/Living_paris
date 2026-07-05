"use client";

import { useCallback, useState } from "react";
import type { ChatRequest } from "@/lib/chat-types";
import type { IntegratedChatResponse } from "@/lib/integrated-chat-types";
import type { IntentQuery } from "@/lib/types";

export interface UseChatState {
  loading: boolean;
  error: string | null;
  lastResponse: IntegratedChatResponse | null;
}

export function useChat() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<IntegratedChatResponse | null>(null);

  const sendMessage = useCallback(
    async (
      message: string,
      options?: Omit<ChatRequest, "message"> & { intent?: IntentQuery }
    ) => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message, ...options }),
        });

        const data = (await res.json()) as IntegratedChatResponse & {
          error?: string;
          hint?: string;
        };

        if (!res.ok) {
          throw new Error(data.error ?? `Chat failed (${res.status})`);
        }

        if (!data.reply || !data.result?.mapState) {
          throw new Error("Chat response missing reply or result.mapState");
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
