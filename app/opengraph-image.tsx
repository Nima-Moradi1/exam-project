import { ImageResponse } from "next/og";

export const alt = "Azmoon Khaneh assessment platform";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(<div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 76, color: "#21342b", background: "linear-gradient(135deg, #fff7ed, #e8f3ed)" }}><div style={{ display: "flex", color: "#df6b45", fontSize: 30 }}>ONLINE ASSESSMENT PLATFORM</div><div style={{ display: "flex", marginTop: 24, fontSize: 82, fontWeight: 800 }}>Azmoon Khaneh</div><div style={{ display: "flex", marginTop: 26, maxWidth: 950, fontSize: 38, lineHeight: 1.6 }}>Structured paths, secure timing, actionable feedback and measurable progress</div></div>, size);
}
