import { deleteTodo, updateTodo } from "@/app/actions";
import { type TodoWithChecksRecord } from "@/lib/db";
import { isTodoCompletedForWeek } from "@/lib/todo-helpers";
import { type WeekDay } from "@/lib/week";

import { StarBadge } from "./badges";

export function SidebarTodoItem({
  todo,
  week,
}: {
  todo: TodoWithChecksRecord;
  week: WeekDay[];
}) {
  const completedThisWeek = isTodoCompletedForWeek(todo, week);

  return (
    <article className="rounded-3xl border border-[var(--line)] bg-white/80 p-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-semibold text-[var(--muted)]">내 할 일</span>
          {completedThisWeek ? <StarBadge count={1} /> : null}
        </div>
        <form action={updateTodo} className="space-y-3">
          <input name="todoId" type="hidden" value={todo.id} />
          <input
            className="w-full rounded-2xl border border-[var(--line)] bg-white px-3 py-2 text-sm outline-none"
            defaultValue={todo.title}
            maxLength={80}
            name="title"
            required
            type="text"
          />
          <label className="flex items-center gap-2 text-xs text-[var(--muted)]">
            <input
              className="h-4 w-4 accent-[var(--accent)]"
              defaultChecked={todo.isContentPublic}
              name="isContentPublic"
              type="checkbox"
            />
            내용 공개
          </label>
          <button
            className="rounded-full bg-[var(--foreground)] px-3 py-2 text-xs font-semibold text-white"
            type="submit"
          >
            수정
          </button>
        </form>

        <form action={deleteTodo}>
          <input name="todoId" type="hidden" value={todo.id} />
          <button
            className="rounded-full border border-[var(--line)] bg-white px-3 py-2 text-xs font-semibold"
            type="submit"
          >
            삭제
          </button>
        </form>
      </div>
    </article>
  );
}
