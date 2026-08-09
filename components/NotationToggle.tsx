"use client";

export default function NotationToggle({
  on,
  onChange,
}: {
  on: boolean;
  onChange: (on: boolean) => void;
}) {
  return (
    <div className="inline-flex rounded-lg bg-zinc-100/90 p-[3px] shadow-md backdrop-blur-sm sm:rounded-[9px]">
      <button
        type="button"
        onClick={() => onChange(!on)}
        aria-pressed={on}
        title="Enter cube notation (e.g. R U R' U') to jump to a scramble"
        className={
          "rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors sm:px-3.5 sm:py-1.5 sm:text-[13px] " +
          (on
            ? "bg-white text-zinc-900 shadow-sm"
            : "text-zinc-500 hover:text-zinc-700")
        }
      >
        R'
      </button>
    </div>
  );
}
