"use client";

import { useState } from "react";
import { TOTAL } from "@/lib/cubeMath";

function withCommas(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

const NUMBER_CLASSES =
  "font-medium tracking-tight text-zinc-900 [font-variant-numeric:tabular-nums] [text-shadow:0_1px_3px_rgba(255,255,255,0.9)]";

// Numbers run up to 20 digits (43,252,003,274,489,856,000), so a fixed
// size either wastes space at #1 or crowds the controls at full scale.
// Scale with viewport width, clamped to the old text-2xl/text-3xl range.
const NUMBER_STYLE = { fontSize: "clamp(1.125rem, 4.8vw, 1.875rem)" };

// The big number is a label that turns into an input in place — same
// typography, same position, no chrome — on click.
export default function PermutationCounter({
  n,
  onCommit,
}: {
  n: bigint;
  onCommit: (n: bigint) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const display = (n + 1n).toLocaleString("en-US");

  const commit = () => {
    if (draft === null) return;
    const digits = draft.replace(/\D/g, "");
    setDraft(null);
    if (!digits) return;
    let value = BigInt(digits);
    if (value < 1n) value = 1n;
    if (value > TOTAL) value = TOTAL;
    onCommit(value - 1n);
  };

  return (
    <div className="select-none">
      <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-zinc-400 [text-shadow:0_1px_2px_rgba(255,255,255,0.9)]">
        Permutation
      </div>
      <div className={NUMBER_CLASSES} style={NUMBER_STYLE}>
        #
        {draft === null ? (
          <button
            type="button"
            title="Click to edit"
            onClick={() => setDraft((n + 1n).toString())}
            className="cursor-text appearance-none rounded-sm border-0 bg-transparent p-0 text-left font-[inherit] tracking-[inherit] text-inherit [font-variant-numeric:inherit] [text-shadow:inherit] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-zinc-400"
          >
            {display}
          </button>
        ) : (
          <input
            autoFocus
            onFocus={(e) => e.currentTarget.select()}
            inputMode="numeric"
            value={withCommas(draft.replace(/\D/g, ""))}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") setDraft(null);
            }}
            aria-label="Permutation number"
            className="m-0 border-0 bg-transparent p-0 font-[inherit] tracking-[inherit] text-inherit outline-none [font-variant-numeric:inherit] [text-shadow:inherit]"
            style={{
              width: `${Math.max(withCommas(draft.replace(/\D/g, "")).length, 1) + 0.5}ch`,
            }}
          />
        )}
      </div>
    </div>
  );
}
