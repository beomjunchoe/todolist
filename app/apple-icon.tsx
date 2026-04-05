import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "#f4efe4",
          display: "flex",
          height: "100%",
          justifyContent: "center",
          width: "100%",
        }}
      >
        <div
          style={{
            alignItems: "center",
            background: "#13221d",
            borderRadius: 42,
            display: "flex",
            height: 146,
            justifyContent: "center",
            width: 146,
          }}
        >
          <div
            style={{
              alignItems: "center",
              background: "#fff9f0",
              borderRadius: 34,
              display: "flex",
              height: 118,
              justifyContent: "center",
              position: "relative",
              width: 118,
            }}
          >
            <div
              style={{
                background: "#ec6c2f",
                borderRadius: 26,
                display: "flex",
                height: 94,
                position: "relative",
                width: 94,
              }}
            >
              <div
                style={{
                  alignItems: "center",
                  background: "#fff7ee",
                  borderRadius: 16,
                  display: "flex",
                  height: 42,
                  justifyContent: "center",
                  left: 10,
                  position: "absolute",
                  top: 14,
                  width: 42,
                }}
              >
                <div
                  style={{
                    borderBottom: "6px solid #ec6c2f",
                    borderLeft: "6px solid #ec6c2f",
                    height: 14,
                    transform: "rotate(-45deg)",
                    width: 22,
                  }}
                />
              </div>
              <div
                style={{
                  color: "#fff7ee",
                  fontSize: 24,
                  fontWeight: 700,
                  left: 56,
                  lineHeight: 1,
                  position: "absolute",
                  top: 16,
                }}
              >
                3-1
              </div>
              <div
                style={{
                  background: "#fff7ee",
                  borderRadius: 12,
                  bottom: 12,
                  height: 18,
                  left: 10,
                  position: "absolute",
                  width: 30,
                }}
              />
              <div
                style={{
                  background: "#ffd8c5",
                  borderRadius: 12,
                  bottom: 12,
                  height: 18,
                  left: 44,
                  position: "absolute",
                  width: 36,
                }}
              />
              <div
                style={{
                  background: "#ffd449",
                  borderRadius: 999,
                  height: 16,
                  position: "absolute",
                  right: 9,
                  top: 8,
                  width: 16,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
