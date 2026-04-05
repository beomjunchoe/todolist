import { type BoardTodoRecord, type TodoWithChecksRecord } from "@/lib/db";
import { type WeekDay } from "@/lib/week";

export function isTodoCompletedForWeek(
  todo: TodoWithChecksRecord,
  week: WeekDay[],
) {
  const checkedDates = new Set(todo.checks.map((check) => check.dateKey));
  return week.every((day) => checkedDates.has(day.dateKey));
}

export function countCompletedTodos(
  todos: TodoWithChecksRecord[],
  week: WeekDay[],
) {
  return todos.filter((todo) => isTodoCompletedForWeek(todo, week)).length;
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
