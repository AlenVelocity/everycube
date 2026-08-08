"use client";

const iconClasses =
  "text-zinc-400 transition-colors hover:text-zinc-600 [filter:drop-shadow(0_1px_2px_rgba(255,255,255,0.9))]";

export default function Credits() {
  return (
    <div className="pointer-events-auto flex select-none items-center gap-3">
      <a
        href="https://github.com/alenvelocity/everycube"
        target="_blank"
        rel="noopener noreferrer"
        title="alenvelocity/everycube on GitHub"
        aria-label="View source on GitHub"
        className={iconClasses}
      >
        <svg
          viewBox="0 0 16 16"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M5 3.5 1.5 8 5 12.5" />
          <path d="M11 3.5 14.5 8 11 12.5" />
        </svg>
      </a>
      <a
        href="https://x.com/alenvelocity"
        target="_blank"
        rel="noopener noreferrer"
        title="@alenvelocity on X"
        aria-label="@alenvelocity on X"
        className={iconClasses}
      >
        <svg
          viewBox="0 0 16 16"
          width="14"
          height="14"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M9.46 6.88 15.02 0h-1.32L8.87 5.98 4.83 0H0l5.83 8.9L0 16h1.32l5.13-6.32L10.68 16H15.5L9.46 6.88Zm-1.82 2.24-.6-.87L1.8 1.04h2.02l3.8 5.5.6.87 4.94 7.15H10.9l-4.02-5.44Z" />
        </svg>
      </a>
      <a
        href="https://alen.is"
        target="_blank"
        rel="noopener noreferrer"
        title="by Alen"
        aria-label="by Alen"
        className={iconClasses}
      >
        <svg
          viewBox="0 0 16 16"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          aria-hidden="true"
        >
          <circle cx="8" cy="8" r="6.5" />
          <ellipse cx="8" cy="8" rx="2.7" ry="6.5" />
          <path d="M1.7 6h12.6M1.7 10h12.6" />
        </svg>
      </a>
    </div>
  );
}
