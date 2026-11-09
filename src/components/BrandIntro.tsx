"use client";

import { useEffect, useState } from "react";
import { BrandWordmark } from "./BrandWordmark";

/** A brief brand introduction, never a gate on loading or using the shop. */
export function BrandIntro() {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const dismiss = () => setVisible(false);
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motion.matches) dismiss();
    const timer = window.setTimeout(dismiss, 1500);
    // Do not hold up anyone who starts navigating immediately.
    window.addEventListener("keydown", dismiss, { once: true });
    window.addEventListener("pointerdown", dismiss, { once: true });
    motion.addEventListener("change", dismiss);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", dismiss);
      window.removeEventListener("pointerdown", dismiss);
      motion.removeEventListener("change", dismiss);
    };
  }, []);
  if (!visible) return null;
  return <div className="brand-intro" aria-hidden="true" inert>
    <div className="brand-intro-lockup">
      <div className="brand"><BrandWordmark animateDrop /></div>
    </div>
  </div>;
}
