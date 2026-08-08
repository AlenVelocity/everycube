"use client";

export type ViewMode = "2D" | "3D";

export default function ViewToggle({
  view,
  onChange,
}: {
  view: ViewMode;
  onChange: (view: ViewMode) => void;
}) {
  return (
    <div className="inline-flex gap-0.5 rounded-lg bg-zinc-100/90 p-[3px] shadow-md backdrop-blur-sm sm:rounded-[9px]">
      {(["2D", "3D"] as const).map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          aria-pressed={view === v}
          className={
            "rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors sm:px-3.5 sm:py-1.5 sm:text-[13px] " +
            (view === v
              ? "bg-white text-zinc-900 shadow-sm"
              : "text-zinc-500 hover:text-zinc-700")
          }
        >
          {v}
        </button>
      ))}
    </div>
  );
}
