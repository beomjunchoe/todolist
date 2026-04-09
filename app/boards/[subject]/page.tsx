import Link from "next/link";
import { notFound } from "next/navigation";

import {
  createBoardComment,
  createBoardPost,
  deleteBoardPostAction,
  toggleBoardLikeAction,
  updateBoardPostAction,
} from "@/app/actions";
import { AdminBadge } from "@/components/badges";
import { SiteNav } from "@/components/site-nav";
import { getCurrentUser, isAdminUser } from "@/lib/auth";
import { listBoardPostsBySubject } from "@/lib/db";
import { getSubjectBySlug } from "@/lib/subjects";

type PageProps = {
  params: Promise<{
    subject: string;
  }>;
};

function formatFileSize(bytes: number) {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  }

  if (bytes >= 1024) {
    return `${Math.round(bytes / 1024)}KB`;
  }

  return `${bytes}B`;
}

export default async function SubjectBoardPage({ params }: PageProps) {
  const { subject: subjectSlug } = await params;
  const subject = getSubjectBySlug(subjectSlug);

  if (!subject) {
    notFound();
  }

  const currentUser = await getCurrentUser();
  const currentUserIsAdmin = isAdminUser(currentUser);
  const posts = listBoardPostsBySubject(subject.slug, currentUser?.id);

  return (
    <main className="min-h-screen px-3 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1280px] space-y-4 sm:space-y-5">
        <SiteNav
          currentPath="/boards"
          isAdmin={currentUserIsAdmin}
          userName={currentUser?.nickname ?? null}
        />

        <section className="glass-panel rounded-[32px] px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Link
                className="text-[11px] font-semibold tracking-[0.18em] text-[var(--muted)]"
                href="/boards"
              >
                과목별 게시판
              </Link>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <h1 className="display-font text-3xl font-bold">{subject.name}</h1>
                {currentUserIsAdmin ? <AdminBadge /> : null}
              </div>
              <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                {subject.description}
              </p>
            </div>

            {!currentUser ? (
              <a
                className="rounded-full bg-[#FEE500] px-4 py-3 text-sm font-semibold text-[#191600]"
                href={`/api/auth/kakao/start?returnTo=/boards/${subject.slug}`}
              >
                카카오로 로그인
              </a>
            ) : null}
          </div>
        </section>

        {currentUser ? (
          <section className="glass-panel rounded-[28px] p-5">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.18em] text-[var(--muted)]">
                새 글 작성
              </p>
              <h2 className="mt-1 text-lg font-semibold">
                {subject.name} 게시글 올리기
              </h2>
            </div>

            <form
              action={createBoardPost}
              className="mt-4 space-y-3"
              encType="multipart/form-data"
            >
              <input name="subjectSlug" type="hidden" value={subject.slug} />
              <input
                className="w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none"
                maxLength={100}
                name="title"
                placeholder="제목"
                required
                type="text"
              />
              <textarea
                className="min-h-[140px] w-full rounded-3xl border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none"
                maxLength={4000}
                name="content"
                placeholder="정리한 내용이나 공부 팁을 자유롭게 올려 주세요."
                required
              />
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                <label className="rounded-2xl border border-dashed border-[var(--line)] bg-white px-4 py-3 text-sm text-[var(--muted)]">
                  <div className="font-semibold text-[var(--foreground)]">
                    자료 첨부
                  </div>
                  <div className="mt-1 text-xs leading-5">
                    PDF, 이미지, 한글 파일 등 8MB 이하
                  </div>
                  <input
                    className="mt-3 block w-full text-xs"
                    name="attachment"
                    type="file"
                  />
                </label>

                {currentUserIsAdmin ? (
                  <label className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-white px-4 py-3 text-xs font-semibold">
                    <input
                      className="h-4 w-4 accent-[var(--accent)]"
                      name="isNotice"
                      type="checkbox"
                    />
                    공지글로 올리기
                  </label>
                ) : null}
              </div>
              <button
                className="rounded-full bg-[var(--foreground)] px-4 py-3 text-sm font-semibold text-white"
                type="submit"
              >
                게시글 올리기
              </button>
            </form>
          </section>
        ) : null}

        <section className="space-y-4">
          {posts.length > 0 ? (
            posts.map((post) => {
              const canManage =
                Boolean(currentUser) &&
                (currentUserIsAdmin || currentUser?.id === post.user.id);

              return (
                <article key={post.id} className="glass-panel rounded-[28px] p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {post.isNotice ? (
                          <span className="rounded-full bg-[rgba(236,108,47,0.12)] px-2.5 py-1 text-[11px] font-semibold text-[var(--accent)]">
                            공지
                          </span>
                        ) : null}
                        <h2 className="text-lg font-semibold">{post.title}</h2>
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-7">
                        {post.content}
                      </p>

                      {post.attachment ? (
                        <a
                          className="mt-4 inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-white px-4 py-2 text-xs font-semibold"
                          href={`/api/board-files/${post.id}`}
                        >
                          첨부 자료 다운로드
                          <span className="font-normal text-[var(--muted)]">
                            {post.attachment.fileName} ·{" "}
                            {formatFileSize(post.attachment.fileSize)}
                          </span>
                        </a>
                      ) : null}
                    </div>

                    <div className="shrink-0 text-[11px] leading-5 text-[var(--muted)]">
                      <div>{post.user.nickname}</div>
                      <div>{new Date(post.createdAt).toLocaleString("ko-KR")}</div>
                      {post.updatedAt !== post.createdAt ? (
                        <div>수정 {new Date(post.updatedAt).toLocaleString("ko-KR")}</div>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {currentUser ? (
                      <form action={toggleBoardLikeAction}>
                        <input name="postId" type="hidden" value={post.id} />
                        <input
                          name="subjectSlug"
                          type="hidden"
                          value={subject.slug}
                        />
                        <button
                          className={`rounded-full px-4 py-2 text-xs font-semibold ${
                            post.isLikedByCurrentUser
                              ? "bg-[var(--foreground)] text-white"
                              : "border border-[var(--line)] bg-white"
                          }`}
                          type="submit"
                        >
                          {post.isLikedByCurrentUser ? "좋아요 취소" : "좋아요"} ·{" "}
                          {post.likeCount}
                        </button>
                      </form>
                    ) : (
                      <span className="rounded-full border border-[var(--line)] bg-white px-4 py-2 text-xs font-semibold">
                        좋아요 {post.likeCount}
                      </span>
                    )}

                    {canManage ? (
                      <details className="rounded-[20px] border border-[var(--line)] bg-white px-4 py-3 text-sm">
                        <summary className="cursor-pointer list-none font-semibold">
                          게시글 수정
                        </summary>
                        <form
                          action={updateBoardPostAction}
                          className="mt-3 space-y-3"
                          encType="multipart/form-data"
                        >
                          <input name="postId" type="hidden" value={post.id} />
                          <input
                            name="subjectSlug"
                            type="hidden"
                            value={subject.slug}
                          />
                          <input
                            className="w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none"
                            defaultValue={post.title}
                            maxLength={100}
                            name="title"
                            required
                            type="text"
                          />
                          <textarea
                            className="min-h-[140px] w-full rounded-3xl border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none"
                            defaultValue={post.content}
                            maxLength={4000}
                            name="content"
                            required
                          />
                          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                            <label className="rounded-2xl border border-dashed border-[var(--line)] px-4 py-3 text-xs text-[var(--muted)]">
                              새 자료 첨부
                              <input
                                className="mt-2 block w-full"
                                name="attachment"
                                type="file"
                              />
                            </label>
                            <div className="space-y-2">
                              {currentUserIsAdmin ? (
                                <label className="flex items-center gap-2 text-xs">
                                  <input
                                    className="h-4 w-4 accent-[var(--accent)]"
                                    defaultChecked={post.isNotice}
                                    name="isNotice"
                                    type="checkbox"
                                  />
                                  공지글 유지
                                </label>
                              ) : null}
                              {post.attachment ? (
                                <label className="flex items-center gap-2 text-xs">
                                  <input
                                    className="h-4 w-4 accent-[var(--accent)]"
                                    name="removeAttachment"
                                    type="checkbox"
                                  />
                                  기존 첨부 삭제
                                </label>
                              ) : null}
                            </div>
                          </div>
                          <button
                            className="rounded-full bg-[var(--foreground)] px-4 py-2 text-xs font-semibold text-white"
                            type="submit"
                          >
                            수정 저장
                          </button>
                        </form>
                      </details>
                    ) : null}

                    {canManage ? (
                      <form action={deleteBoardPostAction}>
                        <input name="postId" type="hidden" value={post.id} />
                        <input
                          name="subjectSlug"
                          type="hidden"
                          value={subject.slug}
                        />
                        <button
                          className="rounded-full border border-[rgba(179,51,51,0.2)] bg-[rgba(179,51,51,0.08)] px-4 py-2 text-xs font-semibold text-[#8e2525]"
                          type="submit"
                        >
                          게시글 삭제
                        </button>
                      </form>
                    ) : null}
                  </div>

                  <div className="mt-5 rounded-[24px] border border-[var(--line)] bg-white/70 p-4">
                    <div className="text-sm font-semibold">
                      댓글 {post.comments.length}개
                    </div>

                    <div className="mt-3 space-y-3">
                      {post.comments.length > 0 ? (
                        post.comments.map((comment) => (
                          <div
                            key={comment.id}
                            className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="text-[12px] font-semibold">
                                {comment.user.nickname}
                              </div>
                              <div className="text-[11px] text-[var(--muted)]">
                                {new Date(comment.createdAt).toLocaleString("ko-KR")}
                              </div>
                            </div>
                            <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
                              {comment.content}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-[var(--muted)]">
                          아직 댓글이 없습니다.
                        </p>
                      )}
                    </div>

                    {currentUser ? (
                      <form action={createBoardComment} className="mt-4 space-y-3">
                        <input name="postId" type="hidden" value={post.id} />
                        <input
                          name="subjectSlug"
                          type="hidden"
                          value={subject.slug}
                        />
                        <textarea
                          className="min-h-[92px] w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none"
                          maxLength={2000}
                          name="content"
                          placeholder="댓글 남기기"
                          required
                        />
                        <button
                          className="rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold"
                          type="submit"
                        >
                          댓글 등록
                        </button>
                      </form>
                    ) : (
                      <a
                        className="mt-4 inline-flex rounded-full bg-[#FEE500] px-4 py-3 text-sm font-semibold text-[#191600]"
                        href={`/api/auth/kakao/start?returnTo=/boards/${subject.slug}`}
                      >
                        댓글을 쓰려면 로그인
                      </a>
                    )}
                  </div>
                </article>
              );
            })
          ) : (
            <section className="glass-panel rounded-[28px] p-8">
              <p className="text-sm leading-7 text-[var(--muted)]">
                아직 등록된 게시글이 없습니다. 첫 글을 올려서 이 과목 게시판을
                시작해 보세요.
              </p>
            </section>
          )}
        </section>
      </div>
    </main>
  );
}
