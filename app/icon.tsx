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
            borderRadius: 36,
            color: "white",
            display: "flex",
            fontSize: 88,
            fontWeight: 700,
            height: 116,
            justifyContent: "center",
            width: 116,
          }}
        >
          3-1
        </div>
      </div>
    ),
    size,
  );
}
