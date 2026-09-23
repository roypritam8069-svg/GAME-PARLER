"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

import useHasMounted from "./useHasMounted";

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Stagger delay in milliseconds (kept small — 0/70/140…). */
  delay?: number;
  /** Entrance distance in pixels. DESIGN.md §46 allows only small slides. */
  distance?: number;
};

const EASE_STANDARD = [0.2, 0, 0, 1] as const;

/**
 * Scroll reveal (framer-motion).
 *
 * - opacity 0 → 1 with a small upward slide, once per element
 * - the `gp-reveal` class keeps content visible when scripting is disabled
 *   (see app/globals.css `@media (scripting: none)`)
 * - motion is neutralised globally by MotionConfig reducedMotion="user"
 */
export default function Reveal({
  children,
  className,
  delay = 0,
  distance = 20,
}: RevealProps) {
  const prefersReducedMotion = useReducedMotion();
  const hasMounted = useHasMounted();
  const classes = className ? `gp-reveal ${className}` : "gp-reveal";

  // DESIGN.md §47 — under reduced motion content is simply present: nothing
  // fades or slides, so it can never be waiting to become visible.
  //
  // Checked only after hydration: the server cannot know the preference, so
  // swapping the element during the first client render would be a hydration
  // mismatch (components/useHasMounted.ts).
  if (hasMounted && prefersReducedMotion) {
    return <div className={classes}>{children}</div>;
  }

  return (
    <motion.div
      className={classes}
      initial={{ opacity: 0, y: distance }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15, margin: "0px 0px -8% 0px" }}
      transition={{
        duration: 0.4,
        delay: delay / 1000,
        ease: EASE_STANDARD,
      }}
    >
      {children}
    </motion.div>
  );
}
