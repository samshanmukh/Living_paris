"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { UiChatMessage } from "@/features/ui/types";
import { messageVariants, motionTransition } from "@/features/ui/motion";
import { cn } from "@/lib/utils";

interface ChatMessageBubbleProps {
  message: UiChatMessage;
  accentColor: string;
  assistantLabel?: string;
}

export default function ChatMessageBubble({
  message,
  accentColor,
  assistantLabel = "Paris",
}: ChatMessageBubbleProps) {
  const reducedMotion = useReducedMotion();
  const isUser = message.role === "user";

  return (
    <motion.div
      variants={messageVariants(message.role === "user" ? "user" : "assistant")}
      initial={reducedMotion ? false : "initial"}
      animate="animate"
      exit="exit"
      transition={motionTransition(reducedMotion ?? false)}
      className={cn(
        "max-w-[88%] rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-snug",
        isUser
          ? "ml-auto rounded-br-md text-white"
          : "mr-auto rounded-bl-md border border-[#ece2d0] bg-white/80 text-[#2b241c]"
      )}
      style={isUser ? { backgroundColor: accentColor } : undefined}
    >
      {!isUser && (
        <span className="mb-0.5 block text-[10px] font-semibold uppercase tracking-[0.14em] text-[#a09380]">
          {assistantLabel}
        </span>
      )}
      {message.text}
    </motion.div>
  );
}
