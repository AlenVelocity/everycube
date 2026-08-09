"use client";

import { useState } from "react";
import type { ViewMode } from "./ViewToggle";

// Builds the URL fresh from state rather than reading window.location,
// since the URL is only written on a 300ms debounce and could be stale
// at the instant of a click right after scrolling. When the current
// state came from typed notation, the link carries the human-readable
// ?alg= scramble instead of the (much less meaningful) big number.
function shareUrl(n: bigint, view: ViewMode, algorithm: string | null): string {
  const base = `${window.location.origin}${window.location.pathname}?view=${view.toLowerCase()}`;
  if (algorithm) return `${base}&alg=${encodeURIComponent(algorithm)}`;
  const hash = n === 0n ? "" : `#${n + 1n}`;
  return `${base}${hash}`;
}

function fallbackCopy(text: string) {
  const el = document.createElement("textarea");
  el.value = text;
  el.style.position = "fixed";
  el.style.opacity = "0";
  document.body.appendChild(el);
  el.select();
  document.execCommand("copy");
  document.body.removeChild(el);
}

export default function CopyLinkButton({
  n,
  view,
  algorithm = null,
}: {
  n: bigint;
  view: ViewMode;
  algorithm?: string | null;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    const url = shareUrl(n, view, algorithm);
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      fallbackCopy(url);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      type="button"
      onClick={copy}
      title={
        algorithm ? "Copy link to this scramble" : "Copy shareable link"
      }
      aria-label="Copy shareable link"
      className="inline-flex h-6 shrink-0 items-center gap-1 self-center rounded-md px-1.5 text-[10px] font-medium text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 sm:h-7 sm:text-[11px]"
    >
      {copied ? (
        "Copied"
      ) : (
        <svg
          viewBox="0 0 16 16"
          width="14"
          height="14"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M6.5 9.5 9.5 6.5" />
          <path d="M6.7 3.3 8 2c1.1-1.1 2.9-1.1 4 0s1.1 2.9 0 4l-1.3 1.3" />
          <path d="M9.3 12.7 8 14c-1.1 1.1-2.9 1.1-4 0s-1.1-2.9 0-4l1.3-1.3" />
        </svg>
      )}
    </button>
  );
}
