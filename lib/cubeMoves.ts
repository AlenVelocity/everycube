// A verified facelet-level move engine, used only to derive the exact
// index of a few famous named patterns (see patterns.ts) by actually
// simulating the documented turn sequence rather than guessing.
//
// Rather than hand-transcribing row-cycle tables from memory (an easy
// place for cube-notation bugs to hide), each move's facelet permutation
// is *computed* from the same 3D geometry already proven correct in
// cubiePlacement.ts (faceletToCubie, cross-checked there against
// stickersForIndex for 500 random states). A physical clockwise turn of
// a face with outward normal `axis` is a -90° rotation about `axis`;
// Rodrigues' rotation formula at θ=-90° reduces to
//   v' = axis·(axis·v) − (axis × v)
// which is applied to every facelet whose cubie lies in that layer
// (axis·pos === 1) to find where its color ends up.
import { FACE_NORMAL, faceletToCubie, type Vec3 } from "./cubiePlacement";

function rotateClockwise(v: Vec3, axis: Vec3): Vec3 {
  const dot = v[0] * axis[0] + v[1] * axis[1] + v[2] * axis[2];
  const cx = axis[1] * v[2] - axis[2] * v[1];
  const cy = axis[2] * v[0] - axis[0] * v[2];
  const cz = axis[0] * v[1] - axis[1] * v[0];
  return [axis[0] * dot - cx, axis[1] * dot - cy, axis[2] * dot - cz];
}

function normalToFace(n: Vec3): number {
  const f = FACE_NORMAL.findIndex(
    (fn) => fn[0] === n[0] && fn[1] === n[1] && fn[2] === n[2]
  );
  if (f === -1) throw new Error("cubeMoves: not a face normal");
  return f;
}

const FACELET_INFO = Array.from({ length: 54 }, (_, i) => faceletToCubie(i));

const LOOKUP = new Map<string, number>();
FACELET_INFO.forEach(({ pos, face }, i) => {
  LOOKUP.set(`${pos.join(",")}|${face}`, i);
});

// perm[i] = facelet that i's color moves into for one clockwise turn.
function buildQuarterPermutation(faceIdx: number): number[] {
  const axis = FACE_NORMAL[faceIdx];
  const perm = Array.from({ length: 54 }, (_, i) => i);
  for (let i = 0; i < 54; i++) {
    const { pos, face } = FACELET_INFO[i];
    const dot = pos[0] * axis[0] + pos[1] * axis[1] + pos[2] * axis[2];
    if (dot !== 1) continue;
    const newPos = rotateClockwise(pos, axis);
    const newFace = normalToFace(rotateClockwise(FACE_NORMAL[face], axis));
    const target = LOOKUP.get(`${newPos.join(",")}|${newFace}`);
    if (target === undefined)
      throw new Error("cubeMoves: move table build failed");
    perm[target] = i;
  }
  return perm;
}

const QUARTER_PERMS = Array.from({ length: 6 }, (_, f) =>
  buildQuarterPermutation(f)
);

const FACE_LETTER: Record<string, number> = {
  U: 0,
  R: 1,
  F: 2,
  D: 3,
  L: 4,
  B: 5,
};

export function applyMove(
  facelets: Uint8Array,
  face: number,
  turns: number
): Uint8Array {
  let cur = facelets;
  const perm = QUARTER_PERMS[face];
  for (let t = 0; t < turns; t++) {
    const next = new Uint8Array(54);
    for (let i = 0; i < 54; i++) next[perm[i]] = cur[i];
    cur = next;
  }
  return cur;
}

// Applies a space-separated algorithm string in standard cube notation
// (e.g. "U2 D2 F2 B2 L2 R2", "R U R' U'") to a facelet array.
export function applyAlgorithm(facelets: Uint8Array, alg: string): Uint8Array {
  let cur = facelets;
  for (const tok of alg.trim().split(/\s+/)) {
    if (!tok) continue;
    const face = FACE_LETTER[tok[0]];
    if (face === undefined) throw new Error(`cubeMoves: bad move "${tok}"`);
    const turns = tok.endsWith("2") ? 2 : tok.endsWith("'") ? 3 : 1;
    cur = applyMove(cur, face, turns);
  }
  return cur;
}
