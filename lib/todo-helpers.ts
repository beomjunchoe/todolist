import { type BoardTodoRecord, type TodoWithChecksRecord } from "@/lib/db";
import { getWeekStartKey, type WeekDay } from "@/lib/week";

export function isTodoCompletedForWeek(
  todo: TodoWithChecksRecord,
  week: WeekDay[],
) {
  const checkedDates = new Set(todo.checks.map((check) => check.dateKey));
  return week.every((day) => checkedDates.has(day.dateKey));
}

export function countCompletedTodos(
  todos: TodoWithChecksRecord[],
) {
  return todos.reduce((total, todo) => total + todo.starCount, 0);
}

export function countStarsByTodo(allChecksByTodo: Map<string, string[]>) {
  const starCounts = new Map<string, number>();

  for (const [todoId, dateKeys] of allChecksByTodo.entries()) {
    const checksByWeek = new Map<string, Set<string>>();

    for (const dateKey of dateKeys) {
      const weekStartKey = getWeekStartKey(dateKey);
      const weekChecks = checksByWeek.get(weekStartKey) ?? new Set<string>();
      weekChecks.add(dateKey);
      checksByWeek.set(weekStartKey, weekChecks);
    }

    let starCount = 0;

    for (const weekChecks of checksByWeek.values()) {
      if (weekChecks.size === 7) {
        starCount += 1;
      }
    }

    starCounts.set(todoId, starCount);
  }

  return starCounts;
}

export function groupBoardTodos(boardTodos: BoardTodoRecord[]) {
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

export function buildScoreboard(
  groups: ReturnType<typeof groupBoardTodos>,
  userStarTotals: Map<string, number>,
  currentUserId: string | null,
) {
  return [...groups]
    .map((group) => ({
      userId: group.userId,
      nickname: group.nickname,
      stars: userStarTotals.get(group.userId) ?? 0,
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
