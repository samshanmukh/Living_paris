import { create } from "zustand";

interface PrefsState {
  reducedMotion: boolean;
  setReducedMotion: (value: boolean) => void;
}

export const usePrefsStore = create<PrefsState>((set) => ({
  reducedMotion:
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  setReducedMotion: (value) => set({ reducedMotion: value }),
}));
