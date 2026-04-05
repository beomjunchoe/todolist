import { buildScoreboard, groupBoardTodos } from "@/lib/todo-helpers";

import { StarBadge } from "./badges";

export function Scoreboard({
  currentUserId,
  groups,
  userStarTotals,
}: {
  currentUserId: string | null;
  groups: ReturnType<typeof groupBoardTodos>;
  userStarTotals: Map<string, number>;
}) {
  const scoreboard = buildScoreboard(groups, userStarTotals, currentUserId);

  return (
    <section className="glass-panel rounded-[28px] p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.18em] text-[var(--muted)]">
            스코어보드
          </p>
          <h2 className="display-font mt-1 text-xl font-bold">누적 별 집계</h2>
        </div>
        <p className="text-[11px] leading-5 text-[var(--muted)]">
          할 일 하나를 한 주 동안 모두 완료할 때마다 별 1개
        </p>
      </div>

      <div className="mt-4 max-h-[232px] space-y-3 overflow-y-auto pr-1 sm:grid sm:max-h-none sm:grid-cols-2 sm:gap-3 sm:space-y-0 sm:overflow-visible xl:grid-cols-3">
        {scoreboard.map((entry, index) => (
          <div
            key={entry.userId}
            className="rounded-3xl border border-[var(--line)] bg-white/80 px-4 py-3"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-xs font-bold text-[var(--accent)]">
                  {index + 1}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">{entry.nickname}</p>
                    {entry.isMine ? (
                      <span className="rounded-full bg-[var(--foreground)] px-2 py-1 text-[10px] font-semibold text-white">
                        나
                      </span>
                    ) : null}
                  </div>
                  <p className="text-[11px] text-[var(--muted)]">
                    총 {entry.todoCount}개 할 일, 누적 별 {entry.stars}개
                  </p>
                </div>
              </div>
              <StarBadge count={entry.stars} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
