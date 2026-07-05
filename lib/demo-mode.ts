/** When true, presets load hardcoded diorama demos instead of /api/chat. */
export function isDemoMode(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "true";
}
