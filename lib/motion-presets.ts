import type { Transition, Variants } from "framer-motion";

export const springSnappy: Transition = {
  type: "spring",
  stiffness: 380,
  damping: 30,
};

export const fadeUp: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

export function messageVariants(role: "user" | "paris"): Variants {
  return {
    initial: {
      opacity: 0,
      y: 10,
      x: role === "user" ? 14 : -14,
    },
    animate: { opacity: 1, y: 0, x: 0 },
    exit: { opacity: 0, scale: 0.96 },
  };
}

export function chipVariants(index: number): Variants {
  return {
    initial: { opacity: 0, y: 8, scale: 0.96 },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        delay: 0.08 + index * 0.06,
        ...springSnappy,
      },
    },
  };
}

export function stopVariants(index: number, reducedMotion: boolean): Variants {
  const baseDelay = reducedMotion ? 0 : 0.28;
  const step = reducedMotion ? 0 : 0.07;

  return {
    initial: { opacity: 0, y: 14, scale: 0.98 },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        delay: baseDelay + index * step,
        ...springSnappy,
      },
    },
  };
}

export function motionTransition(reducedMotion: boolean, extra?: Transition): Transition {
  if (reducedMotion) return { duration: 0 };
  return { ...springSnappy, ...extra };
}
