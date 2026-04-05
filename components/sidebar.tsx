import { createTodo, signOut } from "@/app/actions";
import { type TodoWithChecksRecord } from "@/lib/db";
import { InstallShortcut } from "./install-shortcut";

import { AdminBadge, StarBadge } from "./badges";
import { SidebarTodoItem } from "./sidebar-todo-item";

export function Sidebar({
  currentUserName,
  isAdmin,
  totalStars,
  myTodos,
}: {
  currentUserName: string;
  isAdmin: boolean;
  totalStars: number;
  myTodos: TodoWithChecksRecord[];
}) {
  const completedCount = totalStars;

  return (
    <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
      <section className="glass-panel rounded-[28px] p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.18em] text-[var(--muted)]">
              내 투두 관리
            </p>
            <div className="mt-2 flex items-center gap-2">
              <h2 className="display-font text-xl font-bold">{currentUserName}</h2>
              {completedCount > 0 ? <StarBadge count={completedCount} /> : null}
              {isAdmin ? <AdminBadge /> : null}
            </div>
          </div>
          <form action={signOut}>
            <button
              className="rounded-full border border-[var(--line)] bg-white px-3 py-2 text-xs font-semibold"
              type="submit"
            >
              로그아웃
            </button>
          </form>
        </div>

        <p className="mt-3 text-xs leading-6 text-[var(--muted)]">
          왼쪽에서는 할 일을 만들고 수정합니다. 주간 체크는 오른쪽 표에서 내 행만 직접
          누를 수 있습니다.
        </p>
      </section>

      <section className="glass-panel rounded-[28px] p-5">
        <h3 className="text-sm font-semibold">할 일 추가</h3>
        <form action={createTodo} className="mt-3 space-y-3">
          <input
            className="w-full rounded-2xl border border-[var(--line)] bg-white px-3 py-3 text-sm outline-none placeholder:text-[var(--muted)]"
            maxLength={80}
            name="title"
            placeholder="예: 영어 단어 30개"
            required
            type="text"
          />
          <label className="flex items-center gap-2 text-xs text-[var(--muted)]">
            <input
              className="h-4 w-4 accent-[var(--accent)]"
              defaultChecked
              name="isContentPublic"
              type="checkbox"
            />
            내용 공개
          </label>
          <button
            className="w-full rounded-full bg-[var(--accent)] px-4 py-3 text-xs font-semibold text-white"
            type="submit"
          >
            추가
          </button>
        </form>
      </section>

      <section className="glass-panel rounded-[28px] p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">내 목록</h3>
          <span className="text-xs text-[var(--muted)]">{myTodos.length}개</span>
        </div>
        <div className="mt-3 space-y-3">
          {myTodos.length > 0 ? (
            myTodos.map((todo) => <SidebarTodoItem key={todo.id} todo={todo} />)
          ) : (
            <p className="text-xs leading-6 text-[var(--muted)]">
              아직 등록된 할 일이 없습니다. 위에서 하나 추가해 보세요.
            </p>
          )}
        </div>
      </section>

      <div className="sm:hidden">
        <InstallShortcut />
      </div>
    </aside>
  );
}
