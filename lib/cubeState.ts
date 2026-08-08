import {
  permParity,
  splitIndex,
  unrankCornerOri,
  unrankCornerPerm,
  unrankEdgeOri,
  unrankEdgePerm,
} from "./cubeMath";

// Faces in Kociemba order. Facelets are numbered 0..53:
// U 0-8, R 9-17, F 18-26, D 27-35, L 36-44, B 45-53,
// each face read row by row, left to right.
export enum Face {
  U = 0,
  R = 1,
  F = 2,
  D = 3,
  L = 4,
  B = 5,
}

// Sticker hexes taken from the base design mockup.
export const FACE_HEX: readonly string[] = [
  "#f5f4ef", // U white
  "#b71234", // R red
  "#009b48", // F green
  "#ffd500", // D yellow
  "#ff5800", // L orange
  "#0046ad", // B blue
];

// Corners: URF, UFL, ULB, UBR, DFR, DLF, DBL, DRB
const CORNER_FACELET: readonly number[][] = [
  [8, 9, 20],
  [6, 18, 38],
  [0, 36, 47],
  [2, 45, 11],
  [29, 26, 15],
  [27, 44, 24],
  [33, 53, 42],
  [35, 17, 51],
];

// Faces of each corner cubie/slot, listed clockwise viewed from outside.
export const CORNER_COLOR: readonly Face[][] = [
  [Face.U, Face.R, Face.F],
  [Face.U, Face.F, Face.L],
  [Face.U, Face.L, Face.B],
  [Face.U, Face.B, Face.R],
  [Face.D, Face.F, Face.R],
  [Face.D, Face.L, Face.F],
  [Face.D, Face.B, Face.L],
  [Face.D, Face.R, Face.B],
];

// Edges: UR, UF, UL, UB, DR, DF, DL, DB, FR, FL, BL, BR
const EDGE_FACELET: readonly number[][] = [
  [5, 10],
  [7, 19],
  [3, 37],
  [1, 46],
  [32, 16],
  [28, 25],
  [30, 43],
  [34, 52],
  [23, 12],
  [21, 41],
  [50, 39],
  [48, 14],
];

export const EDGE_COLOR: readonly Face[][] = [
  [Face.U, Face.R],
  [Face.U, Face.F],
  [Face.U, Face.L],
  [Face.U, Face.B],
  [Face.D, Face.R],
  [Face.D, Face.F],
  [Face.D, Face.L],
  [Face.D, Face.B],
  [Face.F, Face.R],
  [Face.F, Face.L],
  [Face.B, Face.L],
  [Face.B, Face.R],
];

const CENTER_FACELET = [4, 13, 22, 31, 40, 49];

export interface CubieState {
  cornerPerm: number[];
  cornerOri: number[];
  edgePerm: number[];
  edgeOri: number[];
}

// unrank(n) -> which cubie sits in each slot, and how it's twisted/flipped.
export function cubieStateForIndex(n: bigint): CubieState {
  const { eo, co, cp, ep } = splitIndex(n);
  const cornerPerm = unrankCornerPerm(cp);
  return {
    cornerPerm,
    cornerOri: unrankCornerOri(co),
    edgePerm: unrankEdgePerm(ep, permParity(cornerPerm)),
    edgeOri: unrankEdgeOri(eo),
  };
}

// unrank(n) -> array of 54 face colors (values 0..5).
export function stickersForIndex(n: bigint): Uint8Array {
  const {
    cornerPerm,
    cornerOri,
    edgePerm,
    edgeOri,
  } = cubieStateForIndex(n);

  const f = new Uint8Array(54);
  for (let face = 0; face < 6; face++) f[CENTER_FACELET[face]] = face;

  for (let i = 0; i < 8; i++) {
    const cubie = cornerPerm[i];
    const ori = cornerOri[i];
    for (let k = 0; k < 3; k++) {
      f[CORNER_FACELET[i][(k + ori) % 3]] = CORNER_COLOR[cubie][k];
    }
  }

  for (let i = 0; i < 12; i++) {
    const cubie = edgePerm[i];
    const ori = edgeOri[i];
    for (let k = 0; k < 2; k++) {
      f[EDGE_FACELET[i][(k + ori) % 2]] = EDGE_COLOR[cubie][k];
    }
  }

  return f;
}
