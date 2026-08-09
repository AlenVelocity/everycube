"use client";

import { FACE_HEX } from "@/lib/cubeState";

// Unfolded cross layout:        U
//                          L  F  R  B
//                               D
// Grid slots as [column, row]; base is the face's first facelet index.
const NET_FACES: { base: number; col: number; row: number }[] = [
  { base: 0, col: 2, row: 1 }, // U
  { base: 36, col: 1, row: 2 }, // L
  { base: 18, col: 2, row: 2 }, // F
  { base: 9, col: 3, row: 2 }, // R
  { base: 45, col: 4, row: 2 }, // B
  { base: 27, col: 2, row: 3 }, // D
];

export default function CubeViewport2D({ stickers }: { stickers: Uint8Array }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div
        className="grid gap-2.5 sm:gap-3"
        style={{
          gridTemplateColumns: "repeat(4, minmax(64px, 118px))",
          gridTemplateRows: "repeat(3, minmax(64px, 118px))",
          width: "min(88vw, 560px)",
        }}
      >
        {NET_FACES.map(({ base, col, row }) => (
          <div
            key={base}
            className="grid aspect-square grid-cols-3 grid-rows-3 gap-[3px] rounded-lg bg-zinc-200 p-[3px]"
            style={{ gridColumn: col, gridRow: row }}
          >
            {Array.from({ length: 9 }, (_, i) => (
              <div
                key={i}
                className="rounded-[3px] transition-colors duration-300"
                style={{ background: FACE_HEX[stickers[base + i]] }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
