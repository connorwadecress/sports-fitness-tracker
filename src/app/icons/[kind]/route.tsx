import { ImageResponse } from "next/og";

// App icons drawn in code: a pitch-blue tile with the warm mood shape and a P.

const SIZES: Record<string, { size: number; pad: number; round: boolean }> = {
  "192": { size: 192, pad: 0, round: true },
  "512": { size: 512, pad: 0, round: true },
  maskable: { size: 512, pad: 0.12, round: false },
  apple: { size: 180, pad: 0, round: false },
  badge: { size: 96, pad: 0, round: false },
};

export function generateStaticParams() {
  return Object.keys(SIZES).map((kind) => ({ kind }));
}

export async function GET(_req: Request, ctx: RouteContext<"/icons/[kind]">) {
  const { kind } = await ctx.params;
  const cfg = SIZES[kind];
  if (!cfg) return new Response("Not found", { status: 404 });
  const { size, pad, round } = cfg;
  const inner = size * (1 - pad * 2);

  if (kind === "badge") {
    // Monochrome silhouette for Android's status bar.
    return new ImageResponse(
      <div style={{ width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: size * 0.8, fontWeight: 800 }}>P</div>,
      { width: size, height: size },
    );
  }

  return new ImageResponse(
    (
      <div style={{ width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center", background: "#1B3FAE", borderRadius: round ? size * 0.22 : 0 }}>
        <div style={{ width: inner, height: inner, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
          <div style={{ position: "absolute", width: inner * 0.78, height: inner * 0.78, borderRadius: "50%", background: "#F29F33", opacity: 0.3 }} />
          <div style={{ position: "absolute", width: inner * 0.58, height: inner * 0.58, borderRadius: "50%", background: "#F29F33", opacity: 0.6 }} />
          <div style={{ position: "absolute", width: inner * 0.4, height: inner * 0.4, borderRadius: "50%", background: "#F29F33" }} />
          <div style={{ display: "flex", color: "white", fontSize: inner * 0.34, fontWeight: 800, marginTop: -inner * 0.02 }}>P</div>
        </div>
      </div>
    ),
    { width: size, height: size },
  );
}
