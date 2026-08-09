"use client";

import { useMemo } from "react";
import { FAMOUS_PATTERNS } from "@/lib/patterns";
import { indexToPosition, positionToIndex } from "@/lib/sliderMap";

const RESOLUTION = 1_000_000;

// Evenly spaced ruler ticks; majors line up with the quarter labels.
const TICK_COUNT = 80;
const MAJOR_EVERY = 20;

const LABELS: { pos: number; text: string }[] = [
  { pos: 0, text: "1" },
  { pos: 0.25, text: "1.1×10¹⁹" },
  { pos: 0.5, text: "2.2×10¹⁹" },
  { pos: 0.75, text: "3.2×10¹⁹" },
  { pos: 1, text: "4.3×10¹⁹" },
];

export default function RulerSlider({
  n,
  onChange,
  showPatterns = false,
}: {
  n: bigint;
  onChange: (n: bigint) => void;
  showPatterns?: boolean;
}) {
  const pos = indexToPosition(n);

  const ticks = useMemo(
    () =>
      Array.from({ length: TICK_COUNT + 1 }, (_, i) => ({
        pos: i / TICK_COUNT,
        major: i % MAJOR_EVERY === 0,
      })),
    []
  );

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white/95 px-5 pb-1.5 pt-3 shadow-lg backdrop-blur-sm">
      <div className="relative h-9">
        <input
          type="range"
          min={0}
          max={RESOLUTION}
          step={1}
          value={Math.round(pos * RESOLUTION)}
          aria-label="Permutation index"
          onChange={(e) =>
            onChange(positionToIndex(Number(e.target.value) / RESOLUTION))
          }
          className="peer absolute inset-0 z-10 w-full cursor-ew-resize opacity-0"
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0">
          {ticks.map((t, i) => (
            <div
              key={i}
              className={
                "absolute bottom-0 -translate-x-1/2 " +
                (t.major
                  ? "h-[18px] w-[2px] bg-zinc-400"
                  : "h-[9px] w-px bg-zinc-300")
              }
              style={{ left: `${t.pos * 100}%` }}
            />
          ))}
          <div className="absolute bottom-0 h-[2px] w-full bg-zinc-200" />
        </div>
        <div
          className="pointer-events-none absolute bottom-0 h-8 w-[4px] -translate-x-1/2 rounded-[2px] bg-zinc-900 shadow peer-focus-visible:ring-2 peer-focus-visible:ring-zinc-400 peer-focus-visible:ring-offset-2"
          style={{ left: `${pos * 100}%` }}
        />
        {showPatterns &&
          FAMOUS_PATTERNS.map((p) => (
            <button
              key={p.name}
              type="button"
              title={`Jump to ${p.name}`}
              aria-label={`Jump to ${p.name}`}
              onClick={() => onChange(p.n)}
              className="group absolute top-0 z-20 -translate-x-1/2 cursor-pointer touch-auto"
              style={{ left: `${indexToPosition(p.n) * 100}%` }}
            >
              <span className="block h-[7px] w-[7px] rounded-full bg-amber-400 shadow ring-1 ring-white transition-transform group-hover:scale-125" />
              <span className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 whitespace-nowrap rounded-md bg-zinc-900 px-1.5 py-0.5 text-[10px] font-medium text-white opacity-0 shadow transition-opacity group-hover:opacity-100">
                {p.name}
              </span>
            </button>
          ))}
      </div>
      <div className="pointer-events-none relative mt-1 h-4 select-none text-[10px] font-medium text-zinc-400 [font-variant-numeric:tabular-nums]">
        {LABELS.map((l, i) => (
          <span
            key={i}
            className="absolute"
            style={
              i === 0
                ? { left: 0 }
                : i === LABELS.length - 1
                  ? { right: 0 }
                  : { left: `${l.pos * 100}%`, transform: "translateX(-50%)" }
            }
          >
            {l.text}
          </span>
        ))}
      </div>
    </div>
  );
}
