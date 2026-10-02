import { ImageResponse } from "next/og";

export const alt = "Pitchside: hockey and recovery tracker";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#1B3FAE", color: "#fff", padding: 80, position: "relative" }}>
        {/* pitch markings */}
        <div style={{ position: "absolute", left: 40, top: 40, right: 40, bottom: 40, border: "4px solid rgba(255,255,255,.14)", display: "flex" }} />
        <div style={{ position: "absolute", left: 600, top: 40, bottom: 40, width: 4, background: "rgba(255,255,255,.14)", display: "flex" }} />
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", flex: 1 }}>
          <div style={{ fontSize: 112, fontWeight: 800, letterSpacing: -3 }}>Pitchside</div>
          <div style={{ fontSize: 40, opacity: 0.9, marginTop: 12, maxWidth: 640 }}>Hockey and recovery tracker</div>
          <div style={{ fontSize: 28, opacity: 0.75, marginTop: 28, maxWidth: 620 }}>Log matches, training and physio. Follow your rehab. Know when to rest.</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 360, position: "relative" }}>
          <div style={{ position: "absolute", width: 340, height: 340, borderRadius: "50%", background: "#F29F33", opacity: 0.28, display: "flex" }} />
          <div style={{ position: "absolute", width: 250, height: 250, borderRadius: "50%", background: "#F29F33", opacity: 0.55, display: "flex" }} />
          <div style={{ position: "absolute", width: 160, height: 160, borderRadius: "50%", background: "#F29F33", display: "flex" }} />
          <div style={{ position: "absolute", width: 22, height: 22, borderRadius: "50%", background: "#fff", display: "flex" }} />
        </div>
      </div>
    ),
    size,
  );
}
