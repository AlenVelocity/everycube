"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Credits from "@/components/Credits";
import CubeViewport2D from "@/components/CubeViewport2D";
import FxToggle from "@/components/FxToggle";
import PatternsToggle from "@/components/PatternsToggle";
import PermutationCounter from "@/components/PermutationCounter";
import RulerSlider from "@/components/RulerSlider";
import StepToggle from "@/components/StepToggle";
import ViewToggle, { type ViewMode } from "@/components/ViewToggle";
import { clampIndex } from "@/lib/cubeMath";
import { stickersForIndex } from "@/lib/cubeState";
import { useScrollIndex } from "@/lib/useScrollIndex";

const CubeViewport3D = dynamic(
  () => import("@/components/CubeViewport3D"),
  { ssr: false }
);

// The hash carries the same 1-based number the counter displays, so a
// shared link always matches what's on screen.
function indexFromHash(): bigint | null {
  if (typeof window === "undefined") return null;
  const raw = window.location.hash.replace(/^#/, "");
  if (!/^\d+$/.test(raw)) return null;
  try {
    const num = BigInt(raw);
    return clampIndex(num > 0n ? num - 1n : 0n);
  } catch {
    return null;
  }
}

export default function Page() {
  const [n, setN] = useState<bigint>(0n);
  const [view, setView] = useState<ViewMode>("3D");
  const [fx, setFx] = useState(false);
  const [step, setStep] = useState(500);
  const [showPatterns, setShowPatterns] = useState(true);
  const mainRef = useRef<HTMLDivElement>(null);

  const updateN = useCallback(
    (update: (n: bigint) => bigint) => setN((prev) => update(prev)),
    []
  );
  useScrollIndex(mainRef, updateN, step);

  useEffect(() => {
    const fromHash = indexFromHash();
    if (fromHash !== null) setN(fromHash);
  }, []);

  // Shareable URLs: keep #<n> in sync (debounced so scrolling doesn't
  // hammer the history API).
  useEffect(() => {
    const t = setTimeout(() => {
      window.history.replaceState(null, "", n === 0n ? " " : `#${n + 1n}`);
    }, 300);
    return () => clearTimeout(t);
  }, [n]);

  const stickers = useMemo(() => stickersForIndex(n), [n]);

  return (
    <main
      ref={mainRef}
      className="relative h-dvh w-screen touch-none overflow-hidden bg-[#fafafa]"
    >
      {view === "3D" ? (
        <CubeViewport3D n={n} fx={fx} />
      ) : (
        <CubeViewport2D stickers={stickers} />
      )}

      {/* Mobile: counter, then controls flowing below it — a long number
          and the toggles never compete for the same row. */}
      <div className="absolute left-4 right-4 top-4 flex flex-col items-start gap-2 sm:hidden">
        <PermutationCounter n={n} onCommit={setN} />
        <Credits />
        <div className="flex flex-wrap items-center gap-1.5">
          <FxToggle on={fx} onChange={setFx} />
          <PatternsToggle on={showPatterns} onChange={setShowPatterns} />
          <ViewToggle view={view} onChange={setView} />
          <StepToggle step={step} onChange={setStep} />
        </div>
      </div>

      {/* Desktop/tablet: original left counter / right controls split. */}
      <div className="hidden sm:flex sm:absolute sm:left-8 sm:top-7 sm:flex-col sm:items-start sm:gap-2">
        <PermutationCounter n={n} onCommit={setN} />
        <Credits />
      </div>

      <div className="hidden sm:flex sm:absolute sm:right-8 sm:top-7 sm:flex-col sm:items-end sm:gap-2">
        <div className="flex items-center gap-2">
          <FxToggle on={fx} onChange={setFx} />
          <PatternsToggle on={showPatterns} onChange={setShowPatterns} />
          <ViewToggle view={view} onChange={setView} />
        </div>
        <StepToggle step={step} onChange={setStep} />
      </div>

      <div className="absolute bottom-6 left-1/2 w-[min(560px,calc(100vw-3rem))] -translate-x-1/2 sm:bottom-8">
        <RulerSlider n={n} onChange={setN} showPatterns={showPatterns} />
      </div>
    </main>
  );
}
