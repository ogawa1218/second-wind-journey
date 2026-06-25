import { ImageResponse } from "next/og";
import {
  START_WEIGHT,
  CURRENT_WEIGHT,
  TARGET_WEIGHT,
} from "@/lib/blog/run-data";

export const alt =
  "MASH サブエガ164日チャレンジ — つくばマラソン2026で2時間50分切りを目指す";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#0a0a0a",
          padding: "72px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "84px",
              height: "84px",
              borderRadius: "9999px",
              backgroundColor: "#f97316",
              color: "#000000",
              fontSize: "48px",
              fontWeight: 900,
            }}
          >
            M
          </div>
          <div style={{ display: "flex", color: "#a3a3a3", fontSize: "30px" }}>
            MASH ・ 小川雅史
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div
            style={{
              display: "flex",
              color: "#f97316",
              fontSize: "34px",
              fontWeight: 700,
            }}
          >
            つくばマラソン2026
          </div>
          <div
            style={{
              display: "flex",
              color: "#ffffff",
              fontSize: "84px",
              fontWeight: 900,
              letterSpacing: "-2px",
            }}
          >
            サブエガ164日チャレンジ
          </div>
          <div style={{ display: "flex", color: "#d4d4d4", fontSize: "36px" }}>
            2時間50分切りへ。睡眠→食事→運動の行動序列ドミノ。
          </div>
        </div>

        <div style={{ display: "flex", gap: "16px" }}>
          {[
            `元${START_WEIGHT}kg → 現在${CURRENT_WEIGHT}kg`,
            `レース目標 ${TARGET_WEIGHT}kg`,
            "VO2max 59 → 65",
          ].map((label) => (
            <div
              key={label}
              style={{
                display: "flex",
                backgroundColor: "#16a34a1a",
                border: "2px solid #22c55e",
                color: "#22c55e",
                borderRadius: "9999px",
                padding: "12px 28px",
                fontSize: "28px",
                fontWeight: 600,
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
