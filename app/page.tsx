"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CopyLinkButton from "@/components/CopyLinkButton";
import Credits from "@/components/Credits";
import CubeViewport2D from "@/components/CubeViewport2D";
import FxToggle from "@/components/FxToggle";
import NotationInput from "@/components/NotationInput";
import NotationToggle from "@/components/NotationToggle";
import PatternsToggle from "@/components/PatternsToggle";
import PermutationCounter from "@/components/PermutationCounter";
import RulerSlider from "@/components/RulerSlider";
import StepToggle from "@/components/StepToggle";
import ViewToggle, { type ViewMode } from "@/components/ViewToggle";
import { clampIndex } from "@/lib/cubeMath";
import { stickersForIndex } from "@/lib/cubeState";
import { resolveAlgorithm } from "@/lib/notation";
import { useScrollIndex } from "@/lib/useScrollIndex";

const CubeViewport3D = dynamic(() => import("@/components/CubeViewport3D"), {
  ssr: false,
});

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

// ?view=2d|3d makes the view mode part of the shareable URL too.
function viewFromSearch(): ViewMode | null {
  if (typeof window === "undefined") return null;
  const v = new URLSearchParams(window.location.search).get("view");
  if (v === "2d") return "2D";
  if (v === "3d") return "3D";
  return null;
}

// ?alg=R+U+R%27+U%27 is the practical way to share a scramble: it's
// human-readable in the URL bar itself, and re-running it through the
// same verified move engine on load is more meaningful than restoring
// a raw 20-digit index.
function algorithmFromSearch(): { n: bigint; canonical: string } | null {
  if (typeof window === "undefined") return null;
  const alg = new URLSearchParams(window.location.search).get("alg");
  if (!alg) return null;
  try {
    return resolveAlgorithm(alg);
  } catch {
    return null;
  }
}

export default function Page() {
  const [n, setNRaw] = useState<bigint>(0n);
  const [view, setView] = useState<ViewMode>("3D");
  const [fx, setFx] = useState(false);
  const [step, setStep] = useState(500);
  const [showPatterns, setShowPatterns] = useState(true);
  const [showNotation, setShowNotation] = useState(false);
  // The scramble notation that produced the current n, if any. Cleared
  // by any other way of changing n (scroll, slider, typed number,
  // pattern jump) so a shared link never claims a scramble that isn't
  // actually what's on screen.
  const [algorithm, setAlgorithm] = useState<string | null>(null);
  const mainRef = useRef<HTMLDivElement>(null);

  const setN = useCallback((next: bigint) => {
    setAlgorithm(null);
    setNRaw(next);
  }, []);
  const updateN = useCallback((update: (n: bigint) => bigint) => {
    setAlgorithm(null);
    setNRaw((prev) => update(prev));
  }, []);
  const applyNotation = useCallback((next: bigint, canonical: string) => {
    setAlgorithm(canonical || null);
    setNRaw(next);
  }, []);
  useScrollIndex(mainRef, updateN, step);

  // Reads the current URL (hash + search) and applies it to state. Used
  // both on first load and whenever the URL changes out from under us —
  // e.g. the user edits the hash by hand and hits enter, or navigates
  // back/forward. Editing only the hash is a same-document navigation in
  // browsers (no reload), so without this the app would silently ignore it.
  const loadFromUrl = useCallback(() => {
    const fromAlgorithm = algorithmFromSearch();
    if (fromAlgorithm) {
      setAlgorithm(fromAlgorithm.canonical || null);
      setNRaw(fromAlgorithm.n);
      setShowNotation(true);
    } else {
      const fromHash = indexFromHash();
      if (fromHash !== null) {
        setAlgorithm(null);
        setNRaw(fromHash);
      }
    }
    const fromView = viewFromSearch();
    if (fromView !== null) setView(fromView);
  }, []);

  useEffect(() => {
    loadFromUrl();
    window.addEventListener("hashchange", loadFromUrl);
    window.addEventListener("popstate", loadFromUrl);
    return () => {
      window.removeEventListener("hashchange", loadFromUrl);
      window.removeEventListener("popstate", loadFromUrl);
    };
  }, [loadFromUrl]);

  // Shareable URLs: keep ?view=, #<n> (or &alg= in place of the hash
  // when the state came from typed notation) in sync, debounced so
  // scrolling doesn't hammer the history API. Written together so
  // neither part clobbers the other.
  useEffect(() => {
    const t = setTimeout(() => {
      const tail = algorithm
        ? `&alg=${encodeURIComponent(algorithm)}`
        : n === 0n
          ? ""
          : `#${n + 1n}`;
      window.history.replaceState(
        null,
        "",
        `?view=${view.toLowerCase()}${tail}`
      );
    }, 300);
    return () => clearTimeout(t);
  }, [n, view, algorithm]);

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
        <PermutationCounter
          n={n}
          onCommit={setN}
          action={<CopyLinkButton n={n} view={view} algorithm={algorithm} />}
        />
        <Credits />
        <div className="flex flex-wrap items-center gap-1.5">
          <FxToggle on={fx} onChange={setFx} />
          <PatternsToggle on={showPatterns} onChange={setShowPatterns} />
          <NotationToggle on={showNotation} onChange={setShowNotation} />
          <ViewToggle view={view} onChange={setView} />
          <StepToggle step={step} onChange={setStep} />
        </div>
      </div>

      {/* Desktop/tablet: original left counter / right controls split. */}
      <div className="hidden sm:absolute sm:left-8 sm:top-7 sm:flex sm:flex-col sm:items-start sm:gap-2">
        <PermutationCounter
          n={n}
          onCommit={setN}
          action={<CopyLinkButton n={n} view={view} algorithm={algorithm} />}
        />
        <Credits />
      </div>

      <div className="hidden sm:absolute sm:right-8 sm:top-7 sm:flex sm:flex-col sm:items-end sm:gap-2">
        <div className="flex items-center gap-2">
          <FxToggle on={fx} onChange={setFx} />
          <PatternsToggle on={showPatterns} onChange={setShowPatterns} />
          <NotationToggle on={showNotation} onChange={setShowNotation} />
          <ViewToggle view={view} onChange={setView} />
        </div>
        <StepToggle step={step} onChange={setStep} />
      </div>

      <div className="absolute bottom-6 left-1/2 flex w-[min(560px,calc(100vw-3rem))] -translate-x-1/2 flex-col gap-2 sm:bottom-8">
        {showNotation && <NotationInput onApply={applyNotation} />}
        <RulerSlider n={n} onChange={setN} showPatterns={showPatterns} />
      </div>
    </main>
  );
}
