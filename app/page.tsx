import Link from "next/link";

import { InstallShortcut } from "@/components/install-shortcut";
import { MobileTabBar } from "@/components/mobile-tab-bar";
import { SiteNav } from "@/components/site-nav";
import { getCurrentUser, isAdminUser } from "@/lib/auth";
import { SUBJECTS } from "@/lib/subjects";

export default async function HomePage() {
  const currentUser = await getCurrentUser();
  const currentUserIsAdmin = isAdminUser(currentUser);

  return (
    <main className="min-h-screen px-3 py-4 pb-28 sm:px-6 sm:pb-6 lg:px-8">
      <div className="mx-auto max-w-[1480px] space-y-4 sm:space-y-5">
        <SiteNav
          currentPath="/"
          isAdmin={currentUserIsAdmin}
          userName={currentUser?.nickname ?? null}
        />

        <section className="glass-panel rounded-[28px] px-4 py-5 sm:rounded-[32px] sm:px-6 sm:py-6">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.9fr)] lg:items-end">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.22em] text-[var(--muted)]">
                학산여중 3-1 전용
              </p>
              <h1 className="display-font mt-2 text-2xl font-bold leading-tight sm:text-4xl">
                같이 쓰는 학급 홈페이지
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted)]">
                투두리스트로 매일 체크하고, 일정 캘린더로 시험과 숙제를 보고,
                과목별 게시판에 정리한 내용을 올리는 반 전용 페이지입니다.
              </p>
              <p className="mt-3 max-w-3xl text-[12px] leading-6 text-[var(--muted)] sm:text-sm">
                어떤 사소한 목표든, 꾸준히 하는 게 중요합니다. 어제보다 한 걸음 더
                나아간 여러분이 되길 바랍니다 - 범준T
              </p>

              <div className="mt-5 grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
                <Link
                  className="flex items-center justify-center rounded-full bg-[var(--foreground)] px-4 py-3 text-sm font-semibold text-white"
                  href="/todo"
                >
                  투두리스트 가기
                </Link>
                <Link
                  className="flex items-center justify-center rounded-full border border-[var(--line)] bg-white px-4 py-3 text-sm font-semibold"
                  href="/calendar"
                >
                  일정 캘린더 보기
                </Link>
                <Link
                  className="flex items-center justify-center rounded-full border border-[var(--line)] bg-white px-4 py-3 text-sm font-semibold"
                  href="/boards"
                >
                  과목별 게시판 보기
                </Link>
                {!currentUser ? (
                  <a
                    className="flex items-center justify-center rounded-full bg-[#FEE500] px-4 py-3 text-sm font-semibold text-[#191600]"
                    href="/api/auth/kakao/start?returnTo=/"
                  >
                    카카오로 로그인
                  </a>
                ) : null}
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2 lg:hidden">
                <Link
                  className="rounded-[20px] border border-[var(--line)] bg-white/84 px-3 py-3"
                  href="/todo"
                >
                  <div className="text-sm font-semibold">투두</div>
                  <div className="mt-1 text-[11px] leading-5 text-[var(--muted)]">
                    주간 체크
                  </div>
                </Link>
                <Link
                  className="rounded-[20px] border border-[var(--line)] bg-white/84 px-3 py-3"
                  href="/calendar"
                >
                  <div className="text-sm font-semibold">일정</div>
                  <div className="mt-1 text-[11px] leading-5 text-[var(--muted)]">
                    시험·숙제
                  </div>
                </Link>
                <Link
                  className="rounded-[20px] border border-[var(--line)] bg-white/84 px-3 py-3"
                  href="/boards"
                >
                  <div className="text-sm font-semibold">게시판</div>
                  <div className="mt-1 text-[11px] leading-5 text-[var(--muted)]">
                    자료 공유
                  </div>
                </Link>
              </div>
            </div>

            <div className="hidden space-y-3 lg:block">
              <div className="grid gap-3">
                <Link
                  className="rounded-[24px] border border-[var(--line)] bg-white/80 px-4 py-4"
                  href="/todo"
                >
                  <div className="text-sm font-semibold">공유형 투두리스트</div>
                  <div className="mt-1 text-[12px] leading-6 text-[var(--muted)]">
                    주간 체크와 누적 별을 한 화면에서 보기
                  </div>
                </Link>
                <Link
                  className="rounded-[24px] border border-[var(--line)] bg-white/80 px-4 py-4"
                  href="/calendar"
                >
                  <div className="text-sm font-semibold">학급 일정 캘린더</div>
                  <div className="mt-1 text-[12px] leading-6 text-[var(--muted)]">
                    수행평가, 준비물, 시험 일정을 날짜별로 한눈에 보기
                  </div>
                </Link>
                <Link
                  className="rounded-[24px] border border-[var(--line)] bg-white/80 px-4 py-4"
                  href="/boards"
                >
                  <div className="text-sm font-semibold">과목별 게시판</div>
                  <div className="mt-1 text-[12px] leading-6 text-[var(--muted)]">
                    정리 자료, 댓글, 첨부 파일까지 같이 공유하기
                  </div>
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-4 sm:hidden">
            <InstallShortcut />
          </div>
        </section>

        <section className="glass-panel rounded-[28px] px-4 py-5 sm:rounded-[32px] sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.18em] text-[var(--muted)]">
                과목 바로가기
              </p>
              <h2 className="display-font mt-1 text-xl font-bold sm:text-2xl">
                필요한 메뉴로 바로 이동
              </h2>
            </div>
            <Link
              className="rounded-full border border-[var(--line)] bg-white px-4 py-2 text-xs font-semibold"
              href="/boards"
            >
              전체 보기
            </Link>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Link
              className="rounded-[24px] border border-[var(--line)] bg-white/82 px-4 py-4"
              href="/calendar"
            >
              <div className="text-sm font-semibold">학급 일정</div>
              <div className="mt-1 text-[12px] leading-6 text-[var(--muted)]">
                시험, 숙제, 행사 일정 모아보기
              </div>
            </Link>
            {SUBJECTS.map((subject) => (
              <Link
                key={subject.slug}
                className="rounded-[24px] border border-[var(--line)] bg-white/82 px-4 py-4"
                href={`/boards/${subject.slug}`}
              >
                <div className="text-sm font-semibold">{subject.name}</div>
                <div className="mt-1 text-[12px] leading-6 text-[var(--muted)]">
                  {subject.description}
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>

      <MobileTabBar currentPath="/" />
    </main>
  );
}
