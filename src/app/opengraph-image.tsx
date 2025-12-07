import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "FIFA World Cup 2026 Simulator";
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 60,
          background: "linear-gradient(to bottom right, #0f172a, #1e293b)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontFamily: "sans-serif",
          fontWeight: 700,
          textAlign: "center",
          padding: "40px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "20px",
          }}
        >
          {/* Simple Globe Icon SVG Representation */}
          <svg
            width="100"
            height="100"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
        </div>
        <div style={{ fontSize: 80, marginBottom: 20 }}>World Cup 2026</div>
        <div style={{ fontSize: 40, opacity: 0.8 }}>
          Simulator & Fixture Interactivo
        </div>
        <div
          style={{
            marginTop: 40,
            padding: "10px 30px",
            background: "white",
            color: "#0f172a",
            fontSize: 30,
            borderRadius: 50,
          }}
        >
          Haz tus predicciones
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
