import type { ChatRequest, ChatResponse } from "@/lib/chat-types";
import { postSpatialQuery } from "./api-client";
import { extractIntent } from "./intent-extractor";
import { buildMapState } from "./map-state-builder";
import { generateChatMessage } from "./response-generator";

export async function handleChat(request: ChatRequest): Promise<ChatResponse> {
  const intent = await extractIntent({
    message: request.message,
    history: request.history,
    context: request.context,
  });

  const spatial = await postSpatialQuery(intent);
  const mapState = buildMapState(intent, spatial);
  const message = generateChatMessage(intent, spatial);

  return { message, intent, mapState };
}
