import { getCurrentUser, isAdminUser, isKakaoConfigured } from "@/lib/auth";
import { listBoardTodos, listTodosForUser, listUserStarTotals } from "@/lib/db";
import { groupBoardTodos } from "@/lib/todo-helpers";
import { formatWeekRange, getCurrentWeek } from "@/lib/week";
import { AdminBadge } from "@/components/badges";
import { BoardTable } from "@/components/board-table";
import { InstallShortcut } from "@/components/install-shortcut";
import { Scoreboard } from "@/components/scoreboard";
import { Sidebar } from "@/components/sidebar";

type PageProps = {
  searchParams?: Promise<{
    auth?: string | string[];
  }>;
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

export default async function Home({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : undefined;
  const week = getCurrentWeek();
  const weekKeys = week.map((day) => day.dateKey);
  const currentUser = await getCurrentUser();
  const currentUserIsAdmin = isAdminUser(currentUser);
  const boardTodos = listBoardTodos(weekKeys);
  const userStarTotals = listUserStarTotals();
  const groups = groupBoardTodos(boardTodos);
  const myTodos = currentUser ? listTodosForUser(currentUser.id, weekKeys) : [];
  const kakaoConfigured = isKakaoConfigured();
  const authMessage = getAuthMessage(params?.auth, kakaoConfigured);

  return (
    <main className="min-h-screen px-3 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1480px] space-y-4 sm:space-y-5">
        <section className="glass-panel rounded-[28px] px-4 py-3 sm:rounded-[32px] sm:px-6 sm:py-5">
          <div className="flex items-start justify-between gap-4 lg:items-end">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.22em] text-[var(--muted)]">
                학산여중 3-1 전용
              </p>
              <h1 className="display-font mt-1 text-xl font-bold leading-tight sm:mt-2 sm:text-[28px] lg:text-4xl">
                공유형 투두리스트
              </h1>
              <p className="mt-3 hidden max-w-3xl text-[13px] leading-6 text-[var(--muted)] sm:block sm:text-sm sm:leading-7">
                목록은 기본 공개입니다. 각 할 일은 내용 공개 또는 비공개를 고를 수
                있고, 오른쪽 메인 표에서 자신의 행만 직접 체크할 수 있습니다.
              </p>
              <p className="mt-3 hidden max-w-3xl text-[12px] leading-6 text-[var(--muted)] sm:block sm:text-sm">
                어떤 사소한 목표든, 꾸준히 하는 게 중요합니다. 어제보다 한 걸음 더
                나아간 여러분이 되길 바랍니다 - 범준T
              </p>
            </div>

            <div className="flex shrink-0 flex-col items-end gap-2 lg:items-start lg:rounded-[24px] lg:border lg:border-[var(--line)] lg:bg-white/70 lg:px-4 lg:py-3">
              <div className="text-right lg:text-left">
                <div className="text-[10px] font-semibold tracking-[0.18em] text-[var(--muted)] lg:text-[11px]">
                  이번 주
                </div>
                <div className="mt-0.5 text-xs font-semibold lg:mt-1 lg:text-sm">
                  {formatWeekRange(week)}
                </div>
              </div>

              {currentUser ? (
                <div className="flex items-center gap-1.5 text-[11px] text-[var(--muted)]">
                  <span>{currentUser.nickname} 님</span>
                  {currentUserIsAdmin ? <AdminBadge /> : null}
                </div>
              ) : (
                <a
                  className="rounded-full bg-[#FEE500] px-3 py-1.5 text-[11px] font-semibold text-[#191600] lg:px-4 lg:py-2 lg:text-xs"
                  href="/api/auth/kakao/start"
                >
                  카카오로 로그인
                </a>
              )}

              <div className="hidden sm:block">
                <InstallShortcut />
              </div>

              {currentUserIsAdmin ? (
                <p className="hidden text-[11px] leading-5 text-[var(--muted)] lg:block">
                  관리자 모드: 다른 사람 할 일을 메인 보드에서 삭제할 수 있습니다.
                </p>
              ) : null}
            </div>
          </div>

          {authMessage ? (
            <div className="mt-3 rounded-2xl border border-[rgba(236,108,47,0.24)] bg-[rgba(236,108,47,0.09)] px-4 py-3 text-sm text-[var(--foreground)]">
              {authMessage}
            </div>
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
              <aside className="glass-panel rounded-[28px] p-5 lg:sticky lg:top-6 lg:self-start">
                <p className="text-[11px] font-semibold tracking-[0.18em] text-[var(--muted)]">
                  시작하기
                </p>
                <h2 className="display-font mt-2 text-xl font-bold">로그인 후 내 할 일 추가</h2>
                <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                  카카오 로그인 후 왼쪽 관리 바에서 할 일을 만들 수 있습니다. 체크는
                  오른쪽 메인 표에서 자기 행만 가능합니다.
                </p>
                <a
                  className="mt-4 inline-flex rounded-full bg-[#FEE500] px-4 py-3 text-xs font-semibold text-[#191600]"
                  href="/api/auth/kakao/start"
                >
                  카카오로 로그인
                </a>
              </aside>
            )}
          </div>

          <div className="order-1 space-y-4 min-w-0 lg:order-2 lg:space-y-5">
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
    </main>
  );
}
