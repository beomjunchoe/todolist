import {
  createTodo,
  deleteTodo,
  deleteTodoAsAdmin,
  signOut,
  toggleTodoCheck,
  updateTodo,
} from "@/app/actions";
import { getCurrentUser, isAdminUser, isKakaoConfigured } from "@/lib/auth";
import {
  listBoardTodos,
  listTodosForUser,
  type BoardTodoRecord,
  type TodoWithChecksRecord,
} from "@/lib/db";
import {
  formatWeekColumnLabel,
  formatWeekRange,
  getCurrentWeek,
  type WeekDay,
} from "@/lib/week";
import { InstallShortcut } from "@/components/install-shortcut";

type PageProps = {
  searchParams?: Promise<{
    auth?: string | string[];
  }>;
};

function getAuthMessage(
  value: string | string[] | undefined,
  kakaoConfigured: boolean,
) {
  const authCode = Array.isArray(value) ? value[0] : value;

  if (!kakaoConfigured) {
    return "카카오 설정값이 아직 없습니다. Render 환경변수의 KAKAO_* 값을 확인해 주세요.";
  }

  switch (authCode) {
    case "missing-kakao-config":
      return "카카오 로그인이 아직 설정되지 않았습니다.";
    case "invalid-state":
      return "로그인 검증에 실패했습니다. 다시 시도해 주세요.";
    case "token-exchange-failed":
      return "카카오 인증 코드를 토큰으로 바꾸지 못했습니다.";
    case "profile-fetch-failed":
      return "카카오 프로필 정보를 불러오지 못했습니다.";
    case "kakao-denied":
      return "카카오 로그인 동의가 취소되었습니다.";
    default:
      return null;
  }
}

function groupBoardTodos(boardTodos: BoardTodoRecord[]) {
  const grouped = new Map<
    string,
    {
      nickname: string;
      todos: BoardTodoRecord[];
    }
  >();

  for (const todo of boardTodos) {
    if (!grouped.has(todo.userId)) {
      grouped.set(todo.userId, {
        nickname: todo.user.nickname,
        todos: [],
      });
    }

    grouped.get(todo.userId)?.todos.push(todo);
  }

  return [...grouped.entries()].map(([userId, value]) => ({
    userId,
    ...value,
  }));
}

function isTodoCompletedForWeek(todo: TodoWithChecksRecord, week: WeekDay[]) {
  const checkedDates = new Set(todo.checks.map((check) => check.dateKey));
  return week.every((day) => checkedDates.has(day.dateKey));
}

function countCompletedTodos(todos: TodoWithChecksRecord[], week: WeekDay[]) {
  return todos.filter((todo) => isTodoCompletedForWeek(todo, week)).length;
}

function buildScoreboard(
  groups: ReturnType<typeof groupBoardTodos>,
  week: WeekDay[],
  currentUserId: string | null,
) {
  return [...groups]
    .map((group) => ({
      userId: group.userId,
      nickname: group.nickname,
      stars: countCompletedTodos(group.todos, week),
      todoCount: group.todos.length,
      isMine: group.userId === currentUserId,
    }))
    .sort((left, right) => {
      if (right.stars !== left.stars) {
        return right.stars - left.stars;
      }

      return left.nickname.localeCompare(right.nickname, "ko");
    });
}

function StarBadge({ count }: { count: number }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[rgba(255,210,84,0.28)] px-2 py-1 text-[10px] font-semibold text-[var(--foreground)]">
      <span aria-hidden="true">★</span>
      {count}
    </span>
  );
}

function AdminBadge() {
  return (
    <span className="inline-flex items-center rounded-full bg-[var(--foreground)] px-2 py-1 text-[10px] font-semibold text-white">
      관리자
    </span>
  );
}

function CheckCell({
  checked,
  dateKey,
  editable,
  todoId,
}: {
  checked: boolean;
  dateKey: string;
  editable: boolean;
  todoId: string;
}) {
  const baseClassName =
    "flex min-h-9 items-center justify-center rounded-xl border px-2 py-2 text-[11px] font-semibold";
  const stateClassName = checked
    ? "border-transparent bg-[var(--accent)] text-white shadow-[0_8px_18px_rgba(236,108,47,0.16)]"
    : "border-[var(--line)] bg-white text-[var(--foreground)]";

  if (!editable) {
    return (
      <div className={`${baseClassName} ${stateClassName}`}>
        {checked ? "완료" : "-"}
      </div>
    );
  }

  return (
    <form action={toggleTodoCheck}>
      <input name="todoId" type="hidden" value={todoId} />
      <input name="dateKey" type="hidden" value={dateKey} />
      <button className={`${baseClassName} ${stateClassName} w-full`} type="submit">
        {checked ? "완료" : "체크"}
      </button>
    </form>
  );
}

function SidebarTodoItem({
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

function Sidebar({
  currentUserId,
  currentUserKakaoId,
  currentUserName,
  isAdmin,
  myTodos,
  week,
}: {
  currentUserId: string;
  currentUserKakaoId: string;
  currentUserName: string;
  isAdmin: boolean;
  myTodos: TodoWithChecksRecord[];
  week: WeekDay[];
}) {
  const completedCount = countCompletedTodos(myTodos, week);

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

        {!isAdmin ? (
          <div className="mt-3 rounded-2xl border border-[var(--line)] bg-white/70 px-3 py-3 text-[11px] leading-5 text-[var(--muted)]">
            관리자 등록용 ID
            <br />
            내부 ID: {currentUserId}
            <br />
            카카오 ID: {currentUserKakaoId}
          </div>
        ) : null}
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
            myTodos.map((todo) => <SidebarTodoItem key={todo.id} todo={todo} week={week} />)
          ) : (
            <p className="text-xs leading-6 text-[var(--muted)]">
              아직 등록된 할 일이 없습니다. 위에서 하나 추가해 보세요.
            </p>
          )}
        </div>
      </section>
    </aside>
  );
}

function BoardTable({
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
                            <form action={deleteTodoAsAdmin}>
                              <input name="todoId" type="hidden" value={todo.id} />
                              <button
                                className="rounded-full border border-[rgba(180,60,40,0.18)] bg-[rgba(255,241,236,0.95)] px-3 py-2 text-[10px] font-semibold text-[#a23b2c]"
                                type="submit"
                              >
                                관리자 삭제
                              </button>
                            </form>
                          ) : null}
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-4 gap-2">
                        {week.map((day) => (
                          <div
                            key={`${todo.id}-${day.dateKey}`}
                            className="rounded-2xl border border-[var(--line)] bg-white/90 p-2"
                          >
                            <div
                              className={`mb-2 text-center text-[10px] font-semibold ${day.isToday ? "text-[var(--accent)]" : "text-[var(--muted)]"}`}
                            >
                              {day.dayNumber}
                              {day.shortLabel}
                            </div>
                            <CheckCell
                              checked={checkDates.has(day.dateKey)}
                              dateKey={day.dateKey}
                              editable={isMine}
                              todoId={todo.id}
                            />
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
                          <form action={deleteTodoAsAdmin}>
                            <input name="todoId" type="hidden" value={todo.id} />
                            <button
                              className="rounded-full border border-[rgba(180,60,40,0.18)] bg-[rgba(255,241,236,0.95)] px-3 py-2 text-[10px] font-semibold text-[#a23b2c]"
                              type="submit"
                            >
                              관리자 삭제
                            </button>
                          </form>
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

function Scoreboard({
  currentUserId,
  groups,
  week,
}: {
  currentUserId: string | null;
  groups: ReturnType<typeof groupBoardTodos>;
  week: WeekDay[];
}) {
  const scoreboard = buildScoreboard(groups, week, currentUserId);

  return (
    <section className="glass-panel rounded-[28px] p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.18em] text-[var(--muted)]">
            스코어보드
          </p>
          <h2 className="display-font mt-1 text-xl font-bold">이번 주 별 집계</h2>
        </div>
        <p className="text-[11px] leading-5 text-[var(--muted)]">
          할 일 하나를 일주일 내내 완료하면 별 1개
        </p>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
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
                    총 {entry.todoCount}개 중 {entry.stars}개 주간 완료
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

export default async function Home({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : undefined;
  const week = getCurrentWeek();
  const weekKeys = week.map((day) => day.dateKey);
  const currentUser = await getCurrentUser();
  const currentUserIsAdmin = isAdminUser(currentUser);
  const boardTodos = listBoardTodos(weekKeys);
  const groups = groupBoardTodos(boardTodos);
  const myTodos = currentUser ? listTodosForUser(currentUser.id, weekKeys) : [];
  const kakaoConfigured = isKakaoConfigured();
  const authMessage = getAuthMessage(params?.auth, kakaoConfigured);

  return (
    <main className="min-h-screen px-3 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1480px] space-y-4 sm:space-y-5">
        <section className="glass-panel rounded-[28px] px-4 py-4 sm:rounded-[32px] sm:px-6 sm:py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.22em] text-[var(--muted)]">
                학산여중 3-1 전용
              </p>
              <h1 className="display-font mt-2 text-[28px] font-bold leading-tight sm:text-4xl">
                공유형 투두리스트
              </h1>
              <p className="mt-3 max-w-3xl text-[13px] leading-6 text-[var(--muted)] sm:text-sm sm:leading-7">
                목록은 기본 공개입니다. 각 할 일은 내용 공개 또는 비공개를 고를 수
                있고, 오른쪽 메인 표에서 자신의 행만 직접 체크할 수 있습니다.
              </p>
              <p className="mt-3 max-w-3xl text-[12px] leading-6 text-[var(--muted)] sm:text-sm">
                어떤 사소한 목표든, 꾸준히 하는 게 중요합니다. 어제보다 한 걸음 더
                나아간 여러분이 되길 바랍니다 - 범준T
              </p>
            </div>

            <div className="flex w-full flex-col items-start gap-3 rounded-[24px] border border-[var(--line)] bg-white/70 px-4 py-3 text-sm lg:w-auto">
              <div>
                <div className="text-[11px] font-semibold tracking-[0.18em] text-[var(--muted)]">
                  이번 주
                </div>
                <div className="mt-1 font-semibold">{formatWeekRange(week)}</div>
              </div>

              {currentUser ? (
                <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
                  <span>{currentUser.nickname} 님으로 로그인됨</span>
                  {currentUserIsAdmin ? <AdminBadge /> : null}
                </div>
              ) : (
                <a
                  className="rounded-full bg-[#FEE500] px-4 py-2 text-xs font-semibold text-[#191600]"
                  href="/api/auth/kakao/start"
                >
                  카카오로 로그인
                </a>
              )}

              <InstallShortcut />

              {currentUserIsAdmin ? (
                <p className="text-[11px] leading-5 text-[var(--muted)]">
                  관리자 모드: 다른 사람 할 일을 메인 보드에서 삭제할 수 있습니다.
                </p>
              ) : null}
            </div>
          </div>

          {authMessage ? (
            <div className="mt-4 rounded-2xl border border-[rgba(236,108,47,0.24)] bg-[rgba(236,108,47,0.09)] px-4 py-3 text-sm text-[var(--foreground)]">
              {authMessage}
            </div>
          ) : null}
        </section>

        <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
          <div className="order-2 lg:order-1">
            {currentUser ? (
              <Sidebar
                currentUserId={currentUser.id}
                currentUserKakaoId={currentUser.kakaoId}
                currentUserName={currentUser.nickname}
                isAdmin={currentUserIsAdmin}
                myTodos={myTodos}
                week={week}
              />
            ) : (
              <aside className="glass-panel rounded-[28px] p-5 lg:sticky lg:top-6 lg:self-start">
                <p className="text-[11px] font-semibold tracking-[0.18em] text-[var(--muted)]">
                  시작하기
                </p>
                <h2 className="display-font mt-2 text-xl font-bold">로그인 후 내 할 일 추가</h2>
                <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                  카카오 로그인 후 왼쪽 관리 바에서 할 일을 만들 수 있습니다. 체크는
                  오른쪽 메인 표에서 자기 행만 가능합니다.
                </p>
                <a
                  className="mt-4 inline-flex rounded-full bg-[#FEE500] px-4 py-3 text-xs font-semibold text-[#191600]"
                  href="/api/auth/kakao/start"
                >
                  카카오로 로그인
                </a>
              </aside>
            )}
          </div>

          <div className="order-1 space-y-4 min-w-0 lg:order-2 lg:space-y-5">
            <Scoreboard currentUserId={currentUser?.id ?? null} groups={groups} week={week} />
            <BoardTable
              currentUserId={currentUser?.id ?? null}
              currentUserIsAdmin={currentUserIsAdmin}
              groups={groups}
              week={week}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
