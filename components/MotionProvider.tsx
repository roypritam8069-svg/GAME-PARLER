"use client";

import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Global motion configuration.
 *
 * `reducedMotion="user"` makes framer-motion automatically drop transform /
 * layout animations when the visitor prefers reduced motion, while keeping
 * opacity transitions (content stays readable and nothing moves).
 */
export default function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <MotionConfig
      reducedMotion="user"
      transition={{ duration: 0.4, ease: [0.2, 0, 0, 1] }}
    >
      {children}
    </MotionConfig>
  );
}
