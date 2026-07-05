"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Mic, Send, Square } from "lucide-react";
import { cn } from "@/lib/utils";

interface ComposerBarProps {
  draft: string;
  accentColor: string;
  isGenerating?: boolean;
  listening?: boolean;
  voiceSupported?: boolean;
  placeholder?: string;
  onDraftChange: (value: string) => void;
  onSend: () => void;
  onToggleMic?: () => void;
}

export default function ComposerBar({
  draft,
  accentColor,
  isGenerating,
  listening,
  voiceSupported,
  placeholder = "Ask Living Paris anything…",
  onDraftChange,
  onSend,
  onToggleMic,
}: ComposerBarProps) {
  const reducedMotion = useReducedMotion();

  return (
    <div className="flex items-center gap-2 px-4 pb-2.5 pt-0.5">
      <input
        value={draft}
        onChange={(event) => onDraftChange(event.target.value)}
        onKeyDown={(event) => event.key === "Enter" && onSend()}
        placeholder={listening ? "Listening…" : placeholder}
        className="min-w-0 flex-1 rounded-full border border-[#e0d5c2] bg-white/85 px-4 py-2.5 text-[14px] text-[#2b241c] outline-none placeholder:text-[#b3a893] focus:border-[#c9b995]"
      />
      {voiceSupported && onToggleMic && (
        <motion.button
          type="button"
          whileTap={{ scale: 0.9 }}
          onClick={onToggleMic}
          aria-label={listening ? "Stop listening" : "Speak to Paris"}
          className={cn(
            "grid h-11 w-11 shrink-0 place-items-center rounded-full transition-colors",
            listening
              ? "text-white"
              : "bg-[#efe7d8] text-[#6b6155] hover:bg-[#e6dcc8]"
          )}
          style={listening ? { backgroundColor: accentColor } : undefined}
        >
          {listening ? <Square size={17} /> : <Mic size={18} />}
        </motion.button>
      )}
      <motion.button
        type="button"
        whileTap={reducedMotion ? undefined : { scale: 0.9 }}
        onClick={onSend}
        disabled={!draft.trim() || isGenerating}
        aria-label="Send"
        className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-white transition-[background-color,opacity] duration-500 disabled:opacity-35"
        style={{ backgroundColor: accentColor }}
      >
        <Send size={17} />
      </motion.button>
    </div>
  );
}
