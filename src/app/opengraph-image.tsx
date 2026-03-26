import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "GASPE — Groupement des Armateurs de Services Publics Maritimes";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #0a1520 0%, #1B7E8A 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Logo placeholder */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "40px",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #42B3D5, #6DAAAC, #5AA89A)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "28px",
              fontWeight: 700,
              color: "white",
            }}
          >
            A
          </div>
          <span style={{ fontSize: "32px", fontWeight: 700, color: "white" }}>
            GASPE
          </span>
        </div>

        <div
          style={{
            fontSize: "48px",
            fontWeight: 700,
            color: "white",
            lineHeight: 1.2,
            marginBottom: "24px",
          }}
        >
          F\u00e9d\u00e9rer et repr\u00e9senter les compagnies maritimes de proximit\u00e9
        </div>

        <div
          style={{
            fontSize: "22px",
            color: "rgba(255,255,255,0.7)",
            lineHeight: 1.5,
          }}
        >
          Localement ancr\u00e9s. Socialement engag\u00e9s.
        </div>

        {/* Stats bar */}
        <div
          style={{
            display: "flex",
            gap: "48px",
            marginTop: "48px",
          }}
        >
          {[
            { value: "1951", label: "Cr\u00e9ation" },
            { value: "28", label: "Compagnies" },
            { value: "111", label: "Navires" },
            { value: "20M+", label: "Passagers" },
          ].map((stat) => (
            <div key={stat.label} style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "36px", fontWeight: 700, color: "#6DAAAC" }}>
                {stat.value}
              </span>
              <span style={{ fontSize: "14px", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}
