import {
  createTodo,
  deleteTodo,
  signOut,
  toggleTodoCheck,
  updateTodo,
} from "@/app/actions";
import { getCurrentUser, isKakaoConfigured } from "@/lib/auth";
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

function getAuthMessage(
  value: string | string[] | undefined,
  kakaoConfigured: boolean,
) {
  const authCode = Array.isArray(value) ? value[0] : value;

  if (!kakaoConfigured) {
    return "카카오 앱 설정값이 아직 없습니다. Render 환경변수의 `KAKAO_*` 값을 다시 확인해주세요.";
  }

  switch (authCode) {
    case "missing-kakao-config":
      return "카카오 로그인이 아직 설정되지 않았습니다.";
    case "invalid-state":
      return "로그인 검증에 실패했습니다. 다시 시도해주세요.";
    case "token-exchange-failed":
      return "카카오 인가 코드를 토큰으로 바꾸는 데 실패했습니다.";
    case "profile-fetch-failed":
      return "카카오 프로필을 불러오지 못했습니다.";
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
      profileImage: string | null;
      todos: BoardTodoRecord[];
    }
  >();

  for (const todo of boardTodos) {
    if (!grouped.has(todo.userId)) {
      grouped.set(todo.userId, {
        nickname: todo.user.nickname,
        profileImage: todo.user.profileImage,
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
    "flex min-h-9 items-center justify-center rounded-xl border px-2 py-2 text-xs font-semibold";
  const stateClassName = checked
    ? "border-transparent bg-[var(--accent)] text-white shadow-[0_8px_18px_rgba(236,108,47,0.16)]"
    : "border-[var(--line)] bg-white/90 text-[var(--foreground)]";

  if (!editable) {
    return <div className={`${baseClassName} ${stateClassName}`}>{checked ? "완료" : "-"}</div>;
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

function SidebarTodoItem({ todo }: { todo: TodoWithChecksRecord }) {
  return (
    <article className="rounded-3xl border border-[var(--line)] bg-white/75 p-4">
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
        <div className="flex gap-2">
          <button
            className="rounded-full bg-[var(--foreground)] px-3 py-2 text-xs font-semibold text-white"
            type="submit"
          >
            수정
          </button>
        </div>
      </form>
      <form action={deleteTodo} className="mt-2">
        <input name="todoId" type="hidden" value={todo.id} />
        <button
          className="rounded-full border border-[var(--line)] bg-white px-3 py-2 text-xs font-semibold"
          type="submit"
        >
          삭제
        </button>
      </form>
    </article>
  );
}

function Sidebar({
  currentUserName,
  myTodos,
}: {
  currentUserName: string;
  myTodos: TodoWithChecksRecord[];
}) {
  return (
    <aside className="space-y-4">
      <section className="glass-panel rounded-[28px] p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.18em] text-[var(--muted)]">
              내 관리 바
            </p>
            <h2 className="display-font mt-2 text-2xl font-bold">{currentUserName}</h2>
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
          할 일 추가, 수정, 삭제는 여기서 하고 체크는 오른쪽 메인 표에서 직접 합니다.
        </p>
      </section>

      <section className="glass-panel rounded-[28px] p-5">
        <h3 className="text-sm font-semibold">새 할 일 추가</h3>
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
          <h3 className="text-sm font-semibold">내 할 일</h3>
          <span className="text-xs text-[var(--muted)]">{myTodos.length}개</span>
        </div>
        <div className="mt-3 space-y-3">
          {myTodos.length > 0 ? (
            myTodos.map((todo) => <SidebarTodoItem key={todo.id} todo={todo} />)
          ) : (
            <p className="text-xs leading-6 text-[var(--muted)]">
              아직 할 일이 없습니다. 위에서 하나 추가하세요.
            </p>
          )}
        </div>
      </section>
    </aside>
  );
}

function BoardTable({
  currentUserId,
  groups,
  week,
}: {
  currentUserId: string | null;
  groups: ReturnType<typeof groupBoardTodos>;
  week: WeekDay[];
}) {
  return (
    <div className="glass-panel overflow-hidden rounded-[30px]">
      <div className="border-b border-[var(--line)] bg-white/55 px-5 py-4">
        <p className="text-[11px] font-semibold tracking-[0.18em] text-[var(--muted)]">
          메인 보드
        </p>
        <h2 className="display-font mt-1 text-2xl font-bold">사용자별 주간 체크 표</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] border-separate border-spacing-0">
          <thead>
            <tr className="bg-[rgba(255,255,255,0.72)]">
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
                  {formatWeekColumnLabel(day)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groups.length > 0 ? (
              groups.map((group) =>
                group.todos.map((todo, index) => {
                  const checkedDates = new Set(todo.checks.map((check) => check.dateKey));
                  const isMine = currentUserId === todo.userId;

                  return (
                    <tr
                      key={todo.id}
                      className={isMine ? "bg-[rgba(255,248,242,0.92)]" : "bg-white/72"}
                    >
                      {index === 0 ? (
                        <td
                          rowSpan={group.todos.length}
                          className="border-b border-[var(--line)] px-4 py-4 align-top"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--sky)] text-sm font-bold">
                              {group.profileImage ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  alt={`${group.nickname} 프로필`}
                                  className="h-10 w-10 rounded-2xl object-cover"
                                  src={group.profileImage}
                                />
                              ) : (
                                group.nickname.slice(0, 1)
                              )}
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-[var(--foreground)]">
                                {group.nickname}
                              </div>
                              <div className="text-[11px] text-[var(--muted)]">
                                {isMine ? "내 행은 직접 체크 가능" : "읽기 전용"}
                              </div>
                            </div>
                          </div>
                        </td>
                      ) : null}
                      <td className="border-b border-[var(--line)] px-4 py-4 text-sm">
                        <div className="font-medium text-[var(--foreground)]">
                          {todo.isContentPublic ? todo.title : "비공개 할 일"}
                        </div>
                        <div className="mt-1 text-[11px] text-[var(--muted)]">
                          {todo.isContentPublic
                            ? "내용 공개"
                            : "목록은 보이고 내용만 숨김"}
                        </div>
                      </td>
                      {week.map((day) => (
                        <td
                          key={day.dateKey}
                          className="border-b border-[var(--line)] px-2 py-3 text-center"
                        >
                          <CheckCell
                            checked={checkedDates.has(day.dateKey)}
                            dateKey={day.dateKey}
                            editable={isMine}
                            todoId={todo.id}
                          />
                        </td>
                      ))}
                    </tr>
                  );
                }),
              )
            ) : (
              <tr>
                <td
                  className="px-4 py-12 text-center text-sm text-[var(--muted)]"
                  colSpan={week.length + 2}
                >
                  아직 등록된 할 일이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LoginBox({ weekRange }: { weekRange: string }) {
  return (
    <section className="glass-panel rounded-[28px] p-6">
      <p className="text-[11px] font-semibold tracking-[0.18em] text-[var(--muted)]">
        이번 주
      </p>
      <p className="mono-font mt-2 text-xs text-[var(--foreground)]">{weekRange}</p>
      <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
        로그인하면 왼쪽 관리 바에서 할 일을 만들고, 오른쪽 메인 표에서 내 행만 직접 체크할 수 있습니다.
      </p>
      <a
        className="mt-5 block rounded-full bg-[#FEE500] px-4 py-3 text-center text-sm font-semibold text-[#1A1A1A]"
        href="/api/auth/kakao/start"
      >
        카카오로 로그인
      </a>
    </section>
  );
}

export default async function Page(props: PageProps<"/">) {
  const query = await props.searchParams;
  const currentUser = await getCurrentUser();
  const week = getCurrentWeek();
  const weekKeys = week.map((day) => day.dateKey);
  const kakaoConfigured = isKakaoConfigured();
  const authMessage = getAuthMessage(query.auth, kakaoConfigured);
  const myTodos = currentUser ? listTodosForUser(currentUser.id, weekKeys) : [];
  const boardGroups = groupBoardTodos(listBoardTodos(weekKeys));

  return (
    <main className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-5 px-4 py-4 sm:px-6 lg:px-8">
      <section className="glass-panel rounded-[28px] px-5 py-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.18em] text-[var(--muted)]">
              공유형 투두리스트
            </p>
            <h1 className="display-font mt-1 text-3xl font-bold tracking-[-0.04em] sm:text-4xl">
              사용자별 주간 체크 표
            </h1>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              목록은 기본 공개, 각 할 일의 내용만 공개/비공개를 고를 수 있습니다.
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--line)] bg-white/75 px-4 py-3 text-xs text-[var(--foreground)]">
            {formatWeekRange(week)}
          </div>
        </div>
      </section>

      {authMessage ? (
        <section className="glass-panel rounded-[24px] border border-[rgba(236,108,47,0.22)] bg-[rgba(255,246,240,0.92)] px-4 py-4 text-sm leading-6">
          {authMessage}
        </section>
      ) : null}

      <section className="grid gap-5 lg:grid-cols-[330px_minmax(0,1fr)]">
        <div>
          {currentUser ? (
            <Sidebar currentUserName={currentUser.nickname} myTodos={myTodos} />
          ) : (
            <LoginBox weekRange={formatWeekRange(week)} />
          )}
        </div>

        <div className="min-w-0">
          <BoardTable currentUserId={currentUser?.id ?? null} groups={boardGroups} week={week} />
        </div>
      </section>
    </main>
  );
}
