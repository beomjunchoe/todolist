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
          background:
            "linear-gradient(180deg, rgb(251, 247, 239) 0%, rgb(241, 234, 216) 100%)",
          color: "#13221d",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          justifyContent: "center",
          width: "100%",
        }}
      >
        <div
          style={{
            alignItems: "center",
            background: "#ec6c2f",
            borderRadius: 32,
            color: "white",
            display: "flex",
            fontSize: 74,
            fontWeight: 700,
            height: 108,
            justifyContent: "center",
            width: 108,
          }}
        >
          3-1
        </div>
      </div>
    ),
    size,
  );
}
