"use client";

import { useEffect, useState } from "react";

/**
 * `false` during server rendering AND the first client render, `true` once
 * hydration has finished.
 *
 * Why this exists: `useReducedMotion()` already reports the visitor's real
 * preference on the first client render, but the server has no `matchMedia`
 * and always renders the animated markup. Branching on the preference directly
 * therefore produced a hydration mismatch (server `style="transform:none"` vs
 * client `style={null}`). Gating the reduced-motion branch behind this hook
 * keeps the first render identical to the server output, and the accessibility
 * switch happens in a state update immediately after mount.
 */
export default function useHasMounted(): boolean {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  return hasMounted;
}
