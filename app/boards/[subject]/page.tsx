import Link from "next/link";
import { notFound } from "next/navigation";

import {
  createBoardComment,
  deleteBoardCommentAction,
  deleteBoardPostAction,
  toggleBoardLikeAction,
  updateBoardCommentAction,
  updateBoardPostAction,
} from "@/app/actions";
import { AdminBadge } from "@/components/badges";
import { BoardBulkDeleteForm } from "@/components/board-bulk-delete-form";
import { BoardPostForm } from "@/components/board-post-form";
import { FloatingWriteButton } from "@/components/floating-write-button";
import { MobileTabBar } from "@/components/mobile-tab-bar";
import { SiteNav } from "@/components/site-nav";
import { getCurrentUser, isAdminUser } from "@/lib/auth";
import { listBoardPostsBySubject } from "@/lib/db";
import { getSubjectBySlug } from "@/lib/subjects";

type PageProps = {
  params: Promise<{
    subject: string;
  }>;
  searchParams?: Promise<{
    notice?: string | string[];
    q?: string | string[];
  }>;
};

const BULK_DELETE_FORM_ID = "bulk-delete-posts-form";

function formatFileSize(bytes: number) {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  }

  if (bytes >= 1024) {
    return `${Math.round(bytes / 1024)}KB`;
  }

  return `${bytes}B`;
}

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

/*
    <form
      action={createBoardPost}
      className="space-y-3"
      encType="multipart/form-data"
    >
      <input name="subjectSlug" type="hidden" value={subjectSlug} />
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
          <div className="font-semibold text-[var(--foreground)]">자료 첨부</div>
          <div className="mt-1 text-xs leading-5">
            PDF, 이미지, 한글 파일 등 8MB 이하
          </div>
          <input className="mt-3 block w-full text-xs" name="attachment" type="file" />
        </label>

        {isAdmin ? (
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
        className="w-full rounded-full bg-[var(--foreground)] px-4 py-3 text-sm font-semibold text-white sm:w-auto"
        type="submit"
      >
        게시글 올리기
      </button>
    </form>
*/

export default async function SubjectBoardPage({
  params,
  searchParams,
}: PageProps) {
  const { subject: subjectSlug } = await params;
  const query = searchParams ? await searchParams : undefined;
  const subject = getSubjectBySlug(subjectSlug);

  if (!subject) {
    notFound();
  }

  const search = getSingleParam(query?.q)?.trim() ?? "";
  const noticeOnly = getSingleParam(query?.notice) === "1";
  const currentUser = await getCurrentUser();
  const currentUserIsAdmin = isAdminUser(currentUser);
  const posts = listBoardPostsBySubject(subject.slug, currentUser?.id, {
    noticeOnly,
    search,
  });

  return (
    <main className="min-h-screen px-3 py-4 pb-28 sm:px-6 sm:pb-6 lg:px-8">
      <div className="mx-auto max-w-[1280px] space-y-4 sm:space-y-5">
        <SiteNav
          currentPath="/boards"
          isAdmin={currentUserIsAdmin}
          userName={currentUser?.nickname ?? null}
        />

        <section className="glass-panel rounded-[28px] px-4 py-5 sm:rounded-[32px] sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Link
                className="text-[11px] font-semibold tracking-[0.18em] text-[var(--muted)]"
                href="/boards"
              >
                과목별 게시판
              </Link>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <h1 className="display-font text-2xl font-bold sm:text-3xl">
                  {subject.name}
                </h1>
                {currentUserIsAdmin ? <AdminBadge /> : null}
              </div>
              <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                {subject.description}
              </p>
            </div>

            {!currentUser ? (
              <a
                className="flex items-center justify-center rounded-full bg-[#FEE500] px-4 py-3 text-sm font-semibold text-[#191600]"
                href={`/api/auth/kakao/start?returnTo=/boards/${subject.slug}`}
              >
                카카오로 로그인
              </a>
            ) : null}
          </div>
        </section>

        <div className="grid grid-cols-3 gap-2 lg:hidden">
          <a
            className="rounded-full border border-[var(--line)] bg-white px-3 py-2 text-center text-[11px] font-semibold"
            href="#board-search"
          >
            검색
          </a>
          <a
            className="rounded-full border border-[var(--line)] bg-white px-3 py-2 text-center text-[11px] font-semibold"
            href="#write-post"
          >
            글쓰기
          </a>
          <a
            className="rounded-full border border-[var(--line)] bg-white px-3 py-2 text-center text-[11px] font-semibold"
            href="#board-posts"
          >
            글목록
          </a>
        </div>

        <section
          className="glass-panel rounded-[24px] p-4 sm:rounded-[28px] sm:p-5"
          id="board-search"
        >
          <div className="flex flex-col gap-3">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.18em] text-[var(--muted)]">
                게시판 보기
              </p>
              <h2 className="mt-1 text-lg font-semibold">검색과 필터</h2>
            </div>

            <form className="grid gap-3">
              <input
                className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none"
                defaultValue={search}
                name="q"
                placeholder="제목 또는 내용 검색"
                type="search"
              />
              <label className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-white px-4 py-3 text-xs font-semibold">
                <input
                  className="h-4 w-4 accent-[var(--accent)]"
                  defaultChecked={noticeOnly}
                  name="notice"
                  type="checkbox"
                  value="1"
                />
                공지글만 보기
              </label>
              <button
                className="rounded-full bg-[var(--foreground)] px-4 py-3 text-sm font-semibold text-white"
                type="submit"
              >
                적용하기
              </button>
            </form>
          </div>
        </section>

        {currentUser ? (
          <>
            <section
              className="glass-panel rounded-[24px] p-4 lg:hidden"
              id="write-post"
            >
              <div className="mb-4">
                <p className="text-[11px] font-semibold tracking-[0.18em] text-[var(--muted)]">
                  새 글 작성
                </p>
                <h2 className="mt-1 text-lg font-semibold">게시글 쓰기</h2>
              </div>
              <BoardPostForm
                isAdmin={currentUserIsAdmin}
                subjectSlug={subject.slug}
              />
            </section>

            <section className="hidden glass-panel rounded-[28px] p-5 lg:block">
              <div>
                <p className="text-[11px] font-semibold tracking-[0.18em] text-[var(--muted)]">
                  새 글 작성
                </p>
                <h2 className="mt-1 text-lg font-semibold">
                  {subject.name} 게시글 올리기
                </h2>
              </div>
              <div className="mt-4">
                <BoardPostForm
                  isAdmin={currentUserIsAdmin}
                  subjectSlug={subject.slug}
                />
              </div>
            </section>
          </>
        ) : null}

        <section className="space-y-3 sm:space-y-4" id="board-posts">
          {currentUser ? (
            <BoardBulkDeleteForm
              formId={BULK_DELETE_FORM_ID}
              isAdmin={currentUserIsAdmin}
              subjectSlug={subject.slug}
            />
          ) : null}

          {posts.length > 0 ? (
            posts.map((post) => {
              const canManagePost =
                Boolean(currentUser) &&
                (currentUserIsAdmin || currentUser?.id === post.user.id);

              return (
                <article
                  key={post.id}
                  className="glass-panel rounded-[24px] p-4 sm:rounded-[28px] sm:p-5"
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {canManagePost ? (
                        <label className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-white px-3 py-1.5 text-[11px] font-semibold text-[var(--muted)]">
                          <input
                            className="h-4 w-4 accent-[var(--accent)]"
                            form={BULK_DELETE_FORM_ID}
                            name="postIds"
                            type="checkbox"
                            value={post.id}
                          />
                          선택
                        </label>
                      ) : null}
                      {post.isNotice ? (
                        <span className="rounded-full bg-[rgba(236,108,47,0.12)] px-2.5 py-1 text-[11px] font-semibold text-[var(--accent)]">
                          공지
                        </span>
                      ) : null}
                      <h2 className="text-lg font-semibold">{post.title}</h2>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[var(--muted)]">
                      <span>{post.user.nickname}</span>
                      <span>{new Date(post.createdAt).toLocaleString("ko-KR")}</span>
                      {post.updatedAt !== post.createdAt ? (
                        <span>
                          수정 {new Date(post.updatedAt).toLocaleString("ko-KR")}
                        </span>
                      ) : null}
                    </div>

                    <p className="whitespace-pre-wrap text-sm leading-7">
                      {post.content}
                    </p>

                    {post.attachment ? (
                      <a
                        className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-white px-4 py-2 text-xs font-semibold"
                        href={`/api/board-files/${post.id}`}
                      >
                        첨부 자료
                        <span className="font-normal text-[var(--muted)]">
                          {post.attachment.fileName} ·{" "}
                          {formatFileSize(post.attachment.fileSize)}
                        </span>
                      </a>
                    ) : null}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
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

                    {canManagePost ? (
                      <details className="rounded-[18px] border border-[var(--line)] bg-white px-3 py-2 text-xs">
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
                          <label className="block rounded-2xl border border-dashed border-[var(--line)] px-4 py-3 text-xs text-[var(--muted)]">
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
                          <button
                            className="w-full rounded-full bg-[var(--foreground)] px-4 py-2.5 text-xs font-semibold text-white"
                            type="submit"
                          >
                            수정 저장
                          </button>
                        </form>
                        <form action={deleteBoardPostAction} className="mt-3 sm:hidden">
                          <input name="postId" type="hidden" value={post.id} />
                          <input
                            name="subjectSlug"
                            type="hidden"
                            value={subject.slug}
                          />
                          <button
                            className="w-full rounded-full border border-[rgba(179,51,51,0.2)] bg-[rgba(179,51,51,0.08)] px-4 py-2.5 text-xs font-semibold text-[#8e2525]"
                            type="submit"
                          >
                            삭제
                          </button>
                        </form>
                      </details>
                    ) : null}

                    {canManagePost ? (
                      <form action={deleteBoardPostAction} className="hidden sm:block">
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

                  <div className="mt-4 rounded-[22px] border border-[var(--line)] bg-white/72 p-4">
                    <div className="text-sm font-semibold">
                      댓글 {post.comments.length}개
                    </div>

                    <div className="mt-3 space-y-3">
                      {post.comments.length > 0 ? (
                        post.comments.map((comment) => {
                          const canManageComment =
                            Boolean(currentUser) &&
                            (currentUserIsAdmin ||
                              currentUser?.id === comment.user.id);

                          return (
                            <div
                              key={comment.id}
                              className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="text-[12px] font-semibold">
                                  {comment.user.nickname}
                                </div>
                                <div className="text-[11px] text-[var(--muted)]">
                                  {new Date(comment.createdAt).toLocaleString("ko-KR")}
                                  {comment.updatedAt !== comment.createdAt
                                    ? ` · 수정 ${new Date(comment.updatedAt).toLocaleString("ko-KR")}`
                                    : ""}
                                </div>
                              </div>
                              <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
                                {comment.content}
                              </p>

                              {canManageComment ? (
                                <div className="mt-3 flex flex-wrap gap-2">
                                  <details className="rounded-[18px] border border-[var(--line)] bg-[var(--paper)] px-3 py-2 text-xs">
                                    <summary className="cursor-pointer list-none font-semibold">
                                      댓글 수정
                                    </summary>
                                    <form
                                      action={updateBoardCommentAction}
                                      className="mt-3 space-y-3"
                                    >
                                      <input
                                        name="commentId"
                                        type="hidden"
                                        value={comment.id}
                                      />
                                      <input
                                        name="subjectSlug"
                                        type="hidden"
                                        value={subject.slug}
                                      />
                                      <textarea
                                        className="min-h-[92px] w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none"
                                        defaultValue={comment.content}
                                        maxLength={2000}
                                        name="content"
                                        required
                                      />
                                      <button
                                        className="w-full rounded-full bg-[var(--foreground)] px-4 py-2.5 text-xs font-semibold text-white"
                                        type="submit"
                                      >
                                        댓글 수정 저장
                                      </button>
                                    </form>
                                  </details>

                                  <form action={deleteBoardCommentAction}>
                                    <input
                                      name="commentId"
                                      type="hidden"
                                      value={comment.id}
                                    />
                                    <input
                                      name="subjectSlug"
                                      type="hidden"
                                      value={subject.slug}
                                    />
                                    <button
                                      className="rounded-full border border-[rgba(179,51,51,0.2)] bg-[rgba(179,51,51,0.08)] px-3 py-2 text-xs font-semibold text-[#8e2525]"
                                      type="submit"
                                    >
                                      댓글 삭제
                                    </button>
                                  </form>
                                </div>
                              ) : null}
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-sm text-[var(--muted)]">
                          아직 댓글이 없습니다.
                        </p>
                      )}
                    </div>

                    {currentUser ? (
                      <>
                        <details className="mt-4 lg:hidden">
                          <summary className="cursor-pointer list-none rounded-full border border-[var(--line)] bg-white px-4 py-3 text-sm font-semibold">
                            댓글 쓰기
                          </summary>
                          <form action={createBoardComment} className="mt-3 space-y-3">
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
                              className="w-full rounded-full border border-[var(--line)] bg-white px-4 py-3 text-sm font-semibold"
                              type="submit"
                            >
                              댓글 등록
                            </button>
                          </form>
                        </details>

                        <form
                          action={createBoardComment}
                          className="mt-4 hidden space-y-3 lg:block"
                        >
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
                      </>
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
            <section className="glass-panel rounded-[24px] p-6 sm:rounded-[28px] sm:p-8">
              <p className="text-sm leading-7 text-[var(--muted)]">
                조건에 맞는 게시글이 없습니다. 검색어를 바꾸거나 공지글 필터를
                해제해 보세요.
              </p>
            </section>
          )}
        </section>
      </div>
      {currentUser ? <FloatingWriteButton href="#write-post" /> : null}
      <MobileTabBar currentPath="/boards" />
    </main>
  );
}
