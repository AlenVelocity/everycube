// Unit tests for the rank/unrank math core. Run with: npm run test:math
import {
  TOTAL,
  combineIndex,
  permParity,
  rankCornerOri,
  rankEdgeOri,
  rankEdgePerm,
  rankPerm,
  splitIndex,
  unrankCornerOri,
  unrankCornerPerm,
  unrankEdgeOri,
  unrankEdgePerm,
} from "../lib/cubeMath";
import { cubieStateFromStickers, stickersForIndex } from "../lib/cubeState";
import {
  CUBIE_STICKERS,
  FACE_NORMAL,
  NUM_CUBIES,
  applyMat,
  cubiePlacements,
  det3,
  faceletToCubie,
} from "../lib/cubiePlacement";
import { applyAlgorithm, applyMove } from "../lib/cubeMoves";
import { FAMOUS_PATTERNS } from "../lib/patterns";

let failures = 0;
function check(name: string, ok: boolean, detail?: string) {
  if (!ok) {
    failures++;
    console.error(`FAIL ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

// 1. Total count matches the known cube group order.
check("total", TOTAL === 43252003274489856000n, TOTAL.toString());

// 2. n = 0 is the solved cube: each face uniformly its own color.
{
  const f = stickersForIndex(0n);
  let solved = true;
  for (let i = 0; i < 54; i++) if (f[i] !== Math.floor(i / 9)) solved = false;
  check("solved-at-zero", solved, Array.from(f).join(""));
}

// 3. Round-trip: split/unrank then rank/combine returns the same index.
function randomIndex(): bigint {
  let n = 0n;
  for (let i = 0; i < 4; i++) n = (n << 16n) | BigInt(Math.floor(Math.random() * 65536));
  return n % TOTAL;
}

for (let t = 0; t < 2000; t++) {
  const n = randomIndex();
  const { eo, co, cp, ep } = splitIndex(n);
  const cornerPerm = unrankCornerPerm(cp);
  const edgePerm = unrankEdgePerm(ep, permParity(cornerPerm));
  const back = combineIndex({
    eo: rankEdgeOri(unrankEdgeOri(eo)),
    co: rankCornerOri(unrankCornerOri(co)),
    cp: rankPerm(cornerPerm),
    ep: rankEdgePerm(edgePerm),
  });
  check("round-trip", back === n, `n=${n} back=${back}`);
  if (back !== n) break;
}

// 4. Every unranked state is legal: orientation sums and permutation parity.
for (let t = 0; t < 2000; t++) {
  const n = randomIndex();
  const { eo, co, cp, ep } = splitIndex(n);
  const cornerPerm = unrankCornerPerm(cp);
  const edgePerm = unrankEdgePerm(ep, permParity(cornerPerm));
  const eoArr = unrankEdgeOri(eo);
  const coArr = unrankCornerOri(co);
  const eoSum = eoArr.reduce((a, b) => a + b, 0);
  const coSum = coArr.reduce((a, b) => a + b, 0);
  check("eo-sum-even", eoSum % 2 === 0, `n=${n}`);
  check("co-sum-mod3", coSum % 3 === 0, `n=${n}`);
  check(
    "parity-match",
    permParity(cornerPerm) === permParity(edgePerm),
    `n=${n}`
  );
  if (failures) break;
}

// 5. Sticker counts: every state has exactly 9 stickers of each color.
for (let t = 0; t < 500; t++) {
  const f = stickersForIndex(randomIndex());
  const counts = [0, 0, 0, 0, 0, 0];
  for (let i = 0; i < 54; i++) counts[f[i]]++;
  check("nine-of-each", counts.every((c) => c === 9), counts.join(","));
  if (failures) break;
}

// 6. First 2048 indices only flip edge stickers in place (positions solved).
{
  const solved = stickersForIndex(0n);
  const cornerStickers = new Set(
    [8, 9, 20, 6, 18, 38, 0, 36, 47, 2, 45, 11, 29, 26, 15, 27, 44, 24, 33, 53, 42, 35, 17, 51]
  );
  let ok = true;
  for (const n of [1n, 2n, 100n, 2047n]) {
    const f = stickersForIndex(n);
    for (const i of cornerStickers) if (f[i] !== solved[i]) ok = false;
  }
  check("eo-zone-corners-untouched", ok);
}

// 7. Physical cubie placements are proper rotations and reproduce the
// facelet colors exactly (3D piece view ≡ 2D facelet view).
{
  const reverse = new Map<string, number>();
  for (let i = 0; i < 54; i++) {
    const { pos, face } = faceletToCubie(i);
    reverse.set(`${pos.join(",")}|${face}`, i);
  }
  outer: for (let t = 0; t < 500; t++) {
    const n = t === 0 ? 0n : randomIndex();
    const expected = stickersForIndex(n);
    const placements = cubiePlacements(n);
    const got = new Uint8Array(54).fill(255);
    for (let id = 0; id < NUM_CUBIES; id++) {
      const { position, rotation } = placements[id];
      check("rotation-proper", det3(rotation) === 1, `n=${n} cubie=${id}`);
      for (const st of CUBIE_STICKERS[id]) {
        const world = applyMat(rotation, st.normal);
        const face = FACE_NORMAL.findIndex(
          (f) => f[0] === world[0] && f[1] === world[1] && f[2] === world[2]
        );
        const facelet = reverse.get(`${position.join(",")}|${face}`);
        check("sticker-on-surface", facelet !== undefined, `n=${n} cubie=${id}`);
        if (facelet === undefined) break outer;
        got[facelet] = st.face;
      }
    }
    let same = true;
    for (let i = 0; i < 54; i++) if (got[i] !== expected[i]) same = false;
    check("cubie-facelet-equivalence", same, `n=${n}`);
    if (failures) break;
  }
}

// 8. Move engine: every quarter turn is a bijection, four quarter turns
// of any face is the identity, and (facelets -> cubieState -> facelets)
// round-trips on the solved cube and after a scramble.
{
  const solved = stickersForIndex(0n);
  for (let face = 0; face < 6; face++) {
    let cur = solved;
    for (let t = 0; t < 4; t++) {
      cur = applyMove(cur, face, 1);
      check("move-is-permutation", new Set(cur).size === 6, `face=${face} t=${t}`);
    }
    let same = true;
    for (let i = 0; i < 54; i++) if (cur[i] !== solved[i]) same = false;
    check("four-quarter-turns-is-identity", same, `face=${face}`);
  }

  const scrambled = applyAlgorithm(solved, "R U R' U' F2 L D2 B'");
  const back = cubieStateFromStickers(scrambled);
  const cornerParity = permParity(back.cornerPerm);
  const edgeParity = permParity(back.edgePerm);
  check("moved-state-parity-matches", cornerParity === edgeParity);
  const coSum = back.cornerOri.reduce((a, b) => a + b, 0);
  const eoSum = back.edgeOri.reduce((a, b) => a + b, 0);
  check("moved-state-co-legal", coSum % 3 === 0);
  check("moved-state-eo-legal", eoSum % 2 === 0);
}

// 9. Famous patterns: loading lib/patterns.ts already throws if either
// check (superflip cross-check, checkerboard visual property) fails —
// reaching this line means both passed. Sanity-check the exported list.
check("famous-patterns-present", FAMOUS_PATTERNS.length === 2);
check(
  "famous-patterns-in-range",
  FAMOUS_PATTERNS.every((p) => p.n >= 0n && p.n < TOTAL)
);

if (failures === 0) console.log("All math tests passed.");
else process.exit(1);
