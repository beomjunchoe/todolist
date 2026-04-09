import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  buildCookieOptions,
  createSessionRecord,
  isKakaoConfigured,
  KAKAO_RETURN_TO_COOKIE_NAME,
  KAKAO_STATE_COOKIE_NAME,
  normalizeReturnToPath,
  SESSION_COOKIE_NAME,
} from "@/lib/auth";
import { upsertUserByKakao } from "@/lib/db";

type KakaoTokenResponse = {
  access_token: string;
};

type KakaoUserResponse = {
  id: number;
  kakao_account?: {
    profile?: {
      nickname?: string;
      profile_image_url?: string;
    };
  };
};

function redirectWithAuthError(request: Request, code: string) {
  const url = new URL("/", request.url);
  url.searchParams.set("auth", code);

  const response = NextResponse.redirect(url);
  response.cookies.delete(KAKAO_STATE_COOKIE_NAME);
  response.cookies.delete(KAKAO_RETURN_TO_COOKIE_NAME);

  return response;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cookieStore = await cookies();
  const state = searchParams.get("state");
  const savedState = cookieStore.get(KAKAO_STATE_COOKIE_NAME)?.value;
  const returnTo = normalizeReturnToPath(
    cookieStore.get(KAKAO_RETURN_TO_COOKIE_NAME)?.value,
  );
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return redirectWithAuthError(request, "kakao-denied");
  }

  if (!isKakaoConfigured()) {
    return redirectWithAuthError(request, "missing-kakao-config");
  }

  if (!code || !state || !savedState || state !== savedState) {
    return redirectWithAuthError(request, "invalid-state");
  }

  const tokenRequest = new URLSearchParams({
    client_id: process.env.KAKAO_REST_API_KEY ?? "",
    code,
    grant_type: "authorization_code",
    redirect_uri: process.env.KAKAO_REDIRECT_URI ?? "",
  });

  if (process.env.KAKAO_CLIENT_SECRET) {
    tokenRequest.set("client_secret", process.env.KAKAO_CLIENT_SECRET);
  }

  const tokenResponse = await fetch("https://kauth.kakao.com/oauth/token", {
    body: tokenRequest.toString(),
    cache: "no-store",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
    },
    method: "POST",
  });

  if (!tokenResponse.ok) {
    return redirectWithAuthError(request, "token-exchange-failed");
  }

  const tokenPayload = (await tokenResponse.json()) as KakaoTokenResponse;
  const profileResponse = await fetch("https://kapi.kakao.com/v2/user/me", {
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${tokenPayload.access_token}`,
      "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
    },
  });

  if (!profileResponse.ok) {
    return redirectWithAuthError(request, "profile-fetch-failed");
  }

  const profile = (await profileResponse.json()) as KakaoUserResponse;
  const nickname =
    profile.kakao_account?.profile?.nickname?.trim() || "카카오 사용자";
  const profileImage = profile.kakao_account?.profile?.profile_image_url ?? null;

  const user = upsertUserByKakao({
    kakaoId: String(profile.id),
    nickname,
    profileImage,
  });

  const { expiresAt, token } = await createSessionRecord(user.id);
  const response = NextResponse.redirect(new URL(returnTo, request.url));

  response.cookies.set(SESSION_COOKIE_NAME, token, buildCookieOptions(expiresAt));
  response.cookies.delete(KAKAO_STATE_COOKIE_NAME);
  response.cookies.delete(KAKAO_RETURN_TO_COOKIE_NAME);

  return response;
}
