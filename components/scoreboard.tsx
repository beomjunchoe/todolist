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
    <section className="glass-panel rounded-[28px] p-4 sm:p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.18em] text-[var(--muted)]">
            스코어보드
          </p>
          <h2 className="display-font mt-1 text-lg font-bold sm:text-xl">
            누적 별 집계
          </h2>
        </div>
        <p className="max-w-[260px] text-[11px] leading-5 text-[var(--muted)]">
          주간 올클과 최종 완료 별이 모두 합산됩니다.
        </p>
      </div>

      <div className="-mx-1 mt-4 flex snap-x gap-3 overflow-x-auto px-1 pb-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 xl:grid-cols-3">
        {scoreboard.map((entry, index) => (
          <div
            key={entry.userId}
            className="min-w-[230px] snap-start rounded-3xl border border-[var(--line)] bg-white/82 px-4 py-3 sm:min-w-0"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-xs font-bold text-[var(--accent)]">
                  {index + 1}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold">{entry.nickname}</p>
                    {entry.isMine ? (
                      <span className="rounded-full bg-[var(--foreground)] px-2 py-1 text-[10px] font-semibold text-white">
                        나
                      </span>
                    ) : null}
                  </div>
                  <p className="text-[11px] leading-5 text-[var(--muted)]">
                    할 일 {entry.todoCount}개 · 별 {entry.stars}개
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
