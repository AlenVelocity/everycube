"use client";

import { useEffect, type RefObject } from "react";
import { clampIndex } from "./cubeMath";

// One wheel notch (~120px of deltaY), or 120px of one-finger touch drag,
// moves n by exactly `step` permutations. Sub-notch deltas accumulate so
// nothing is lost.
const NOTCH_PX = 120;

function isInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return !!target.closest("input, button, a, [role='slider']");
}

// Wheel on desktop, and a one-finger drag on touch devices, drive n
// directly; the page itself never scrolls. A two-finger touch is left
// alone so OrbitControls can rotate the cube. Touches starting on the
// floating chrome (slider, buttons, counter) are ignored so dragging
// those doesn't also move n.
export function useScrollIndex(
  ref: RefObject<HTMLElement>,
  onDelta: (update: (n: bigint) => bigint) => void,
  step: number
) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let acc = 0;
    const apply = (pixels: number) => {
      acc += pixels;
      const notches = Math.trunc(acc / NOTCH_PX);
      if (notches === 0) return;
      acc -= notches * NOTCH_PX;
      onDelta((n) => clampIndex(n + BigInt(notches * step)));
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const scale = e.deltaMode === 1 ? 16 : 1; // lines -> px
      apply(e.deltaY * scale);
    };

    let dragging = false;
    let lastTouchY = 0;
    const onTouchStart = (e: TouchEvent) => {
      dragging = e.touches.length === 1 && !isInteractiveTarget(e.target);
      if (dragging) lastTouchY = e.touches[0].clientY;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!dragging || e.touches.length !== 1) {
        dragging = false;
        return;
      }
      e.preventDefault();
      const y = e.touches[0].clientY;
      apply(lastTouchY - y);
      lastTouchY = y;
    };
    const onTouchEnd = () => {
      dragging = false;
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    el.addEventListener("touchcancel", onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [ref, onDelta, step]);
}
