import { randomBytes } from "crypto";

import { NextResponse } from "next/server";

import {
  buildKakaoAuthorizeUrl,
  buildStateCookieOptions,
  isKakaoConfigured,
  KAKAO_STATE_COOKIE_NAME,
} from "@/lib/auth";

export async function GET(request: Request) {
  const redirectUrl = new URL("/", request.url);

  if (!isKakaoConfigured()) {
    redirectUrl.searchParams.set("auth", "missing-kakao-config");
    return NextResponse.redirect(redirectUrl);
  }

  const state = randomBytes(16).toString("hex");
  const kakaoAuthorizeUrl = buildKakaoAuthorizeUrl(state);
  const response = NextResponse.redirect(kakaoAuthorizeUrl);

  response.cookies.set(
    KAKAO_STATE_COOKIE_NAME,
    state,
    buildStateCookieOptions(),
  );

  return response;
}
