import Link from "next/link";

import { MobileTabBar } from "@/components/mobile-tab-bar";
import { SiteNav } from "@/components/site-nav";
import { getCurrentUser, isAdminUser } from "@/lib/auth";
import { SUBJECTS } from "@/lib/subjects";

export default async function BoardsPage() {
  const currentUser = await getCurrentUser();
  const currentUserIsAdmin = isAdminUser(currentUser);

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
            학산여중 3-1 전용
          </p>
          <h1 className="display-font mt-2 text-2xl font-bold sm:text-3xl">
            과목별 게시판
          </h1>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
            정리 자료, 질문, 수행평가 준비 내용을 과목별로 나눠서 올리는 공간입니다.
            모바일에서는 한 줄 카드로 크게 보여서 바로 들어가기 쉽게 정리했습니다.
          </p>
        </section>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {SUBJECTS.map((subject) => (
            <Link
              key={subject.slug}
              className="glass-panel rounded-[24px] px-4 py-4"
              href={`/boards/${subject.slug}`}
            >
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
            </Link>
          ))}
        </div>
      </div>

      <MobileTabBar currentPath="/boards" />
    </main>
  );
}
