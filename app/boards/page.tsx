import Link from "next/link";

import { SiteNav } from "@/components/site-nav";
import { getCurrentUser, isAdminUser } from "@/lib/auth";
import { SUBJECTS } from "@/lib/subjects";

export default async function BoardsPage() {
  const currentUser = await getCurrentUser();
  const currentUserIsAdmin = isAdminUser(currentUser);

  return (
    <main className="min-h-screen px-3 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1280px] space-y-4 sm:space-y-5">
        <SiteNav
          currentPath="/boards"
          isAdmin={currentUserIsAdmin}
          userName={currentUser?.nickname ?? null}
        />

        <section className="glass-panel rounded-[32px] px-5 py-5 sm:px-6">
          <p className="text-[11px] font-semibold tracking-[0.22em] text-[var(--muted)]">
            학산여중 3-1 전용
          </p>
          <h1 className="display-font mt-2 text-3xl font-bold">
            과목별 게시판
          </h1>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
            각 과목마다 정리한 내용, 시험 대비 팁, 수행평가 자료를 자유롭게
            올리고 댓글로 이어서 정리할 수 있습니다.
          </p>
        </section>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {SUBJECTS.map((subject) => (
            <Link
              key={subject.slug}
              className="glass-panel rounded-[28px] px-4 py-4"
              href={`/boards/${subject.slug}`}
            >
              <div className="text-sm font-semibold">{subject.name}</div>
              <div className="mt-1 text-[12px] leading-6 text-[var(--muted)]">
                {subject.description}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
