"use client";

import ResponseBubble from "@/features/ui/components/ResponseBubble";

interface IntentResponseBubbleProps {
  response: string | null;
  accentColor: string;
  /** Delay bubble until drawer stops begin appearing. */
  revealDelay?: number;
}

export default function IntentResponseBubble({
  response,
  accentColor,
  revealDelay = 0.4,
}: IntentResponseBubbleProps) {
  return (
    <ResponseBubble
      response={response}
      accentColor={accentColor}
      revealDelay={revealDelay}
    />
  );
}
