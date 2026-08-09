import { ImageResponse } from "next/og";

// Edge runtime: the Node build of @vercel/og fails to resolve its bundled
// fallback font on Windows (ERR_INVALID_URL); the edge build embeds it.
export const runtime = "edge";

export const alt = "Every Cube — every Rubik's Cube permutation";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Minimal card: a single lightly-mixed cube face next to the wordmark,
// in the site's palette. (Satori supports flexbox only, hence the rows.)
const FACE: string[][] = [
  ["#f5f4ef", "#f5f4ef", "#009b48"],
  ["#f5f4ef", "#f5f4ef", "#f5f4ef"],
  ["#f5f4ef", "#b71234", "#f5f4ef"],
];

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 84,
        background: "#fafafa",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          padding: 10,
          background: "#e4e4e7",
          borderRadius: 28,
        }}
      >
        {FACE.map((row, r) => (
          <div key={r} style={{ display: "flex", gap: 10 }}>
            {row.map((color, c) => (
              <div
                key={c}
                style={{
                  width: 92,
                  height: 92,
                  background: color,
                  borderRadius: 14,
                }}
              />
            ))}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div
          style={{
            fontSize: 84,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            color: "#18181b",
          }}
        >
          Every Cube
        </div>
        <div style={{ fontSize: 30, color: "#71717a", maxWidth: 620 }}>
          All 43,252,003,274,489,856,000 Rubik&apos;s Cube permutations.
        </div>
      </div>
    </div>,
    size
  );
}
