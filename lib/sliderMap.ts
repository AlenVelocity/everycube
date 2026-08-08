import { TOTAL, clampIndex } from "./cubeMath";

// Plain linear mapping between slider position [0,1] and index [0, TOTAL).
// (A log-scale variant was tried and rejected — see git/README history.)
const SCALE = 10n ** 15n;
const SCALE_NUM = 1e15;

export function positionToIndex(pos: number): bigint {
  const p = Math.min(Math.max(pos, 0), 1);
  return clampIndex((BigInt(Math.round(p * SCALE_NUM)) * TOTAL) / SCALE);
}

export function indexToPosition(n: bigint): number {
  return Number((n * 10n ** 6n) / TOTAL) / 1e6;
}
