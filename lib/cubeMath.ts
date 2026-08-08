// Rank/unrank for the cube group, decomposed into the four standard
// Kociemba-style coordinates. The combined index is mixed-radix with
// orientations least-significant so scrolling from 0 changes the cube
// subtly at first (sticker twists/flips) before permutations kick in:
//
//   n = Eo + 2048 * (Co + 2187 * (Cp + 40320 * Ep))

export const N_EO = 2048n; // 2^11 edge orientations
export const N_CO = 2187n; // 3^7 corner orientations
export const N_CP = 40320n; // 8! corner permutations
export const N_EP = 239500800n; // 12!/2 edge permutations (parity-linked to Cp)

export const TOTAL = N_EO * N_CO * N_CP * N_EP; // 43,252,003,274,489,856,000

export interface CubeCoords {
  eo: number;
  co: number;
  cp: number;
  ep: number;
}

export function clampIndex(n: bigint): bigint {
  if (n < 0n) return 0n;
  if (n >= TOTAL) return TOTAL - 1n;
  return n;
}

export function splitIndex(n: bigint): CubeCoords {
  const eo = Number(n % N_EO);
  let r = n / N_EO;
  const co = Number(r % N_CO);
  r /= N_CO;
  const cp = Number(r % N_CP);
  const ep = Number(r / N_CP);
  return { eo, co, cp, ep };
}

export function combineIndex(c: CubeCoords): bigint {
  return (
    BigInt(c.eo) +
    N_EO * (BigInt(c.co) + N_CO * (BigInt(c.cp) + N_CP * BigInt(c.ep)))
  );
}

// Lehmer-code digits of `rank`, most-significant first.
// digits[i] is in [0, size-1-i]; digits[size-1] is always 0.
function lehmerDigits(rank: number, size: number): number[] {
  const digits: number[] = [];
  for (let i = 1; i <= size; i++) {
    digits.unshift(rank % i);
    rank = Math.floor(rank / i);
  }
  return digits;
}

function digitsToPerm(digits: number[]): number[] {
  const items = Array.from({ length: digits.length }, (_, i) => i);
  return digits.map((d) => items.splice(d, 1)[0]);
}

export function permParity(perm: number[]): number {
  let inversions = 0;
  for (let i = 0; i < perm.length; i++)
    for (let j = i + 1; j < perm.length; j++)
      if (perm[i] > perm[j]) inversions++;
  return inversions % 2;
}

export function unrankCornerPerm(cp: number): number[] {
  return digitsToPerm(lehmerDigits(cp, 8));
}

// ep is in [0, 12!/2). Each ep owns the Lehmer-rank pair {2ep, 2ep+1},
// which differ only in their final swap and therefore in parity; we pick
// the member whose parity matches the corner permutation, so every
// unranked index is a legal cube state.
export function unrankEdgePerm(ep: number, cornerParity: number): number[] {
  const digits = lehmerDigits(ep * 2, 12);
  const parity = digits.reduce((a, b) => a + b, 0) % 2;
  if (parity !== cornerParity) digits[10] ^= 1; // toggles rank by 1, flips parity
  return digitsToPerm(digits);
}

export function rankPerm(perm: number[]): number {
  const items = Array.from({ length: perm.length }, (_, i) => i);
  let rank = 0;
  for (let i = 0; i < perm.length; i++) {
    const d = items.indexOf(perm[i]);
    items.splice(d, 1);
    rank = rank * (perm.length - i) + d;
  }
  return rank;
}

export function rankEdgePerm(perm: number[]): number {
  return Math.floor(rankPerm(perm) / 2);
}

// co in [0, 3^7): twists of corners 0..6; corner 7 makes total ≡ 0 (mod 3).
export function unrankCornerOri(co: number): number[] {
  const ori = new Array<number>(8).fill(0);
  let sum = 0;
  for (let i = 6; i >= 0; i--) {
    ori[i] = co % 3;
    co = (co - ori[i]) / 3;
    sum += ori[i];
  }
  ori[7] = (3 - (sum % 3)) % 3;
  return ori;
}

export function rankCornerOri(ori: number[]): number {
  let co = 0;
  for (let i = 0; i < 7; i++) co = co * 3 + ori[i];
  return co;
}

// eo in [0, 2^11): flips of edges 0..10; edge 11 makes total even.
export function unrankEdgeOri(eo: number): number[] {
  const ori = new Array<number>(12).fill(0);
  let sum = 0;
  for (let i = 10; i >= 0; i--) {
    ori[i] = eo & 1;
    eo >>= 1;
    sum += ori[i];
  }
  ori[11] = sum % 2;
  return ori;
}

export function rankEdgeOri(ori: number[]): number {
  let eo = 0;
  for (let i = 0; i < 11; i++) eo = (eo << 1) | ori[i];
  return eo;
}
