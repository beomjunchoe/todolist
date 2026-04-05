import {
  createTodo,
  signOut,
  toggleTodoCheck,
  toggleTodoVisibility,
} from "@/app/actions";
import {
  listPublicTodos,
  listTodosForUser,
  type PublicTodoRecord,
  type TodoWithChecksRecord,
} from "@/lib/db";
import { getCurrentUser, isKakaoConfigured } from "@/lib/auth";
import { formatWeekRange, getCurrentWeek, type WeekDay } from "@/lib/week";

function getAuthMessage(
  value: string | string[] | undefined,
  kakaoConfigured: boolean,
) {
  const authCode = Array.isArray(value) ? value[0] : value;

  if (!kakaoConfigured) {
    return "카카오 앱 설정값이 아직 없습니다. `.env`에 `KAKAO_*` 값을 채우면 로그인 버튼이 활성화됩니다.";
  }

  switch (authCode) {
    case "missing-kakao-config":
      return "카카오 로그인이 아직 설정되지 않았습니다. `.env`에 `KAKAO_*` 값을 먼저 입력해주세요.";
    case "invalid-state":
      return "OAuth 상태값 검증에 실패했습니다. 다시 로그인해주세요.";
    case "token-exchange-failed":
      return "카카오 인가 코드를 액세스 토큰으로 교환하지 못했습니다.";
    case "profile-fetch-failed":
      return "카카오 프로필을 불러오지 못했습니다.";
    case "kakao-denied":
      return "카카오 로그인 동의가 취소되었습니다.";
    default:
      return null;
  }
}

function groupPublicTodos(publicTodos: PublicTodoRecord[]) {
  const grouped = new Map<
    string,
    {
      nickname: string;
      profileImage: string | null;
      todos: PublicTodoRecord[];
    }
  >();

  for (const todo of publicTodos) {
    if (!grouped.has(todo.userId)) {
      grouped.set(todo.userId, {
        nickname: todo.user.nickname,
        profileImage: todo.user.profileImage,
        todos: [],
      });
    }

    grouped.get(todo.userId)?.todos.push(todo);
  }

  return [...grouped.entries()]
    .map(([userId, value]) => ({
      userId,
      ...value,
      todos: value.todos.sort((left, right) => left.title.localeCompare(right.title)),
    }))
    .sort((left, right) => left.nickname.localeCompare(right.nickname));
}

function WeeklyCells({
  mode,
  todo,
  week,
}: {
  mode: "editable" | "readonly";
  todo: TodoWithChecksRecord;
  week: WeekDay[];
}) {
  const checkedDates = new Set(todo.checks.map((check) => check.dateKey));

  return (
    <div className="grid grid-cols-7 gap-2">
      {week.map((day) => {
        const checked = checkedDates.has(day.dateKey);
        const baseClassName =
          "flex h-12 items-center justify-center rounded-2xl border text-sm font-semibold";
        const stateClassName = checked
          ? "border-transparent bg-[var(--accent)] text-white shadow-[0_10px_24px_rgba(236,108,47,0.24)]"
          : "border-[var(--line)] bg-white/75 text-[var(--foreground)]";

        if (mode === "readonly") {
          return (
            <div
              key={day.dateKey}
              className={`${baseClassName} ${stateClassName}`}
              title={day.dateKey}
            >
              {checked ? "완료" : "-"}
            </div>
          );
        }

        return (
          <form key={day.dateKey} action={toggleTodoCheck}>
            <input name="todoId" type="hidden" value={todo.id} />
            <input name="dateKey" type="hidden" value={day.dateKey} />
            <button
              className={`${baseClassName} ${stateClassName} w-full cursor-pointer`}
              title={day.dateKey}
              type="submit"
            >
              {checked ? "완료" : "체크"}
            </button>
          </form>
        );
      })}
    </div>
  );
}

function WeekHeader({ week }: { week: WeekDay[] }) {
  return (
    <div className="grid grid-cols-7 gap-2 text-center">
      {week.map((day) => (
        <div
          key={day.dateKey}
          className={`rounded-2xl border px-3 py-3 ${
            day.isToday
              ? "border-transparent bg-[var(--foreground)] text-white"
              : "border-[var(--line)] bg-white/55 text-[var(--foreground)]"
          }`}
        >
          <div className="text-xs font-medium tracking-[0.2em] opacity-70">
            {day.shortLabel}
          </div>
          <div className="display-font mt-1 text-xl font-bold">{day.dayNumber}</div>
        </div>
      ))}
    </div>
  );
}

function TodoRow({
  todo,
  week,
}: {
  todo: TodoWithChecksRecord;
  week: WeekDay[];
}) {
  return (
    <article className="glass-panel rounded-[28px] p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center rounded-full border border-[var(--line)] bg-white/70 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-[var(--muted)]">
            {todo.isPublic ? "공개" : "비공개"}
          </div>
          <h3 className="text-xl font-semibold text-[var(--foreground)]">{todo.title}</h3>
        </div>

        <form action={toggleTodoVisibility}>
          <input name="todoId" type="hidden" value={todo.id} />
          <button
            className="rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold text-[var(--foreground)]"
            type="submit"
          >
            {todo.isPublic ? "비공개로 전환" : "공개로 전환"}
          </button>
        </form>
      </div>

      <div className="mt-5 space-y-3">
        <WeekHeader week={week} />
        <WeeklyCells mode="editable" todo={todo} week={week} />
      </div>
    </article>
  );
}

function PublicTodoCard({
  nickname,
  profileImage,
  todos,
  week,
}: {
  nickname: string;
  profileImage: string | null;
  todos: PublicTodoRecord[];
  week: WeekDay[];
}) {
  return (
    <section className="glass-panel rounded-[32px] p-6">
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--sky)] text-lg font-bold text-[var(--foreground)]">
          {profileImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt={`${nickname} 프로필`}
              className="h-14 w-14 rounded-2xl object-cover"
              src={profileImage}
            />
          ) : (
            nickname.slice(0, 1)
          )}
        </div>
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-[var(--muted)]">
            공개 보드
          </p>
          <h3 className="display-font text-2xl font-bold">{nickname}</h3>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {todos.map((todo) => (
          <article
            key={todo.id}
            className="rounded-[28px] border border-[var(--line)] bg-white/70 p-5"
          >
            <h4 className="text-lg font-semibold">{todo.title}</h4>
            <div className="mt-4 space-y-3">
              <WeekHeader week={week} />
              <WeeklyCells mode="readonly" todo={todo} week={week} />
            </div>
          </article>
        ))}
      </div>
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
  const publicTodos = listPublicTodos(weekKeys);
  const sharedGroups = groupPublicTodos(publicTodos);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-5 py-6 sm:px-8 lg:px-10">
      <section className="relative overflow-hidden rounded-[40px] border border-[var(--line)] bg-[linear-gradient(135deg,rgba(255,250,240,0.96),rgba(252,223,207,0.88))] px-6 py-8 shadow-[0_24px_64px_rgba(55,44,30,0.08)] sm:px-8 lg:px-10">
        <div className="absolute -right-16 top-0 h-48 w-48 rounded-full bg-[rgba(157,217,197,0.36)] blur-3xl" />
        <div className="absolute bottom-0 right-24 h-36 w-36 rounded-full bg-[rgba(187,212,255,0.34)] blur-3xl" />

        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-5">
            <div className="inline-flex items-center rounded-full border border-[var(--line)] bg-white/70 px-4 py-2 text-xs font-semibold tracking-[0.22em] text-[var(--muted)]">
              함께 쓰는 주간 투두
            </div>
            <div className="space-y-4">
              <h1 className="display-font max-w-3xl text-4xl font-bold tracking-[-0.05em] text-[var(--foreground)] sm:text-5xl lg:text-6xl">
                로그인은 개인적으로.
                <br />
                공개는 선택적으로.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-[var(--muted)] sm:text-lg">
                카카오로 로그인한 뒤 내 주간 루틴을 관리하고, 공개하고 싶은 항목만
                다른 사람에게 보여줄 수 있습니다.
              </p>
            </div>
          </div>

          <div className="glass-panel flex min-w-[280px] flex-col gap-4 rounded-[30px] p-5">
            <div>
              <p className="text-xs font-semibold tracking-[0.2em] text-[var(--muted)]">
                이번 주
              </p>
              <p className="mono-font mt-2 text-sm text-[var(--foreground)]">
                {formatWeekRange(week)}
              </p>
            </div>

            {currentUser ? (
              <>
                <div className="rounded-[24px] border border-[var(--line)] bg-white/70 p-4">
                  <p className="text-sm text-[var(--muted)]">로그인 사용자</p>
                  <p className="mt-1 text-xl font-semibold">{currentUser.nickname}</p>
                </div>
                <form action={signOut}>
                  <button
                    className="w-full rounded-full bg-[var(--foreground)] px-4 py-3 text-sm font-semibold text-white"
                    type="submit"
                  >
                    로그아웃
                  </button>
                </form>
              </>
            ) : (
              <>
                <div className="rounded-[24px] border border-[var(--line)] bg-white/70 p-4 text-sm leading-6 text-[var(--muted)]">
                  로그인 후에는 나만의 투두를 만들고, 각 항목을 공개 또는 비공개로
                  설정한 뒤 날짜별로 완료 여부를 체크할 수 있습니다.
                </div>
                <a
                  className={`w-full rounded-full px-4 py-3 text-center text-sm font-semibold ${
                    kakaoConfigured
                      ? "bg-[#FEE500] text-[#1A1A1A]"
                      : "cursor-not-allowed bg-[#f1e7a5] text-[#6d6532]"
                  }`}
                  href={kakaoConfigured ? "/api/auth/kakao/start" : "#setup-needed"}
                >
                  카카오로 로그인
                </a>
              </>
            )}
          </div>
        </div>
      </section>

      {authMessage ? (
        <section className="glass-panel rounded-[28px] border border-[rgba(236,108,47,0.2)] bg-[rgba(255,246,240,0.92)] p-5 text-sm leading-6 text-[var(--foreground)]">
          {authMessage}
        </section>
      ) : null}

      <section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-[var(--muted)]">
              내 주간 목록
            </p>
            <h2 className="display-font mt-2 text-3xl font-bold tracking-[-0.04em]">
              내 투두
            </h2>
          </div>

          {currentUser ? (
            <>
              <section className="glass-panel rounded-[32px] p-6">
                <form action={createTodo} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold" htmlFor="title">
                      이번 주 반복할 항목
                    </label>
                    <input
                      className="w-full rounded-[22px] border border-[var(--line)] bg-white px-4 py-4 text-base outline-none placeholder:text-[var(--muted)]"
                      id="title"
                      maxLength={80}
                      name="title"
                      placeholder="예: 운동 30분, 책 20쪽, 물 2리터"
                      required
                      type="text"
                    />
                  </div>

                  <label className="flex items-center gap-3 rounded-[22px] border border-[var(--line)] bg-white/80 px-4 py-3 text-sm font-medium">
                    <input
                      className="h-4 w-4 accent-[var(--accent)]"
                      defaultChecked
                      name="isPublic"
                      type="checkbox"
                    />
                    이 항목을 공개 보드에 공유하기
                  </label>

                  <button
                    className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white"
                    type="submit"
                  >
                    투두 추가
                  </button>
                </form>
              </section>

              {myTodos.length > 0 ? (
                <div className="space-y-4">
                  {myTodos.map((todo) => (
                    <TodoRow key={todo.id} todo={todo} week={week} />
                  ))}
                </div>
              ) : (
                <section className="glass-panel rounded-[32px] p-8 text-center text-[var(--muted)]">
                  아직 투두가 없습니다. 위에서 이번 주 루틴을 하나 추가해보세요.
                </section>
              )}
            </>
          ) : (
            <section className="glass-panel rounded-[32px] p-8 leading-7 text-[var(--muted)]">
              로그인해야 개인 목록을 만들 수 있습니다. 로그인 후 각 항목마다 이번 주
              7일 체크 칸이 생성됩니다.
            </section>
          )}
        </div>

        <aside className="space-y-6" id="setup-needed">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-[var(--muted)]">
              공개 보드
            </p>
            <h2 className="display-font mt-2 text-3xl font-bold tracking-[-0.04em]">
              공유된 투두
            </h2>
          </div>

          {sharedGroups.length > 0 ? (
            sharedGroups.map((group) => (
              <PublicTodoCard
                key={group.userId}
                nickname={group.nickname}
                profileImage={group.profileImage}
                todos={group.todos}
                week={week}
              />
            ))
          ) : (
            <section className="glass-panel rounded-[32px] p-8 leading-7 text-[var(--muted)]">
              아직 공개된 투두가 없습니다. 로그인한 사용자가 투두를 공개로 바꾸면
              여기에 표시됩니다.
            </section>
          )}
        </aside>
      </section>
    </main>
  );
}
