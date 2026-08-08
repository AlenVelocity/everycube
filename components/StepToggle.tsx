"use client";

export const SCROLL_STEPS = [1, 500, 1000, 5000] as const;

const STEP_LABELS: Record<number, string> = {
  1: "1",
  500: "500",
  1000: "1k",
  5000: "5k",
};

export default function StepToggle({
  step,
  onChange,
}: {
  step: number;
  onChange: (step: number) => void;
}) {
  return (
    <div
      className="inline-flex gap-0.5 rounded-lg bg-zinc-100/90 p-[3px] shadow-md backdrop-blur-sm sm:rounded-[9px]"
      title="Permutations per scroll notch"
    >
      {SCROLL_STEPS.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          aria-pressed={step === s}
          aria-label={`${s} permutations per scroll`}
          className={
            "rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors [font-variant-numeric:tabular-nums] sm:px-3.5 sm:py-1.5 sm:text-[13px] " +
            (step === s
              ? "bg-white text-zinc-900 shadow-sm"
              : "text-zinc-500 hover:text-zinc-700")
          }
        >
          {STEP_LABELS[s]}
        </button>
      ))}
    </div>
  );
}
