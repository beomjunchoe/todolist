import { ImageResponse } from "next/og";

export const size = {
  width: 192,
  height: 192,
};

export const contentType = "image/png";

export default function Icon() {
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
            borderRadius: 44,
            display: "flex",
            height: 152,
            justifyContent: "center",
            width: 152,
          }}
        >
          <div
            style={{
              alignItems: "center",
              background: "#fff9f0",
              borderRadius: 36,
              display: "flex",
              height: 124,
              justifyContent: "center",
              position: "relative",
              width: 124,
            }}
          >
            <div
              style={{
                background: "#ec6c2f",
                borderRadius: 28,
                display: "flex",
                height: 98,
                position: "relative",
                width: 98,
              }}
            >
              <div
                style={{
                  alignItems: "center",
                  background: "#fff7ee",
                  borderRadius: 16,
                  display: "flex",
                  height: 44,
                  justifyContent: "center",
                  left: 12,
                  position: "absolute",
                  top: 14,
                  width: 44,
                }}
              >
                <div
                  style={{
                    borderBottom: "6px solid #ec6c2f",
                    borderLeft: "6px solid #ec6c2f",
                    height: 14,
                    transform: "rotate(-45deg)",
                    width: 24,
                  }}
                />
              </div>
              <div
                style={{
                  color: "#fff7ee",
                  fontSize: 28,
                  fontWeight: 700,
                  left: 60,
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
                  height: 20,
                  left: 12,
                  position: "absolute",
                  width: 32,
                }}
              />
              <div
                style={{
                  background: "#ffd8c5",
                  borderRadius: 12,
                  bottom: 12,
                  height: 20,
                  left: 48,
                  position: "absolute",
                  width: 38,
                }}
              />
              <div
                style={{
                  background: "#ffd449",
                  borderRadius: 999,
                  height: 18,
                  position: "absolute",
                  right: 10,
                  top: 8,
                  width: 18,
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
