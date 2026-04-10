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

export type BoardAttachmentRecord = {
  fileName: string;
  fileSize: number;
  mimeType: string;
  postId: string;
};

export type BoardCommentRecord = {
  id: string;
  content: string;
  createdAt: string;
  postId: string;
  updatedAt: string;
  user: Pick<DbUser, "id" | "nickname">;
};

export type BoardPostRecord = {
  id: string;
  attachment: BoardAttachmentRecord | null;
  content: string;
  createdAt: string;
  isLikedByCurrentUser: boolean;
  isNotice: boolean;
  likeCount: number;
  subjectSlug: string;
  title: string;
  updatedAt: string;
  user: Pick<DbUser, "id" | "nickname">;
  comments: BoardCommentRecord[];
};

export type ClassEventRecord = {
  id: string;
  title: string;
  description: string;
  category: string;
  importance: "high" | "medium" | "low";
  subjectSlug: string | null;
  startsOn: string;
  endsOn: string | null;
  createdAt: string;
  updatedAt: string;
  user: Pick<DbUser, "id" | "nickname">;
};

type BoardPostPermissionRecord = {
  attachmentPath: string | null;
  id: string;
  isNotice: boolean;
  subjectSlug: string;
  userId: string;
};

type BoardCommentPermissionRecord = {
  id: string;
  postId: string;
  postSubjectSlug: string;
  userId: string;
};

type ClassEventPermissionRecord = {
  id: string;
  userId: string;
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

export function getBoardUploadsDirectory() {
  return path.join(path.dirname(resolveDatabasePath()), "board_uploads");
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
  fs.mkdirSync(getBoardUploadsDirectory(), { recursive: true });

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

    CREATE TABLE IF NOT EXISTS board_posts (
      id TEXT PRIMARY KEY,
      subject_slug TEXT NOT NULL,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      is_notice INTEGER NOT NULL DEFAULT 0,
      attachment_name TEXT,
      attachment_path TEXT,
      attachment_mime TEXT,
      attachment_size INTEGER,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS board_comments (
      id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (post_id) REFERENCES board_posts(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS board_post_submissions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      subject_slug TEXT NOT NULL,
      submission_key TEXT NOT NULL,
      post_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE (user_id, submission_key),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (post_id) REFERENCES board_posts(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS board_post_likes (
      id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE (post_id, user_id),
      FOREIGN KEY (post_id) REFERENCES board_posts(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS class_events (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      importance TEXT NOT NULL DEFAULT 'medium',
      subject_slug TEXT,
      starts_on TEXT NOT NULL,
      ends_on TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_todo_items_user_id_created_at ON todo_items(user_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_todo_checks_date_key ON todo_checks(date_key);
    CREATE INDEX IF NOT EXISTS idx_board_posts_subject_created_at ON board_posts(subject_slug, is_notice DESC, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_board_comments_post_created_at ON board_comments(post_id, created_at ASC);
    CREATE INDEX IF NOT EXISTS idx_board_post_likes_post_id ON board_post_likes(post_id);
    CREATE INDEX IF NOT EXISTS idx_class_events_starts_on ON class_events(starts_on, updated_at DESC);
    CREATE INDEX IF NOT EXISTS idx_class_events_subject_slug ON class_events(subject_slug, starts_on);
  `);

  const todoItemColumns = db
    .prepare("PRAGMA table_info(todo_items)")
    .all() as { name: string }[];

  if (!todoItemColumns.some((column) => column.name === "completed_at")) {
    db.exec("ALTER TABLE todo_items ADD COLUMN completed_at TEXT");
  }

  const boardPostColumns = db
    .prepare("PRAGMA table_info(board_posts)")
    .all() as { name: string }[];

  if (!boardPostColumns.some((column) => column.name === "is_notice")) {
    db.exec("ALTER TABLE board_posts ADD COLUMN is_notice INTEGER NOT NULL DEFAULT 0");
  }
  if (!boardPostColumns.some((column) => column.name === "attachment_name")) {
    db.exec("ALTER TABLE board_posts ADD COLUMN attachment_name TEXT");
  }
  if (!boardPostColumns.some((column) => column.name === "attachment_path")) {
    db.exec("ALTER TABLE board_posts ADD COLUMN attachment_path TEXT");
  }
  if (!boardPostColumns.some((column) => column.name === "attachment_mime")) {
    db.exec("ALTER TABLE board_posts ADD COLUMN attachment_mime TEXT");
  }
  if (!boardPostColumns.some((column) => column.name === "attachment_size")) {
    db.exec("ALTER TABLE board_posts ADD COLUMN attachment_size INTEGER");
  }

  const classEventColumns = db
    .prepare("PRAGMA table_info(class_events)")
    .all() as { name: string }[];

  if (!classEventColumns.some((column) => column.name === "importance")) {
    db.exec("ALTER TABLE class_events ADD COLUMN importance TEXT NOT NULL DEFAULT 'medium'");
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

export function toggleTodoCheckForUser(
  userId: string,
  todoId: string,
  dateKey: string,
) {
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

export function createBoardPost(input: {
  userId: string;
  subjectSlug: string;
  submissionKey: string;
  title: string;
  content: string;
  isNotice: boolean;
  attachment?: {
    fileName: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
  } | null;
}) {
  const db = getDatabase();
  const now = new Date().toISOString();
  const postId = randomUUID();

  const insertBoardPost = db.transaction(() => {
    db.prepare(
      `
        INSERT INTO board_posts (
          id,
          subject_slug,
          user_id,
          title,
          content,
          is_notice,
          attachment_name,
          attachment_path,
          attachment_mime,
          attachment_size,
          created_at,
          updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
    ).run(
      postId,
      input.subjectSlug,
      input.userId,
      input.title,
      input.content,
      input.isNotice ? 1 : 0,
      input.attachment?.fileName ?? null,
      input.attachment?.filePath ?? null,
      input.attachment?.mimeType ?? null,
      input.attachment?.fileSize ?? null,
      now,
      now,
    );

    db.prepare(
      `
        INSERT INTO board_post_submissions (
          id,
          user_id,
          subject_slug,
          submission_key,
          post_id,
          created_at
        )
        VALUES (?, ?, ?, ?, ?, ?)
      `,
    ).run(
      randomUUID(),
      input.userId,
      input.subjectSlug,
      input.submissionKey,
      postId,
      now,
    );
  });

  try {
    insertBoardPost();

    return {
      postId,
      status: "created" as const,
    };
  } catch (error) {
    const sqliteError = error as { code?: string };

    if (sqliteError.code?.startsWith("SQLITE_CONSTRAINT")) {
      const existingSubmission = db
        .prepare(
          `
            SELECT post_id
            FROM board_post_submissions
            WHERE user_id = ? AND submission_key = ?
          `,
        )
        .get(input.userId, input.submissionKey) as
        | {
            post_id: string;
          }
        | undefined;

      if (existingSubmission) {
        return {
          postId: existingSubmission.post_id,
          status: "duplicate" as const,
        };
      }
    }

    throw error;
  }
}

function getBoardPostPermissionRecord(postId: string) {
  const db = getDatabase();

  return db
    .prepare(
      `
        SELECT id, user_id, subject_slug, is_notice, attachment_path
        FROM board_posts
        WHERE id = ?
      `,
    )
    .get(postId) as BoardPostPermissionRecord | undefined;
}

export function updateBoardPost(input: {
  actorUserId: string;
  postId: string;
  title: string;
  content: string;
  isAdmin: boolean;
  isNotice: boolean;
  removeAttachment: boolean;
  attachment?: {
    fileName: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
  } | null;
}) {
  const db = getDatabase();
  const post = getBoardPostPermissionRecord(input.postId);

  if (!post) {
    return null;
  }

  if (!input.isAdmin && post.userId !== input.actorUserId) {
    return null;
  }

  const nextAttachmentName =
    input.attachment?.fileName ??
    (input.removeAttachment ? null : getBoardAttachmentById(post.id)?.fileName ?? null);
  const nextAttachmentPath =
    input.attachment?.filePath ??
    (input.removeAttachment ? null : post.attachmentPath);
  const currentAttachment = getBoardAttachmentById(post.id);
  const nextAttachmentMime =
    input.attachment?.mimeType ??
    (input.removeAttachment ? null : currentAttachment?.mimeType ?? null);
  const nextAttachmentSize =
    input.attachment?.fileSize ??
    (input.removeAttachment ? null : currentAttachment?.fileSize ?? null);

  db.prepare(
    `
      UPDATE board_posts
      SET
        title = ?,
        content = ?,
        is_notice = ?,
        attachment_name = ?,
        attachment_path = ?,
        attachment_mime = ?,
        attachment_size = ?,
        updated_at = ?
      WHERE id = ?
    `,
  ).run(
    input.title,
    input.content,
    input.isAdmin && input.isNotice ? 1 : 0,
    nextAttachmentName,
    nextAttachmentPath,
    nextAttachmentMime,
    nextAttachmentSize,
    new Date().toISOString(),
    post.id,
  );

  return {
    previousAttachmentPath: post.attachmentPath,
    subjectSlug: post.subjectSlug,
    shouldDeletePreviousAttachment:
      Boolean(post.attachmentPath) &&
      (Boolean(input.attachment) || input.removeAttachment),
  };
}

export function deleteBoardPost(input: {
  actorUserId: string;
  isAdmin: boolean;
  postId: string;
}) {
  const db = getDatabase();
  const post = getBoardPostPermissionRecord(input.postId);

  if (!post) {
    return null;
  }

  if (!input.isAdmin && post.userId !== input.actorUserId) {
    return null;
  }

  db.prepare("DELETE FROM board_posts WHERE id = ?").run(post.id);

  return {
    attachmentPath: post.attachmentPath,
    subjectSlug: post.subjectSlug,
  };
}

export function deleteBoardPosts(input: {
  actorUserId: string;
  isAdmin: boolean;
  postIds: string[];
  subjectSlug: string;
}) {
  const db = getDatabase();
  const uniquePostIds = [...new Set(input.postIds.filter(Boolean))];

  if (uniquePostIds.length === 0) {
    return [];
  }

  const posts = db
    .prepare(
      `
        SELECT id, user_id, subject_slug, attachment_path
        FROM board_posts
        WHERE subject_slug = ?
          AND id IN (${uniquePostIds.map(() => "?").join(", ")})
      `,
    )
    .all(input.subjectSlug, ...uniquePostIds) as Array<{
    attachment_path: string | null;
    id: string;
    subject_slug: string;
    user_id: string;
  }>;

  const deletablePosts = input.isAdmin
    ? posts
    : posts.filter((post) => post.user_id === input.actorUserId);

  if (deletablePosts.length === 0) {
    return [];
  }

  db.prepare(
    `
      DELETE FROM board_posts
      WHERE id IN (${deletablePosts.map(() => "?").join(", ")})
    `,
  ).run(...deletablePosts.map((post) => post.id));

  return deletablePosts.map((post) => ({
    attachmentPath: post.attachment_path,
    postId: post.id,
    subjectSlug: post.subject_slug,
  }));
}

export function createBoardComment(input: {
  userId: string;
  postId: string;
  content: string;
}) {
  const db = getDatabase();
  const now = new Date().toISOString();

  const post = db
    .prepare(
      `
        SELECT id
        FROM board_posts
        WHERE id = ?
      `,
    )
    .get(input.postId) as { id: string } | undefined;

  if (!post) {
    return;
  }

  db.prepare(
    `
      INSERT INTO board_comments (id, post_id, user_id, content, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
  ).run(randomUUID(), input.postId, input.userId, input.content, now, now);
}

function getBoardCommentPermissionRecord(commentId: string) {
  const db = getDatabase();

  return db
    .prepare(
      `
        SELECT
          board_comments.id,
          board_comments.post_id,
          board_comments.user_id,
          board_posts.subject_slug AS post_subject_slug
        FROM board_comments
        INNER JOIN board_posts ON board_posts.id = board_comments.post_id
        WHERE board_comments.id = ?
      `,
    )
    .get(commentId) as BoardCommentPermissionRecord | undefined;
}

export function updateBoardComment(input: {
  actorUserId: string;
  commentId: string;
  content: string;
  isAdmin: boolean;
}) {
  const db = getDatabase();
  const comment = getBoardCommentPermissionRecord(input.commentId);

  if (!comment) {
    return null;
  }

  if (!input.isAdmin && comment.userId !== input.actorUserId) {
    return null;
  }

  db.prepare(
    `
      UPDATE board_comments
      SET content = ?, updated_at = ?
      WHERE id = ?
    `,
  ).run(input.content, new Date().toISOString(), comment.id);

  return {
    postId: comment.postId,
    subjectSlug: comment.postSubjectSlug,
  };
}

export function deleteBoardComment(input: {
  actorUserId: string;
  commentId: string;
  isAdmin: boolean;
}) {
  const db = getDatabase();
  const comment = getBoardCommentPermissionRecord(input.commentId);

  if (!comment) {
    return null;
  }

  if (!input.isAdmin && comment.userId !== input.actorUserId) {
    return null;
  }

  db.prepare("DELETE FROM board_comments WHERE id = ?").run(comment.id);

  return {
    postId: comment.postId,
    subjectSlug: comment.postSubjectSlug,
  };
}

export function toggleBoardPostLike(userId: string, postId: string) {
  const db = getDatabase();
  const post = db
    .prepare(
      `
        SELECT id
        FROM board_posts
        WHERE id = ?
      `,
    )
    .get(postId) as { id: string } | undefined;

  if (!post) {
    return;
  }

  const existing = db
    .prepare(
      `
        SELECT id
        FROM board_post_likes
        WHERE post_id = ? AND user_id = ?
      `,
    )
    .get(postId, userId) as { id: string } | undefined;

  if (existing) {
    db.prepare("DELETE FROM board_post_likes WHERE id = ?").run(existing.id);
    return;
  }

  db.prepare(
    `
      INSERT INTO board_post_likes (id, post_id, user_id, created_at)
      VALUES (?, ?, ?, ?)
    `,
  ).run(randomUUID(), postId, userId, new Date().toISOString());
}

export function createClassEvent(input: {
  userId: string;
  title: string;
  description: string;
  category: string;
  importance: "high" | "medium" | "low";
  subjectSlug?: string | null;
  startsOn: string;
  endsOn?: string | null;
}) {
  const db = getDatabase();
  const now = new Date().toISOString();

  db.prepare(
    `
      INSERT INTO class_events (
        id,
        user_id,
        title,
        description,
        category,
        importance,
        subject_slug,
        starts_on,
        ends_on,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
  ).run(
    randomUUID(),
    input.userId,
    input.title,
    input.description,
    input.category,
    input.importance,
    input.subjectSlug ?? null,
    input.startsOn,
    input.endsOn ?? null,
    now,
    now,
  );
}

function getClassEventPermissionRecord(eventId: string) {
  const db = getDatabase();

  return db
    .prepare(
      `
        SELECT id, user_id
        FROM class_events
        WHERE id = ?
      `,
    )
    .get(eventId) as ClassEventPermissionRecord | undefined;
}

export function updateClassEvent(input: {
  actorUserId: string;
  eventId: string;
  title: string;
  description: string;
  category: string;
  importance: "high" | "medium" | "low";
  subjectSlug?: string | null;
  startsOn: string;
  endsOn?: string | null;
  isAdmin: boolean;
}) {
  const db = getDatabase();
  const event = getClassEventPermissionRecord(input.eventId);

  if (!event) {
    return null;
  }

  if (!input.isAdmin && event.userId !== input.actorUserId) {
    return null;
  }

  db.prepare(
    `
      UPDATE class_events
      SET
        title = ?,
        description = ?,
        category = ?,
        importance = ?,
        subject_slug = ?,
        starts_on = ?,
        ends_on = ?,
        updated_at = ?
      WHERE id = ?
    `,
  ).run(
    input.title,
    input.description,
    input.category,
    input.importance,
    input.subjectSlug ?? null,
    input.startsOn,
    input.endsOn ?? null,
    new Date().toISOString(),
    event.id,
  );

  return event;
}

export function deleteClassEvent(input: {
  actorUserId: string;
  eventId: string;
  isAdmin: boolean;
}) {
  const db = getDatabase();
  const event = getClassEventPermissionRecord(input.eventId);

  if (!event) {
    return null;
  }

  if (!input.isAdmin && event.userId !== input.actorUserId) {
    return null;
  }

  db.prepare("DELETE FROM class_events WHERE id = ?").run(event.id);
  return event;
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

export function listTodosForUser(
  userId: string,
  weekKeys: string[],
): TodoWithChecksRecord[] {
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

export function listClassEventsInRange(
  startDateKey: string,
  endDateKey: string,
): ClassEventRecord[] {
  const db = getDatabase();
  const rows = db
    .prepare(
      `
        SELECT
          class_events.id,
          class_events.title,
          class_events.description,
          class_events.category,
          class_events.importance,
          class_events.subject_slug,
          class_events.starts_on,
          class_events.ends_on,
          class_events.created_at,
          class_events.updated_at,
          users.id AS user_id,
          users.nickname
        FROM class_events
        INNER JOIN users ON users.id = class_events.user_id
        WHERE class_events.starts_on <= ?
          AND COALESCE(class_events.ends_on, class_events.starts_on) >= ?
        ORDER BY
          class_events.starts_on ASC,
          CASE class_events.importance
            WHEN 'high' THEN 0
            WHEN 'medium' THEN 1
            ELSE 2
          END ASC,
          class_events.updated_at DESC
      `,
    )
    .all(endDateKey, startDateKey) as {
    id: string;
    title: string;
    description: string;
    category: string;
    importance: "high" | "medium" | "low";
    subject_slug: string | null;
    starts_on: string;
    ends_on: string | null;
    created_at: string;
    updated_at: string;
    user_id: string;
    nickname: string;
  }[];

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    importance: row.importance,
    subjectSlug: row.subject_slug,
    startsOn: row.starts_on,
    endsOn: row.ends_on,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    user: {
      id: row.user_id,
      nickname: row.nickname,
    },
  }));
}

export function listUpcomingClassEvents(
  startDateKey: string,
  limit = 10,
): ClassEventRecord[] {
  const db = getDatabase();
  const rows = db
    .prepare(
      `
        SELECT
          class_events.id,
          class_events.title,
          class_events.description,
          class_events.category,
          class_events.importance,
          class_events.subject_slug,
          class_events.starts_on,
          class_events.ends_on,
          class_events.created_at,
          class_events.updated_at,
          users.id AS user_id,
          users.nickname
        FROM class_events
        INNER JOIN users ON users.id = class_events.user_id
        WHERE COALESCE(class_events.ends_on, class_events.starts_on) >= ?
        ORDER BY
          class_events.starts_on ASC,
          CASE class_events.importance
            WHEN 'high' THEN 0
            WHEN 'medium' THEN 1
            ELSE 2
          END ASC,
          class_events.updated_at DESC
        LIMIT ?
      `,
    )
    .all(startDateKey, limit) as {
    id: string;
    title: string;
    description: string;
    category: string;
    importance: "high" | "medium" | "low";
    subject_slug: string | null;
    starts_on: string;
    ends_on: string | null;
    created_at: string;
    updated_at: string;
    user_id: string;
    nickname: string;
  }[];

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    importance: row.importance,
    subjectSlug: row.subject_slug,
    startsOn: row.starts_on,
    endsOn: row.ends_on,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    user: {
      id: row.user_id,
      nickname: row.nickname,
    },
  }));
}

export function listBoardPostsBySubject(
  subjectSlug: string,
  currentUserId?: string | null,
  options?: {
    noticeOnly?: boolean;
    search?: string;
  },
): BoardPostRecord[] {
  const db = getDatabase();
  const whereClauses = ["board_posts.subject_slug = ?"];
  const params: (string | number)[] = [subjectSlug];

  if (options?.noticeOnly) {
    whereClauses.push("board_posts.is_notice = 1");
  }

  if (options?.search) {
    whereClauses.push("(board_posts.title LIKE ? OR board_posts.content LIKE ?)");
    const pattern = `%${options.search}%`;
    params.push(pattern, pattern);
  }

  const posts = db
    .prepare(
      `
        SELECT
          board_posts.id,
          board_posts.subject_slug,
          board_posts.title,
          board_posts.content,
          board_posts.is_notice,
          board_posts.attachment_name,
          board_posts.attachment_mime,
          board_posts.attachment_size,
          board_posts.created_at,
          board_posts.updated_at,
          users.id AS user_id,
          users.nickname
        FROM board_posts
        INNER JOIN users ON users.id = board_posts.user_id
        WHERE ${whereClauses.join(" AND ")}
        ORDER BY board_posts.is_notice DESC, board_posts.created_at DESC
      `,
    )
    .all(...params) as {
    id: string;
    subject_slug: string;
    title: string;
    content: string;
    is_notice: number;
    attachment_name: string | null;
    attachment_mime: string | null;
    attachment_size: number | null;
    created_at: string;
    updated_at: string;
    user_id: string;
    nickname: string;
  }[];

  if (posts.length === 0) {
    return [];
  }

  const postIds = posts.map((post) => post.id);
  const comments = db
    .prepare(
      `
        SELECT
          board_comments.id,
          board_comments.post_id,
          board_comments.content,
          board_comments.created_at,
          board_comments.updated_at,
          users.id AS user_id,
          users.nickname
        FROM board_comments
        INNER JOIN users ON users.id = board_comments.user_id
        WHERE board_comments.post_id IN (${postIds.map(() => "?").join(", ")})
        ORDER BY board_comments.created_at ASC
      `,
    )
    .all(...postIds) as {
    id: string;
    post_id: string;
    content: string;
    created_at: string;
    updated_at: string;
    user_id: string;
    nickname: string;
  }[];

  const likes = db
    .prepare(
      `
        SELECT post_id, user_id
        FROM board_post_likes
        WHERE post_id IN (${postIds.map(() => "?").join(", ")})
      `,
    )
    .all(...postIds) as {
    post_id: string;
    user_id: string;
  }[];

  const commentsByPostId = new Map<string, BoardCommentRecord[]>();
  for (const comment of comments) {
    const group = commentsByPostId.get(comment.post_id) ?? [];
    group.push({
      id: comment.id,
      content: comment.content,
      createdAt: comment.created_at,
      postId: comment.post_id,
      updatedAt: comment.updated_at,
      user: {
        id: comment.user_id,
        nickname: comment.nickname,
      },
    });
    commentsByPostId.set(comment.post_id, group);
  }

  const likeCounts = new Map<string, number>();
  const likedPostIds = new Set<string>();
  for (const like of likes) {
    likeCounts.set(like.post_id, (likeCounts.get(like.post_id) ?? 0) + 1);
    if (currentUserId && like.user_id === currentUserId) {
      likedPostIds.add(like.post_id);
    }
  }

  return posts.map((post) => ({
    id: post.id,
    attachment: post.attachment_name
      ? {
          fileName: post.attachment_name,
          fileSize: post.attachment_size ?? 0,
          mimeType: post.attachment_mime ?? "application/octet-stream",
          postId: post.id,
        }
      : null,
    comments: commentsByPostId.get(post.id) ?? [],
    content: post.content,
    createdAt: post.created_at,
    isLikedByCurrentUser: likedPostIds.has(post.id),
    isNotice: Boolean(post.is_notice),
    likeCount: likeCounts.get(post.id) ?? 0,
    subjectSlug: post.subject_slug,
    title: post.title,
    updatedAt: post.updated_at,
    user: {
      id: post.user_id,
      nickname: post.nickname,
    },
  }));
}

export function getBoardAttachmentById(postId: string) {
  const db = getDatabase();
  const row = db
    .prepare(
      `
        SELECT id, attachment_name, attachment_path, attachment_mime, attachment_size
        FROM board_posts
        WHERE id = ? AND attachment_path IS NOT NULL
      `,
    )
    .get(postId) as
    | {
        id: string;
        attachment_name: string;
        attachment_path: string;
        attachment_mime: string | null;
        attachment_size: number | null;
      }
    | undefined;

  if (!row) {
    return null;
  }

  return {
    fileName: row.attachment_name,
    filePath: row.attachment_path,
    fileSize: row.attachment_size ?? 0,
    mimeType: row.attachment_mime ?? "application/octet-stream",
    postId: row.id,
  };
}
