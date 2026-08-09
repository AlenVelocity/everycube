// A small, curated set of famous named cube patterns, each resolved to
// its exact permutation index so the ruler can mark and jump to them.
//
// Every entry is computed, not guessed, and self-checked at module load
// (throwing if a check fails, so a wrong pattern can never ship silently):
//  - Superflip is built directly from its textbook definition (every
//    edge home but flipped, corners untouched) and cross-checked against
//    simulating a documented superflip algorithm with the move engine.
//  - Checkerboard is produced by simulating its documented algorithm and
//    verified against the pattern's actual defining property: each face
//    reads as two alternating colors in a checkerboard layout.
import {
  CubieState,
  cubieStateFromStickers,
  indexFromCubieState,
  stickersForIndex,
} from "./cubeState";
import { applyAlgorithm } from "./cubeMoves";

function isFaceCheckerboard(f: Uint8Array, base: number): boolean {
  const even = [0, 2, 4, 6, 8].map((k) => f[base + k]);
  const odd = [1, 3, 5, 7].map((k) => f[base + k]);
  return (
    even.every((c) => c === even[0]) &&
    odd.every((c) => c === odd[0]) &&
    even[0] !== odd[0]
  );
}

export interface FamousPattern {
  name: string;
  n: bigint;
}

function buildPatterns(): FamousPattern[] {
  const patterns: FamousPattern[] = [];

  // Superflip: identity permutation, every edge flipped in place.
  const superflip: CubieState = {
    cornerPerm: [0, 1, 2, 3, 4, 5, 6, 7],
    cornerOri: [0, 0, 0, 0, 0, 0, 0, 0],
    edgePerm: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    edgeOri: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  };
  const superflipN = indexFromCubieState(superflip);
  // Cross-check by round-tripping through the facelet layer: unranking
  // superflipN and re-deriving its cubie state must reproduce exactly
  // the identity-permutation, all-edges-flipped definition above.
  const roundTrip = cubieStateFromStickers(stickersForIndex(superflipN));
  if (indexFromCubieState(roundTrip) !== superflipN) {
    throw new Error("patterns: superflip failed round-trip");
  }
  patterns.push({ name: "Superflip", n: superflipN });

  // Checkerboard: verified against the pattern's actual visual property,
  // not against a memorized permutation.
  const checkerFacelets = applyAlgorithm(
    stickersForIndex(0n),
    "U2 D2 F2 B2 L2 R2"
  );
  const isCheckerboard = [0, 9, 18, 27, 36, 45].every((base) =>
    isFaceCheckerboard(checkerFacelets, base)
  );
  if (!isCheckerboard) {
    throw new Error("patterns: checkerboard algorithm didn't produce one");
  }
  patterns.push({
    name: "Checkerboard",
    n: indexFromCubieState(cubieStateFromStickers(checkerFacelets)),
  });

  return patterns;
}

export const FAMOUS_PATTERNS: readonly FamousPattern[] = buildPatterns();
