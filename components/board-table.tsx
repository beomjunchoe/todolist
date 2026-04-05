import { deleteTodoAsAdmin } from "@/app/actions";
import {
  countCompletedTodos,
  groupBoardTodos,
  isTodoCompletedForWeek,
} from "@/lib/todo-helpers";
import { formatWeekColumnLabel, type WeekDay } from "@/lib/week";

import { StarBadge } from "./badges";
import { CheckCell } from "./check-cell";

function AdminDeleteButton({ todoId }: { todoId: string }) {
  return (
    <form action={deleteTodoAsAdmin}>
      <input name="todoId" type="hidden" value={todoId} />
      <button
        className="rounded-full border border-[rgba(180,60,40,0.18)] bg-[rgba(255,241,236,0.95)] px-3 py-2 text-[10px] font-semibold text-[#a23b2c]"
        type="submit"
      >
        관리자 삭제
      </button>
    </form>
  );
}

export function BoardTable({
  currentUserIsAdmin,
  currentUserId,
  groups,
  week,
}: {
  currentUserIsAdmin: boolean;
  currentUserId: string | null;
  groups: ReturnType<typeof groupBoardTodos>;
  week: WeekDay[];
}) {
  if (groups.length === 0) {
    return (
      <div className="glass-panel rounded-[30px] p-8">
        <h2 className="display-font text-2xl font-bold">사용자별 주간 체크 표</h2>
        <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
          아직 등록된 할 일이 없습니다. 로그인한 뒤 왼쪽에서 첫 할 일을 만들어 보세요.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-panel overflow-hidden rounded-[30px]">
      <div className="border-b border-[var(--line)] bg-white/60 px-5 py-4">
        <p className="text-[11px] font-semibold tracking-[0.18em] text-[var(--muted)]">
          메인 보드
        </p>
        <h2 className="display-font mt-1 text-2xl font-bold">사용자별 주간 체크 표</h2>
      </div>

      <div className="lg:hidden space-y-3 p-4">
        {groups.map((group) => {
          const isMine = group.userId === currentUserId;
          const completedCount = countCompletedTodos(group.todos, week);

          return (
            <section
              key={group.userId}
              className="rounded-[26px] border border-[var(--line)] bg-white/82 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-sm font-bold text-[var(--accent)]">
                    {group.nickname.slice(0, 1)}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold">{group.nickname}</p>
                      {completedCount > 0 ? <StarBadge count={completedCount} /> : null}
                      {isMine ? (
                        <span className="rounded-full bg-[var(--foreground)] px-2 py-1 text-[10px] font-semibold text-white">
                          나
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-[11px] leading-5 text-[var(--muted)]">
                      {isMine ? "아래 카드에서 내 체크를 바로 누를 수 있습니다." : "읽기 전용"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {group.todos.map((todo) => {
                  const checkDates = new Set(todo.checks.map((check) => check.dateKey));

                  return (
                    <article
                      key={todo.id}
                      className="rounded-3xl border border-[var(--line)] bg-[rgba(255,255,255,0.86)] p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium">
                            {todo.isContentPublic ? todo.title : "비공개 할 일"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {isTodoCompletedForWeek(todo, week) ? <StarBadge count={1} /> : null}
                          {currentUserIsAdmin && !isMine ? (
                            <AdminDeleteButton todoId={todo.id} />
                          ) : null}
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-7 gap-1.5">
                        {week.map((day) => (
                          <div
                            key={`${todo.id}-${day.dateKey}`}
                            className="rounded-2xl border border-[var(--line)] bg-white/90 px-1 py-2"
                          >
                            <div
                              className={`mb-1 text-center text-[9px] font-semibold leading-4 ${day.isToday ? "text-[var(--accent)]" : "text-[var(--muted)]"}`}
                            >
                              {day.dayNumber}/{day.shortLabel}
                            </div>
                            <div className="flex justify-center">
                              <CheckCell
                                checked={checkDates.has(day.dateKey)}
                                dateKey={day.dateKey}
                                editable={isMine}
                                todoId={todo.id}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[980px] border-separate border-spacing-0">
          <thead>
            <tr className="bg-[rgba(255,255,255,0.82)]">
              <th className="border-b border-[var(--line)] px-4 py-3 text-left text-xs font-semibold">
                사용자
              </th>
              <th className="border-b border-[var(--line)] px-4 py-3 text-left text-xs font-semibold">
                할 일
              </th>
              {week.map((day) => (
                <th
                  key={day.dateKey}
                  className="border-b border-[var(--line)] px-2 py-3 text-center text-xs font-semibold"
                >
                  <div className={day.isToday ? "text-[var(--accent)]" : ""}>
                    {formatWeekColumnLabel(day)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groups.map((group) =>
              group.todos.map((todo, index) => {
                const isMine = group.userId === currentUserId;
                const checkDates = new Set(todo.checks.map((check) => check.dateKey));

                return (
                  <tr
                    key={todo.id}
                    className="bg-white/75 align-top even:bg-[rgba(255,255,255,0.55)]"
                  >
                    {index === 0 ? (
                      <td
                        className="border-b border-[var(--line)] px-4 py-4"
                        rowSpan={group.todos.length}
                      >
                        <div className="flex min-h-full items-start gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-sm font-bold text-[var(--accent)]">
                            {group.nickname.slice(0, 1)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold">{group.nickname}</p>
                              {countCompletedTodos(group.todos, week) > 0 ? (
                                <StarBadge count={countCompletedTodos(group.todos, week)} />
                              ) : null}
                              {isMine ? (
                                <span className="rounded-full bg-[var(--foreground)] px-2 py-1 text-[10px] font-semibold text-white">
                                  나
                                </span>
                              ) : null}
                            </div>
                            <p className="mt-1 text-[11px] leading-5 text-[var(--muted)]">
                              {isMine ? "내 행은 직접 체크 가능" : "읽기 전용"}
                            </p>
                          </div>
                        </div>
                      </td>
                    ) : null}

                    <td className="border-b border-[var(--line)] px-4 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-medium">
                            {todo.isContentPublic ? todo.title : "비공개 할 일"}
                          </div>
                        </div>
                        {currentUserIsAdmin && !isMine ? (
                          <AdminDeleteButton todoId={todo.id} />
                        ) : null}
                      </div>
                    </td>

                    {week.map((day) => (
                      <td
                        key={`${todo.id}-${day.dateKey}`}
                        className="border-b border-[var(--line)] px-2 py-3"
                      >
                        <CheckCell
                          checked={checkDates.has(day.dateKey)}
                          dateKey={day.dateKey}
                          editable={isMine}
                          todoId={todo.id}
                        />
                      </td>
                    ))}
                  </tr>
                );
              }),
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
