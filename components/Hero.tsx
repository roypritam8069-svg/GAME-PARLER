"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

import BookButton from "./BookButton";
import useHasMounted from "./useHasMounted";

/**
 * Hero (DESIGN.md §23, §46 as amended 2026-09-23 — docs/DECISIONS.md ADR-008).
 *
 * Layer 1 — atmosphere grid with subtle scroll-parallax (≤24px)
 * Layer 2 — ambient light + hairline HUD ring, deeper parallax (≤40px)
 * Layer 3 — lightweight particle drift (14 fixed CSS dots, ADR-008 bound)
 * Layer 4 — content entrance (fade + 8px rise, staggered, once)
 *
 * Parallax is transform-only and bound to scroll progress (never
 * scroll-jacking); particles are CSS-only. Both are decorative layers only —
 * text never moves — and both are fully disabled under
 * `prefers-reduced-motion` (framer's MotionConfig reducedMotion="user" plus
 * the explicit rules in app/globals.css). No blur, no video, no animated
 * gradients (§23 amendment).
 */

// Fixed positions/durations keep the particle layer deterministic — no
// randomness at render time, so server and client markup always match.
const PARTICLES = [
  { key: "p1", left: "6%", top: "18%", duration: 7, delay: 0 },
  { key: "p2", left: "14%", top: "64%", duration: 9, delay: 1.2 },
  { key: "p3", left: "22%", top: "32%", duration: 8, delay: 0.6 },
  { key: "p4", left: "30%", top: "76%", duration: 10, delay: 2.1 },
  { key: "p5", left: "38%", top: "12%", duration: 7.5, delay: 1.7 },
  { key: "p6", left: "47%", top: "54%", duration: 9.5, delay: 0.3 },
  { key: "p7", left: "55%", top: "26%", duration: 8.5, delay: 2.6 },
  { key: "p8", left: "63%", top: "70%", duration: 7, delay: 1.1 },
  { key: "p9", left: "71%", top: "40%", duration: 10, delay: 0.8 },
  { key: "p10", left: "79%", top: "16%", duration: 8, delay: 2.9 },
  { key: "p11", left: "84%", top: "62%", duration: 9, delay: 1.5 },
  { key: "p12", left: "90%", top: "30%", duration: 7.5, delay: 0.4 },
  { key: "p13", left: "44%", top: "88%", duration: 9.5, delay: 2.3 },
  { key: "p14", left: "68%", top: "86%", duration: 8.5, delay: 1.9 },
] as const;

const contentStagger = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.04 },
  },
};

const EASE_STANDARD = [0.2, 0, 0, 1] as const;

// DESIGN.md §46 "small slide" — 8px (--spacing-sm), never a long travel.
const contentItem = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: EASE_STANDARD },
  },
};

export default function Hero() {
  const prefersReducedMotion = useReducedMotion();
  // Act on the preference only AFTER hydration: the server cannot know it, so
  // branching during the first client render caused a hydration mismatch
  // (components/useHasMounted.ts).
  const isCalm = useHasMounted() && prefersReducedMotion === true;
  const sectionRef = useRef<HTMLElement | null>(null);

  // Scroll-bound parallax (ADR-008): transform-only, ≤40px, decorative
  // layers only. Hooks always run; the style is omitted under reduced motion.
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const gridY = useTransform(scrollYProgress, [0, 1], [0, 24]);
  const orbY = useTransform(scrollYProgress, [0, 1], [0, 40]);

  return (
    <section
      id="hero"
      ref={sectionRef}
      aria-labelledby="hero-heading"
      className="gp-hero border-b border-border-subtle"
    >
      {/* Layer 1 — atmosphere grid with subtle parallax (ADR-008) */}
      <motion.div
        className="gp-hero-layer"
        style={isCalm ? undefined : { y: gridY }}
        aria-hidden="true"
      >
        <span className="gp-hero-grid" />
      </motion.div>

      {/* Layer 2 — ambient light + HUD ring, deeper parallax (ADR-008) */}
      <motion.div
        className="gp-hero-layer"
        style={isCalm ? undefined : { y: orbY }}
        aria-hidden="true"
      >
        <span className="gp-orb gp-orb-primary" />
        <span className="gp-orb gp-orb-secondary" />
        <span className="gp-hero-ring hidden lg:block" />
      </motion.div>

      {/* Layer 3 — lightweight CSS particles (ADR-008: ≤14 dots) */}
      <div className="gp-hero-layer" aria-hidden="true">
        {PARTICLES.map((particle) => (
          <span
            key={particle.key}
            className="gp-particle"
            style={{
              left: particle.left,
              top: particle.top,
              animationDuration: `${particle.duration}s`,
              animationDelay: `${particle.delay}s`,
            }}
          />
        ))}
      </div>

      <span className="gp-hero-veil" aria-hidden="true" />

      <div className="gp-container relative z-20 py-5xl">
        <motion.div
          className="max-w-reading"
          variants={contentStagger}
          initial={isCalm ? "visible" : "hidden"}
          animate="visible"
        >
          <motion.p variants={contentItem} className="gp-eyebrow">
            Physical gaming parlour
          </motion.p>

          <motion.h1
            id="hero-heading"
            variants={contentItem}
            className="mt-lg text-display-xl text-text-primary"
          >
            Premium gaming, played in person.
          </motion.h1>

          <motion.p
            variants={contentItem}
            className="mt-lg text-body-lg text-text-secondary"
          >
            Browse the games running on our console stations, choose your
            session length, and reserve a slot. Pay at the counter when you
            arrive, then collect your Booking ID and QR code.
          </motion.p>

          <motion.div
            variants={contentItem}
            className="mt-2xl flex flex-col gap-md sm:flex-row sm:items-center"
          >
            <BookButton className="gp-btn gp-btn-primary h-12 px-xl text-body-md">
              Book Your Station
            </BookButton>
            <a
              href="#games"
              className="gp-btn gp-btn-secondary h-12 px-xl text-body-md"
            >
              Explore Games
            </a>
          </motion.div>

          <motion.ul
            variants={contentItem}
            className="mt-2xl flex flex-wrap items-center gap-x-lg gap-y-sm text-caption text-text-secondary"
          >
            <li>30 minute / 1 hour / 2 hour sessions</li>
            <li aria-hidden="true">&#183;</li>
            <li>Counter payment</li>
            <li aria-hidden="true">&#183;</li>
            <li>Booking ID + QR</li>
          </motion.ul>
        </motion.div>
      </div>
    </section>
  );
}
