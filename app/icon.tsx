import { ImageResponse } from "next/og";

import { buildIconJsx, ICON_MEASUREMENTS } from "@/lib/icon-image";

export const size = {
  width: 192,
  height: 192,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(buildIconJsx(ICON_MEASUREMENTS), size);
}
