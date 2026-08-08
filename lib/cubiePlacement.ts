// Pure integer math for placing physical cubies: each of the 26 pieces
// gets a slot position and a rigid rotation for a given index n, so the
// 3D view can animate real pieces travelling to their new homes.
// Stickers are painted on pieces once (solved colors); state changes are
// pure motion, never recoloring.

import { CORNER_COLOR, EDGE_COLOR, cubieStateForIndex } from "./cubeState";

export type Vec3 = readonly [number, number, number];
export type Mat3 = number[][]; // 3x3, rows

// Outward normal of each face, Kociemba order U R F D L B.
export const FACE_NORMAL: readonly Vec3[] = [
  [0, 1, 0],
  [1, 0, 0],
  [0, 0, 1],
  [0, -1, 0],
  [-1, 0, 0],
  [0, 0, -1],
];

const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];

const facesToNormals = (faces: readonly number[]): Vec3[] =>
  faces.map((f) => FACE_NORMAL[f]);

const sumNormals = (faces: readonly number[]): Vec3 =>
  facesToNormals(faces).reduce((p, v) => add(p, v), [0, 0, 0] as Vec3);

// Slot centers in cubie units, e.g. URF -> (1,1,1), UR -> (1,1,0).
export const CORNER_POS: readonly Vec3[] = CORNER_COLOR.map(sumNormals);
export const EDGE_POS: readonly Vec3[] = EDGE_COLOR.map(sumNormals);

// The rotation R = T·Hᵀ mapping home sticker normals onto target slot
// normals. Pairs (edges) are completed to right-handed triples with a
// cross product so R is always a proper rotation.
function rotationBetween(home: Vec3[], target: Vec3[]): Mat3 {
  const h = home.length === 2 ? [...home, cross(home[0], home[1])] : home;
  const t =
    target.length === 2 ? [...target, cross(target[0], target[1])] : target;
  const R: Mat3 = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ];
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 3; c++) {
      let s = 0;
      for (let k = 0; k < 3; k++) s += t[k][r] * h[k][c];
      R[r][c] = s;
    }
  return R;
}

export const IDENTITY: Mat3 = [
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1],
];

export interface CubiePlacement {
  position: Vec3;
  rotation: Mat3;
}

// Cubie ids: corners 0-7, edges 8-19, centers 20-25 (by face).
export const NUM_CUBIES = 26;

export function cubiePlacements(n: bigint): CubiePlacement[] {
  const { cornerPerm, cornerOri, edgePerm, edgeOri } = cubieStateForIndex(n);
  const out = new Array<CubiePlacement>(NUM_CUBIES);
  for (let s = 0; s < 8; s++) {
    const j = cornerPerm[s];
    const o = cornerOri[s];
    // Cubie j's sticker k lands on slot s's face (k+o)%3 (matches the
    // facelet formula in cubeState.stickersForIndex).
    out[j] = {
      position: CORNER_POS[s],
      rotation: rotationBetween(
        facesToNormals(CORNER_COLOR[j]),
        [0, 1, 2].map((k) => FACE_NORMAL[CORNER_COLOR[s][(k + o) % 3]])
      ),
    };
  }
  for (let s = 0; s < 12; s++) {
    const j = edgePerm[s];
    const o = edgeOri[s];
    out[8 + j] = {
      position: EDGE_POS[s],
      rotation: rotationBetween(
        facesToNormals(EDGE_COLOR[j]),
        [0, 1].map((k) => FACE_NORMAL[EDGE_COLOR[s][(k + o) % 2]])
      ),
    };
  }
  for (let f = 0; f < 6; f++)
    out[20 + f] = { position: FACE_NORMAL[f], rotation: IDENTITY };
  return out;
}

// Sticker layout for building each cubie's geometry: home face (= color)
// and outward normal, in cubie-local space.
export interface CubieSticker {
  face: number;
  normal: Vec3;
}

export const CUBIE_STICKERS: readonly CubieSticker[][] = [
  ...CORNER_COLOR.map((fs) =>
    fs.map((f) => ({ face: f, normal: FACE_NORMAL[f] }))
  ),
  ...EDGE_COLOR.map((fs) =>
    fs.map((f) => ({ face: f, normal: FACE_NORMAL[f] }))
  ),
  ...FACE_NORMAL.map((nrm, f) => [{ face: f, normal: nrm }]),
];

export function applyMat(m: Mat3, v: Vec3): Vec3 {
  return [
    m[0][0] * v[0] + m[0][1] * v[1] + m[0][2] * v[2],
    m[1][0] * v[0] + m[1][1] * v[1] + m[1][2] * v[2],
    m[2][0] * v[0] + m[2][1] * v[1] + m[2][2] * v[2],
  ];
}

export function det3(m: Mat3): number {
  return (
    m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) -
    m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) +
    m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0])
  );
}

// facelet i -> the cubie position and face it sits on (inverse of the
// facelet layout used by the 2D renderer). Test-support and useful for
// any facelet<->cubie cross-checks.
export function faceletToCubie(i: number): { pos: Vec3; face: number } {
  const face = Math.floor(i / 9);
  const r = Math.floor((i % 9) / 3);
  const c = i % 3;
  switch (face) {
    case 0:
      return { pos: [c - 1, 1, r - 1], face };
    case 1:
      return { pos: [1, 1 - r, 1 - c], face };
    case 2:
      return { pos: [c - 1, 1 - r, 1], face };
    case 3:
      return { pos: [c - 1, -1, 1 - r], face };
    case 4:
      return { pos: [-1, 1 - r, c - 1], face };
    default:
      return { pos: [1 - c, 1 - r, -1], face };
  }
}
