import { randomBytes, createHash } from "crypto";

import { cookies } from "next/headers";

import {
  deleteSessionByTokenHash,
  findUserBySessionTokenHash,
  insertSession,
} from "@/lib/db";

export const SESSION_COOKIE_NAME = "shared_todo_session";
export const KAKAO_STATE_COOKIE_NAME = "shared_todo_kakao_state";
export const KAKAO_RETURN_TO_COOKIE_NAME = "shared_todo_kakao_return_to";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 14;

export function buildCookieOptions(expires: Date) {
  return {
    expires,
    httpOnly: true,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function isKakaoConfigured() {
  return Boolean(
    process.env.KAKAO_REST_API_KEY && process.env.KAKAO_REDIRECT_URI,
  );
}

export function getAdminKakaoIds() {
  return (process.env.ADMIN_KAKAO_IDS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

export function getAdminUserIds() {
  return (process.env.ADMIN_USER_IDS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

export function isAdminUser(
  user: { kakaoId: string; id: string } | null | undefined,
) {
  if (!user) {
    return false;
  }

  return (
    getAdminKakaoIds().includes(user.kakaoId) ||
    getAdminUserIds().includes(user.id)
  );
}

export async function createSessionRecord(userId: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  insertSession({
    expiresAt: expiresAt.toISOString(),
    tokenHash: hashToken(token),
    userId,
  });

  return { token, expiresAt };
}

export async function setSessionCookie(token: string, expiresAt: Date) {
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, token, buildCookieOptions(expiresAt));
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  return findUserBySessionTokenHash(hashToken(token));
}

export async function getCurrentSessionToken() {
  return (await cookies()).get(SESSION_COOKIE_NAME)?.value ?? null;
}

export async function deleteSessionByToken(token: string) {
  deleteSessionByTokenHash(hashToken(token));
}

export async function signOutCurrentSession() {
  const token = await getCurrentSessionToken();

  if (token) {
    await deleteSessionByToken(token);
  }

  await clearSessionCookie();
}

export function buildKakaoAuthorizeUrl(state: string) {
  const url = new URL("https://kauth.kakao.com/oauth/authorize");

  url.searchParams.set("client_id", process.env.KAKAO_REST_API_KEY ?? "");
  url.searchParams.set("redirect_uri", process.env.KAKAO_REDIRECT_URI ?? "");
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "profile_nickname,profile_image");
  url.searchParams.set("state", state);

  return url;
}

export function buildStateCookieOptions() {
  return buildCookieOptions(new Date(Date.now() + 1000 * 60 * 10));
}

export function normalizeReturnToPath(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }

  return value;
}
