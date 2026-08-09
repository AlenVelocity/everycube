// Standard cube notation ("R U R' U'") -> the exact permutation index
// reached by applying it to the solved cube, via the verified move
// engine in cubeMoves.ts.
import { applyAlgorithm } from "./cubeMoves";
import {
  cubieStateFromStickers,
  indexFromCubieState,
  stickersForIndex,
} from "./cubeState";

// One face letter, optionally followed by 2 (double turn) or ' (prime).
// Wide/slice/rotation moves (r, M, x, ...) aren't supported by the move
// engine, so they're rejected here with a clear reason rather than
// silently mis-parsed.
const MOVE_RE = /^[UDLRFB](2|')?$/;

export class NotationError extends Error {}

// Curly/smart quotes (common on mobile keyboards) count as a prime.
// Parentheses are grouping only (e.g. "(R U R' U') R' F ..."), so they're
// dropped rather than rejected — grouping doesn't change what the moves
// resolve to, only how a human reads the algorithm.
function sanitize(input: string): string {
  return input.trim().replace(/[’‘]/g, "'").replace(/[()]/g, "").toUpperCase();
}

// An empty/blank input is treated as "no moves" (resolves to solved)
// rather than an error, so clearing the field and pressing Enter is a
// harmless reset.
export function validateAlgorithm(input: string): string[] {
  const alg = sanitize(input);
  if (!alg) return [];
  const tokens = alg.split(/\s+/).filter(Boolean);
  for (const tok of tokens) {
    if (!MOVE_RE.test(tok)) {
      throw new NotationError(
        `"${tok}" is not a supported move. Please use U D L R F B, optionally with 2 or '`
      );
    }
  }
  return tokens;
}

export interface ResolvedAlgorithm {
  n: bigint;
  // Sanitized, space-normalized move string — what gets put in the
  // shareable ?alg= URL, so a shared link shows the actual scramble
  // rather than an opaque 20-digit number.
  canonical: string;
}

export function resolveAlgorithm(input: string): ResolvedAlgorithm {
  const tokens = validateAlgorithm(input);
  const canonical = tokens.join(" ");
  const facelets = applyAlgorithm(stickersForIndex(0n), canonical);
  return {
    n: indexFromCubieState(cubieStateFromStickers(facelets)),
    canonical,
  };
}

export function indexFromAlgorithm(input: string): bigint {
  return resolveAlgorithm(input).n;
}
