"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";

import {
  createBoardPost,
  type CreateBoardPostState,
} from "@/app/actions";

type BoardPostFormProps = {
  isAdmin: boolean;
  subjectSlug: string;
};

const INITIAL_STATE: CreateBoardPostState = {
  message: null,
  status: "idle",
};

function createSubmissionKey() {
  return crypto.randomUUID();
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="w-full rounded-full bg-[var(--foreground)] px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      disabled={pending}
      type="submit"
    >
      {pending ? "업로드 중..." : "게시글 올리기"}
    </button>
  );
}

export function BoardPostForm({
  isAdmin,
  subjectSlug,
}: BoardPostFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const submissionKeyRef = useRef<HTMLInputElement>(null);
  const [state, formAction, pending] = useActionState(
    createBoardPost,
    INITIAL_STATE,
  );

  useEffect(() => {
    if (state.status === "idle") {
      return;
    }

    if (state.status === "success") {
      formRef.current?.reset();
    }

    if (submissionKeyRef.current) {
      submissionKeyRef.current.value = createSubmissionKey();
    }
  }, [state.status]);

  return (
    <form
      ref={formRef}
      action={formAction}
      aria-busy={pending}
      className="space-y-3"
      encType="multipart/form-data"
    >
      <fieldset className="space-y-3" disabled={pending}>
        <input name="subjectSlug" type="hidden" value={subjectSlug} />
        <input
          ref={submissionKeyRef}
          defaultValue={createSubmissionKey()}
          name="submissionKey"
          type="hidden"
        />
        <input
          className="w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none disabled:opacity-60"
          maxLength={100}
          name="title"
          placeholder="제목"
          required
          type="text"
        />
        <textarea
          className="min-h-[140px] w-full rounded-3xl border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none disabled:opacity-60"
          maxLength={4000}
          name="content"
          placeholder="정리한 내용이나 공유할 자료를 자유롭게 올려 주세요."
          required
        />
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
          <label className="rounded-2xl border border-dashed border-[var(--line)] bg-white px-4 py-3 text-sm text-[var(--muted)]">
            <div className="font-semibold text-[var(--foreground)]">
              자료 첨부
            </div>
            <div className="mt-1 text-xs leading-5">
              PDF, 이미지, 문서 파일 등 8MB 이하
            </div>
            <input
              className="mt-3 block w-full text-xs disabled:opacity-60"
              name="attachment"
              type="file"
            />
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
      </fieldset>

      <div className="space-y-2">
        <SubmitButton />
        {state.message ? (
          <p
            className={`text-sm ${
              state.status === "error"
                ? "text-red-600"
                : "text-[var(--muted)]"
            }`}
          >
            {state.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
