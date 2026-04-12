import Link from "next/link";

import { MobileTabBar } from "@/components/mobile-tab-bar";
import { SiteNav } from "@/components/site-nav";
import { getCurrentUser, isAdminUser } from "@/lib/auth";
import { listBoardSubjectSummaries } from "@/lib/db";
import { SUBJECTS } from "@/lib/subjects";

function formatBoardSummaryDate(value: string) {
  return new Date(value).toLocaleDateString("ko-KR", {
    day: "numeric",
    month: "numeric",
  });
}

export default async function BoardsPage() {
  const currentUser = await getCurrentUser();
  const currentUserIsAdmin = isAdminUser(currentUser);
  const summaryMap = new Map(
    listBoardSubjectSummaries().map((summary) => [summary.subjectSlug, summary]),
  );

  return (
    <main className="min-h-screen px-3 py-4 pb-28 sm:px-6 sm:pb-6 lg:px-8">
      <div className="mx-auto max-w-[1280px] space-y-4 sm:space-y-5">
        <SiteNav
          currentPath="/boards"
          isAdmin={currentUserIsAdmin}
          userName={currentUser?.nickname ?? null}
        />

        <section className="glass-panel rounded-[28px] px-4 py-5 sm:rounded-[32px] sm:px-6">
          <p className="text-[11px] font-semibold tracking-[0.22em] text-[var(--muted)]">
            동산중 3-1 전용
          </p>
          <h1 className="display-font mt-2 text-2xl font-bold sm:text-3xl">
            과목별 게시판
          </h1>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
            정리 자료, 질문, 수행평가 준비 내용을 과목별로 나눠서 보는 공간입니다.
            과목 게시판에 들어가기 전에도 최근 글과 전체 글 수를 보고 바로 분위기를
            파악할 수 있게 정리했습니다.
          </p>
        </section>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {SUBJECTS.map((subject) => {
            const summary = summaryMap.get(subject.slug);

            return (
              <Link
                key={subject.slug}
                className="glass-panel rounded-[24px] px-4 py-4"
                href={`/boards/${subject.slug}`}
              >
                <div className="flex h-full flex-col justify-between gap-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-base font-semibold">{subject.name}</div>
                      <div className="mt-1 text-[12px] leading-6 text-[var(--muted)]">
                        {subject.description}
                      </div>
                    </div>
                    <div className="rounded-full border border-[var(--line)] px-3 py-1 text-[11px] font-semibold">
                      들어가기
                    </div>
                  </div>

                  <div className="space-y-2 rounded-[20px] border border-[var(--line)] bg-white/70 px-3 py-3">
                    <div className="flex items-center justify-between gap-3 text-[11px] font-semibold text-[var(--muted)]">
                      <span>전체 글 {summary?.postCount ?? 0}개</span>
                      {summary?.latestPost ? (
                        <span>{formatBoardSummaryDate(summary.latestPost.createdAt)}</span>
                      ) : null}
                    </div>

                    {summary?.latestPost ? (
                      <div className="space-y-1">
                        <div className="line-clamp-1 text-sm font-semibold text-[var(--foreground)]">
                          {summary.latestPost.isNotice ? "[공지] " : ""}
                          {summary.latestPost.title}
                        </div>
                        <div className="text-[12px] text-[var(--muted)]">
                          최근 글 · {summary.latestPost.user.nickname}
                        </div>
                      </div>
                    ) : (
                      <div className="text-[12px] leading-6 text-[var(--muted)]">
                        아직 올라온 글이 없습니다. 첫 자료를 올려 보세요.
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <MobileTabBar currentPath="/boards" />
    </main>
  );
}
