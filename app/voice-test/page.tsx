import { VoicePipelineDemo } from "@/features/voice/VoicePipelineDemo";

/** Local dev smoke test for AI & Voice — not linked from main app. */
export default function VoiceTestPage() {
  return (
    <main className="min-h-full bg-zinc-50 py-8">
      <VoicePipelineDemo />
    </main>
  );
}
