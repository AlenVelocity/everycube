"use client";

import { useEffect, type RefObject } from "react";
import { clampIndex } from "./cubeMath";

// One wheel notch (~120px of deltaY) moves n by exactly `step`
// permutations. Sub-notch trackpad deltas accumulate so nothing is lost.
const NOTCH_PX = 120;

// Wheel (and two-finger touch drag) on the viewport drives n directly;
// the page itself never scrolls. One-finger drag is left alone so
// OrbitControls can rotate the cube.
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

    let lastTouchY: number | null = null;
    const onTouchStart = (e: TouchEvent) => {
      lastTouchY =
        e.touches.length === 2
          ? (e.touches[0].clientY + e.touches[1].clientY) / 2
          : null;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 2 || lastTouchY === null) return;
      e.preventDefault();
      const y = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      apply(lastTouchY - y);
      lastTouchY = y;
    };
    const onTouchEnd = () => {
      lastTouchY = null;
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [ref, onDelta, step]);
}
