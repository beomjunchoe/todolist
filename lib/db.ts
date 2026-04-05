import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";

import Database from "better-sqlite3";
import { countStarsByTodo } from "@/lib/todo-helpers";

export type DbUser = {
  id: string;
  kakaoId: string;
  nickname: string;
  profileImage: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TodoWithChecksRecord = {
  id: string;
  isContentPublic: boolean;
  starCount: number;
  title: string;
  userId: string;
  checks: { dateKey: string }[];
};

export type BoardTodoRecord = TodoWithChecksRecord & {
  user: Pick<DbUser, "nickname" | "profileImage">;
};

function resolveDatabasePath() {
  const url = process.env.DATABASE_URL ?? "file:./dev.db";

  if (!url.startsWith("file:")) {
    throw new Error("DATABASE_URL must use a file: URL for SQLite.");
  }

  const rawPath = url.slice("file:".length);
  const normalizedPath = rawPath.startsWith("//") ? rawPath.slice(2) : rawPath;

  if (path.isAbsolute(normalizedPath)) {
    return normalizedPath;
  }

  return path.join(
    /* turbopackIgnore: true */ process.cwd(),
    normalizedPath.replace(/^\.\//, ""),
  );
}

function mapUser(row: {
  id: string;
  kakao_id: string;
  nickname: string;
  profile_image: string | null;
  created_at: string;
  updated_at: string;
}): DbUser {
  return {
    id: row.id,
    kakaoId: row.kakao_id,
    nickname: row.nickname,
    profileImage: row.profile_image,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function createDatabase() {
  const databasePath = resolveDatabasePath();
  fs.mkdirSync(path.dirname(databasePath), { recursive: true });

  const db = new Database(databasePath, { timeout: 5000 });
  db.pragma("foreign_keys = ON");
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      kakao_id TEXT NOT NULL UNIQUE,
      nickname TEXT NOT NULL,
      profile_image TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      token_hash TEXT NOT NULL UNIQUE,
      user_id TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS todo_items (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      is_public INTEGER NOT NULL DEFAULT 0,
      completed_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS todo_checks (
      id TEXT PRIMARY KEY,
      todo_id TEXT NOT NULL,
      date_key TEXT NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE (todo_id, date_key),
      FOREIGN KEY (todo_id) REFERENCES todo_items(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_todo_items_user_id_created_at ON todo_items(user_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_todo_checks_date_key ON todo_checks(date_key);
  `);

  const todoItemColumns = db
    .prepare("PRAGMA table_info(todo_items)")
    .all() as { name: string }[];

  if (!todoItemColumns.some((column) => column.name === "completed_at")) {
    db.exec("ALTER TABLE todo_items ADD COLUMN completed_at TEXT");
  }

  return db;
}

const globalForDatabase = globalThis as typeof globalThis & {
  todoDb?: Database.Database;
};

function getDatabase() {
  if (!globalForDatabase.todoDb) {
    globalForDatabase.todoDb = createDatabase();
  }

  return globalForDatabase.todoDb;
}

export function findUserBySessionTokenHash(tokenHash: string) {
  const db = getDatabase();
  const row = db
    .prepare(
      `
        SELECT
          users.id,
          users.kakao_id,
          users.nickname,
          users.profile_image,
          users.created_at,
          users.updated_at,
          sessions.expires_at
        FROM sessions
        INNER JOIN users ON users.id = sessions.user_id
        WHERE sessions.token_hash = ?
      `,
    )
    .get(tokenHash) as
    | ({
        expires_at: string;
      } & {
        id: string;
        kakao_id: string;
        nickname: string;
        profile_image: string | null;
        created_at: string;
        updated_at: string;
      })
    | undefined;

  if (!row) {
    return null;
  }

  if (new Date(row.expires_at) <= new Date()) {
    db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(tokenHash);
    return null;
  }

  return mapUser(row);
}

export function insertSession(input: {
  tokenHash: string;
  userId: string;
  expiresAt: string;
}) {
  const db = getDatabase();
  const now = new Date().toISOString();

  db.prepare(
    `
      INSERT INTO sessions (id, token_hash, user_id, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?)
    `,
  ).run(randomUUID(), input.tokenHash, input.userId, input.expiresAt, now);
}

export function deleteSessionByTokenHash(tokenHash: string) {
  const db = getDatabase();
  db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(tokenHash);
}

export function upsertUserByKakao(input: {
  kakaoId: string;
  nickname: string;
  profileImage: string | null;
}) {
  const db = getDatabase();
  const existing = db
    .prepare(
      `
        SELECT id, kakao_id, nickname, profile_image, created_at, updated_at
        FROM users
        WHERE kakao_id = ?
      `,
    )
    .get(input.kakaoId) as
    | {
        id: string;
        kakao_id: string;
        nickname: string;
        profile_image: string | null;
        created_at: string;
        updated_at: string;
      }
    | undefined;

  const now = new Date().toISOString();

  if (!existing) {
    const created = {
      created_at: now,
      id: randomUUID(),
      kakao_id: input.kakaoId,
      nickname: input.nickname,
      profile_image: input.profileImage,
      updated_at: now,
    };

    db.prepare(
      `
        INSERT INTO users (id, kakao_id, nickname, profile_image, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
    ).run(
      created.id,
      created.kakao_id,
      created.nickname,
      created.profile_image,
      created.created_at,
      created.updated_at,
    );

    return mapUser(created);
  }

  db.prepare(
    `
      UPDATE users
      SET nickname = ?, profile_image = ?, updated_at = ?
      WHERE id = ?
    `,
  ).run(input.nickname, input.profileImage, now, existing.id);

  return mapUser({
    ...existing,
    nickname: input.nickname,
    profile_image: input.profileImage,
    updated_at: now,
  });
}

export function createTodoItem(input: {
  userId: string;
  title: string;
  isContentPublic: boolean;
}) {
  const db = getDatabase();
  const now = new Date().toISOString();

  db.prepare(
    `
      INSERT INTO todo_items (id, user_id, title, is_public, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
  ).run(
    randomUUID(),
    input.userId,
    input.title,
    input.isContentPublic ? 1 : 0,
    now,
    now,
  );
}

export function updateTodoItemForUser(input: {
  userId: string;
  todoId: string;
  title: string;
  isContentPublic: boolean;
}) {
  const db = getDatabase();

  db.prepare(
    `
      UPDATE todo_items
      SET title = ?, is_public = ?, updated_at = ?
      WHERE id = ? AND user_id = ?
    `,
  ).run(
    input.title,
    input.isContentPublic ? 1 : 0,
    new Date().toISOString(),
    input.todoId,
    input.userId,
  );
}

export function deleteTodoItemForUser(userId: string, todoId: string) {
  const db = getDatabase();

  db.prepare(
    `
      DELETE FROM todo_items
      WHERE id = ? AND user_id = ?
    `,
  ).run(todoId, userId);
}

export function deleteTodoItemById(todoId: string) {
  const db = getDatabase();

  db.prepare(
    `
      DELETE FROM todo_items
      WHERE id = ?
    `,
  ).run(todoId);
}

export function completeTodoItemForUser(userId: string, todoId: string) {
  const db = getDatabase();

  db.prepare(
    `
      UPDATE todo_items
      SET completed_at = ?, updated_at = ?
      WHERE id = ? AND user_id = ? AND completed_at IS NULL
    `,
  ).run(new Date().toISOString(), new Date().toISOString(), todoId, userId);
}

export function toggleTodoVisibilityForUser(userId: string, todoId: string) {
  const db = getDatabase();
  const todo = db
    .prepare(
      `
        SELECT id, is_public
        FROM todo_items
        WHERE id = ? AND user_id = ?
      `,
    )
    .get(todoId, userId) as
    | {
        id: string;
        is_public: number;
      }
    | undefined;

  if (!todo) {
    return;
  }

  db.prepare(
    `
      UPDATE todo_items
      SET is_public = ?, updated_at = ?
      WHERE id = ?
    `,
  ).run(todo.is_public ? 0 : 1, new Date().toISOString(), todo.id);
}

export function toggleTodoCheckForUser(userId: string, todoId: string, dateKey: string) {
  const db = getDatabase();
  const todo = db
    .prepare(
      `
        SELECT id
        FROM todo_items
        WHERE id = ? AND user_id = ?
      `,
    )
    .get(todoId, userId) as { id: string } | undefined;

  if (!todo) {
    return;
  }

  const existing = db
    .prepare(
      `
        SELECT id
        FROM todo_checks
        WHERE todo_id = ? AND date_key = ?
      `,
    )
    .get(todoId, dateKey) as { id: string } | undefined;

  if (existing) {
    db.prepare("DELETE FROM todo_checks WHERE id = ?").run(existing.id);
    return;
  }

  db.prepare(
    `
      INSERT INTO todo_checks (id, todo_id, date_key, created_at)
      VALUES (?, ?, ?, ?)
    `,
  ).run(randomUUID(), todoId, dateKey, new Date().toISOString());
}

function listChecksByTodo(weekKeys: string[]) {
  const db = getDatabase();
  const checks = weekKeys.length
    ? (db
        .prepare(
          `
            SELECT todo_id, date_key
            FROM todo_checks
            WHERE date_key IN (${weekKeys.map(() => "?").join(", ")})
          `,
        )
        .all(...weekKeys) as { todo_id: string; date_key: string }[])
    : [];

  const checksByTodo = new Map<string, { dateKey: string }[]>();

  for (const check of checks) {
    const group = checksByTodo.get(check.todo_id) ?? [];
    group.push({ dateKey: check.date_key });
    checksByTodo.set(check.todo_id, group);
  }

  return checksByTodo;
}

function listAllCheckDateKeysByTodo() {
  const db = getDatabase();
  const checks = db.prepare(
    `
      SELECT todo_id, date_key
      FROM todo_checks
      ORDER BY date_key ASC
    `,
  ).all() as { todo_id: string; date_key: string }[];

  const checksByTodo = new Map<string, string[]>();

  for (const check of checks) {
    const group = checksByTodo.get(check.todo_id) ?? [];
    group.push(check.date_key);
    checksByTodo.set(check.todo_id, group);
  }

  return checksByTodo;
}

function mapTodoRow(
  todo: {
    id: string;
    user_id: string;
    title: string;
    is_public: number;
  },
  checksByTodo: Map<string, { dateKey: string }[]>,
  starCountsByTodo: Map<string, number>,
): TodoWithChecksRecord {
  return {
    id: todo.id,
    isContentPublic: Boolean(todo.is_public),
    starCount: starCountsByTodo.get(todo.id) ?? 0,
    title: todo.title,
    userId: todo.user_id,
    checks: checksByTodo.get(todo.id) ?? [],
  };
}

export function listTodosForUser(userId: string, weekKeys: string[]): TodoWithChecksRecord[] {
  const db = getDatabase();
  const todos = db
    .prepare(
      `
        SELECT id, user_id, title, is_public
        FROM todo_items
        WHERE user_id = ? AND completed_at IS NULL
        ORDER BY created_at ASC
      `,
    )
    .all(userId) as {
    id: string;
    user_id: string;
    title: string;
    is_public: number;
  }[];

  const checksByTodo = listChecksByTodo(weekKeys);
  const allChecksByTodo = listAllCheckDateKeysByTodo();
  const starCountsByTodo = countStarsByTodo(allChecksByTodo);

  return todos.map((todo) => mapTodoRow(todo, checksByTodo, starCountsByTodo));
}

export function listBoardTodos(weekKeys: string[]): BoardTodoRecord[] {
  const db = getDatabase();
  const todos = db
    .prepare(
      `
        SELECT
          todo_items.id,
          todo_items.user_id,
          todo_items.title,
          todo_items.is_public,
          users.nickname,
          users.profile_image
        FROM todo_items
        INNER JOIN users ON users.id = todo_items.user_id
        WHERE todo_items.completed_at IS NULL
        ORDER BY users.nickname ASC, todo_items.created_at ASC
      `,
    )
    .all() as {
    id: string;
    user_id: string;
    title: string;
    is_public: number;
    nickname: string;
    profile_image: string | null;
  }[];

  const checksByTodo = listChecksByTodo(weekKeys);
  const allChecksByTodo = listAllCheckDateKeysByTodo();
  const starCountsByTodo = countStarsByTodo(allChecksByTodo);

  return todos.map((todo) => ({
    ...mapTodoRow(todo, checksByTodo, starCountsByTodo),
    user: {
      nickname: todo.nickname,
      profileImage: todo.profile_image,
    },
  }));
}

export function listUserStarTotals() {
  const db = getDatabase();
  const todos = db
    .prepare(
      `
        SELECT id, user_id, completed_at
        FROM todo_items
      `,
    )
    .all() as {
    id: string;
    user_id: string;
    completed_at: string | null;
  }[];

  const allChecksByTodo = listAllCheckDateKeysByTodo();
  const starCountsByTodo = countStarsByTodo(allChecksByTodo);
  const userStarTotals = new Map<string, number>();

  for (const todo of todos) {
    const total =
      (userStarTotals.get(todo.user_id) ?? 0) +
      (starCountsByTodo.get(todo.id) ?? 0) +
      (todo.completed_at ? 1 : 0);

    userStarTotals.set(todo.user_id, total);
  }

  return userStarTotals;
}
