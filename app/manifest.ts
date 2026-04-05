import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "학산여중 3-1 전용 공유형 투두리스트",
    short_name: "학산여중 3-1",
    description: "휴대폰 홈 화면에 추가해서 바로 열 수 있는 공유형 투두리스트",
    start_url: "/",
    display: "standalone",
    background_color: "#f4efe4",
    theme_color: "#ec6c2f",
    lang: "ko",
    orientation: "portrait",
    icons: [
      {
        src: "/app-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        src: "/app-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
