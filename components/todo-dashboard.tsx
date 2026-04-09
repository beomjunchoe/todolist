import { getCurrentUser, isAdminUser, isKakaoConfigured } from "@/lib/auth";
import { listBoardTodos, listTodosForUser, listUserStarTotals } from "@/lib/db";
import { groupBoardTodos } from "@/lib/todo-helpers";
import { formatWeekRange, getCurrentWeek } from "@/lib/week";

import { AdminBadge } from "./badges";
import { BoardTable } from "./board-table";
import { InstallShortcut } from "./install-shortcut";
import { MobileTabBar } from "./mobile-tab-bar";
import { Scoreboard } from "./scoreboard";
import { Sidebar } from "./sidebar";
import { SiteNav } from "./site-nav";

type TodoDashboardProps = {
  searchParams?: {
    auth?: string | string[];
  };
};

function getAuthMessage(
  value: string | string[] | undefined,
  kakaoConfigured: boolean,
) {
  const authCode = Array.isArray(value) ? value[0] : value;

  if (!kakaoConfigured) {
    return "카카오 설정값이 아직 없습니다. Render 환경변수의 KAKAO_* 값을 확인해 주세요.";
  }

  switch (authCode) {
    case "missing-kakao-config":
      return "카카오 로그인이 아직 설정되지 않았습니다.";
    case "invalid-state":
      return "로그인 검증에 실패했습니다. 다시 시도해 주세요.";
    case "token-exchange-failed":
      return "카카오 인증 코드를 토큰으로 바꾸지 못했습니다.";
    case "profile-fetch-failed":
      return "카카오 프로필 정보를 불러오지 못했습니다.";
    case "kakao-denied":
      return "카카오 로그인 동의가 취소되었습니다.";
    default:
      return null;
  }
}

export async function TodoDashboard({ searchParams }: TodoDashboardProps) {
  const week = getCurrentWeek();
  const weekKeys = week.map((day) => day.dateKey);
  const currentUser = await getCurrentUser();
  const currentUserIsAdmin = isAdminUser(currentUser);
  const boardTodos = listBoardTodos(weekKeys);
  const userStarTotals = listUserStarTotals();
  const groups = groupBoardTodos(boardTodos);
  const myTodos = currentUser ? listTodosForUser(currentUser.id, weekKeys) : [];
  const kakaoConfigured = isKakaoConfigured();
  const authMessage = getAuthMessage(searchParams?.auth, kakaoConfigured);

  return (
    <main className="min-h-screen px-3 py-4 pb-28 sm:px-6 sm:pb-6 lg:px-8">
      <div className="mx-auto max-w-[1480px] space-y-4 sm:space-y-5">
        <SiteNav
          currentPath="/todo"
          isAdmin={currentUserIsAdmin}
          userName={currentUser?.nickname ?? null}
        />

        <section className="glass-panel rounded-[26px] px-4 py-4 sm:rounded-[32px] sm:px-6 sm:py-5">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.22em] text-[var(--muted)]">
                학산여중 3-1 전용
              </p>
              <h1 className="display-font mt-1 text-xl font-bold leading-tight sm:mt-2 sm:text-[28px] lg:text-4xl">
                공유형 투두리스트
              </h1>
              <p className="mt-2 text-[12px] leading-6 text-[var(--muted)] sm:text-sm sm:leading-7">
                목록은 기본 공개입니다. 오른쪽 메인 표에서 자기 행만 직접
                체크할 수 있습니다.
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-[auto_auto] lg:flex lg:flex-col lg:items-start">
              <div className="rounded-2xl border border-[var(--line)] bg-white/80 px-4 py-3 text-center lg:text-left">
                <div className="text-[10px] font-semibold tracking-[0.18em] text-[var(--muted)]">
                  이번 주
                </div>
                <div className="mt-1 text-sm font-semibold">
                  {formatWeekRange(week)}
                </div>
              </div>

              {currentUser ? (
                <div className="flex items-center justify-center gap-1.5 rounded-2xl border border-[var(--line)] bg-white/80 px-4 py-3 text-[11px] text-[var(--muted)] lg:justify-start">
                  <span>{currentUser.nickname} 님</span>
                  {currentUserIsAdmin ? <AdminBadge /> : null}
                </div>
              ) : (
                <a
                  className="flex items-center justify-center rounded-2xl bg-[#FEE500] px-4 py-3 text-sm font-semibold text-[#191600]"
                  href="/api/auth/kakao/start?returnTo=/todo"
                >
                  카카오로 로그인
                </a>
              )}
            </div>
          </div>

          {authMessage ? (
            <div className="mt-3 rounded-2xl border border-[rgba(236,108,47,0.24)] bg-[rgba(236,108,47,0.09)] px-4 py-3 text-sm text-[var(--foreground)]">
              {authMessage}
            </div>
          ) : null}

          <div className="mt-3">
            <InstallShortcut />
          </div>

          {currentUserIsAdmin ? (
            <p className="mt-3 text-[11px] leading-5 text-[var(--muted)]">
              관리자 모드에서는 다른 사람 할 일도 메인 보드에서 삭제할 수
              있습니다.
            </p>
          ) : null}
        </section>

        <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
          <div className="order-2 lg:order-1">
            {currentUser ? (
              <Sidebar
                currentUserName={currentUser.nickname}
                isAdmin={currentUserIsAdmin}
                totalStars={userStarTotals.get(currentUser.id) ?? 0}
                myTodos={myTodos}
              />
            ) : (
              <aside className="glass-panel rounded-[24px] p-4 sm:rounded-[28px] sm:p-5 lg:sticky lg:top-6 lg:self-start">
                <p className="text-[11px] font-semibold tracking-[0.18em] text-[var(--muted)]">
                  시작하기
                </p>
                <h2 className="display-font mt-2 text-lg font-bold sm:text-xl">
                  로그인하면 바로 추가
                </h2>
                <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                  카카오 로그인 후 왼쪽 관리 바에서 할 일을 만들 수 있습니다.
                  체크는 오른쪽 메인 표에서 자기 행만 가능합니다.
                </p>
                <a
                  className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-[#FEE500] px-4 py-3 text-sm font-semibold text-[#191600]"
                  href="/api/auth/kakao/start?returnTo=/todo"
                >
                  카카오로 로그인
                </a>
              </aside>
            )}
          </div>

          <div className="order-1 min-w-0 space-y-4 lg:order-2 lg:space-y-5">
            <Scoreboard
              currentUserId={currentUser?.id ?? null}
              groups={groups}
              userStarTotals={userStarTotals}
            />
            <BoardTable
              currentUserId={currentUser?.id ?? null}
              currentUserIsAdmin={currentUserIsAdmin}
              groups={groups}
              userStarTotals={userStarTotals}
              week={week}
            />
          </div>
        </div>
      </div>
      <MobileTabBar currentPath="/todo" />
    </main>
  );
}
