# Every Cube

A scrollable index of every reachable Rubik's Cube permutation
(43,252,003,274,489,856,000 of them), rendered as a live 3D cube that
mutates as you scroll. No database — every state is generated on the
fly from an index `n` via a rank/unrank function over the cube group.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Scripts

- `npm run dev` — start the dev server
- `npm run build` / `npm run start` — production build and serve
- `npm run test:math` — unit tests for the rank/unrank math core (`lib/cubeMath.ts`, `lib/cubeState.ts`, `lib/cubiePlacement.ts`)

## How it works

Any permutation index `n` splits into four standard cube coordinates
(corner/edge permutation and orientation), ordered so low indices
change orientation only — the cube starts solved and lightly scrambles
before permutations kick in. See `lib/cubeMath.ts` for the math and
`lib/cubiePlacement.ts` for how it's turned into per-piece 3D
transforms.
