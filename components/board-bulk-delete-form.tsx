"use client";

import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";

import { deleteBoardPostsAction } from "@/app/actions";

type BoardBulkDeleteFormProps = {
  formId: string;
  subjectSlug: string;
};

function getPostCheckboxes(formId: string) {
  return Array.from(
    document.querySelectorAll<HTMLInputElement>(
      `input[type="checkbox"][form="${formId}"][name="postIds"]`,
    ),
  );
}

function DeleteButton({ selectedCount }: { selectedCount: number }) {
  const { pending } = useFormStatus();

  return (
    <button
      className="rounded-full border border-[rgba(179,51,51,0.2)] bg-[rgba(179,51,51,0.08)] px-4 py-3 text-sm font-semibold text-[#8e2525] disabled:cursor-not-allowed disabled:opacity-60"
      disabled={pending || selectedCount === 0}
      type="submit"
    >
      {pending ? "삭제 중..." : `선택한 글 삭제 (${selectedCount})`}
    </button>
  );
}

export function BoardBulkDeleteForm({
  formId,
  subjectSlug,
}: BoardBulkDeleteFormProps) {
  const [selectedCount, setSelectedCount] = useState(0);
  const [hasPosts, setHasPosts] = useState(false);
  const [isAllChecked, setIsAllChecked] = useState(false);

  useEffect(() => {
    const syncSelectionState = () => {
      const checkboxes = getPostCheckboxes(formId);
      const checkedCount = checkboxes.filter((checkbox) => checkbox.checked).length;

      setHasPosts(checkboxes.length > 0);
      setSelectedCount(checkedCount);
      setIsAllChecked(checkboxes.length > 0 && checkedCount === checkboxes.length);
    };

    const handleChange = (event: Event) => {
      const target = event.target;

      if (
        target instanceof HTMLInputElement &&
        target.name === "postIds" &&
        target.getAttribute("form") === formId
      ) {
        syncSelectionState();
      }
    };

    syncSelectionState();
    document.addEventListener("change", handleChange);

    return () => {
      document.removeEventListener("change", handleChange);
    };
  }, [formId]);

  return (
    <form
      action={deleteBoardPostsAction}
      className="glass-panel flex flex-col gap-3 rounded-[24px] p-4 sm:flex-row sm:items-center sm:justify-between"
      id={formId}
      onSubmit={(event) => {
        if (selectedCount === 0) {
          event.preventDefault();
          return;
        }

        if (!window.confirm(`선택한 글 ${selectedCount}개를 삭제할까요?`)) {
          event.preventDefault();
        }
      }}
    >
      <input name="subjectSlug" type="hidden" value={subjectSlug} />

      <div className="space-y-2">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.18em] text-[var(--muted)]">
            게시글 관리
          </p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            체크한 글을 한 번에 삭제합니다.
          </p>
        </div>

        <label className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
          <input
            checked={isAllChecked}
            className="h-4 w-4 accent-[var(--accent)]"
            disabled={!hasPosts}
            onChange={(event) => {
              const checked = event.currentTarget.checked;

              for (const checkbox of getPostCheckboxes(formId)) {
                checkbox.checked = checked;
              }

              setSelectedCount(checked ? getPostCheckboxes(formId).length : 0);
              setIsAllChecked(checked && getPostCheckboxes(formId).length > 0);
            }}
            type="checkbox"
          />
          전체 선택
        </label>
      </div>

      <DeleteButton selectedCount={selectedCount} />
    </form>
  );
}
