/** When true, presets load hardcoded diorama demos instead of /api/chat. */
export function isDemoMode(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "true";
}

/** UI sandbox always uses live map + /api/chat even if DEMO_MODE is set. */
export function isSandboxRoute(): boolean {
  if (typeof window === "undefined") return false;
  return window.location.pathname.startsWith("/ui-sandbox");
}
