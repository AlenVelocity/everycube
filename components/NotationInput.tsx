"use client";

import { useState } from "react";
import { NotationError, resolveAlgorithm } from "@/lib/notation";

export default function NotationInput({
  onApply,
}: {
  onApply: (n: bigint, algorithm: string) => void;
}) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    try {
      const { n, canonical } = resolveAlgorithm(value);
      onApply(n, canonical);
      setError(null);
    } catch (e) {
      setError(e instanceof NotationError ? e.message : "Invalid scramble");
    }
  };

  return (
    <div
      className={
        "rounded-2xl border bg-white/95 px-4 py-2.5 shadow-lg backdrop-blur-sm transition-colors " +
        (error ? "border-red-300" : "border-zinc-200")
      }
    >
      <input
        type="text"
        autoCapitalize="characters"
        autoCorrect="off"
        spellCheck={false}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          if (error) setError(null);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
        }}
        placeholder="Enter a scramble, e.g. R U R' U'"
        aria-label="Cube notation"
        aria-invalid={!!error}
        className="w-full bg-transparent text-[13px] font-medium text-zinc-900 outline-none placeholder:text-zinc-400"
      />
      {error && <div className="mt-1 text-[11px] text-red-500">{error}</div>}
    </div>
  );
}
