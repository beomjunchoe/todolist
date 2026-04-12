"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  getCurrentUser,
  isAdminUser,
  signOutCurrentSession,
} from "@/lib/auth";
import {
  completeTodoItemForUser,
  createClassEvent as createClassEventRecord,
  createBoardComment as createBoardCommentRecord,
  createBoardPost as createBoardPostRecord,
  createTodoItem,
  deleteClassEvent as deleteClassEventRecord,
  deleteBoardComment,
  deleteBoardPost,
  deleteBoardPosts,
  deleteTodoItemById,
  deleteTodoItemForUser,
  toggleBoardPostLike,
  toggleTodoCheckForUser,
  updateClassEvent as updateClassEventRecord,
  updateBoardComment,
  updateBoardPost,
  updateTodoItemForUser,
} from "@/lib/db";
import {
  deleteBoardAttachment,
  saveBoardAttachment,
} from "@/lib/board-files";
import { getSubjectBySlug } from "@/lib/subjects";

async function requireSignedInUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/");
  }

  return user;
}

async function requireAdminUser() {
  const user = await requireSignedInUser();

  if (!isAdminUser(user)) {
    redirect("/");
  }

  return user;
}

function revalidateTodoPages() {
  revalidatePath("/todo");
}

function revalidateBoardPages(subjectSlug?: string) {
  revalidatePath("/boards");

  if (subjectSlug) {
    revalidatePath(`/boards/${subjectSlug}`);
  }
}

function revalidateCalendarPages() {
  revalidatePath("/calendar");
}

export type CreateBoardPostState = {
  message: string | null;
  status: "error" | "idle" | "success";
};

export async function createTodo(formData: FormData) {
  const user = await requireSignedInUser();
  const title = `${formData.get("title") ?? ""}`.trim();
  const isContentPublic = formData.get("isContentPublic") === "on";

  if (!title) {
    return;
  }

  createTodoItem({
    isContentPublic,
    title: title.slice(0, 80),
    userId: user.id,
  });

  revalidateTodoPages();
}

export async function updateTodo(formData: FormData) {
  const user = await requireSignedInUser();
  const todoId = `${formData.get("todoId") ?? ""}`;
  const title = `${formData.get("title") ?? ""}`.trim();
  const isContentPublic = formData.get("isContentPublic") === "on";

  if (!todoId || !title) {
    return;
  }

  updateTodoItemForUser({
    isContentPublic,
    title: title.slice(0, 80),
    todoId,
    userId: user.id,
  });

  revalidateTodoPages();
}

export async function deleteTodo(formData: FormData) {
  const user = await requireSignedInUser();
  const todoId = `${formData.get("todoId") ?? ""}`;

  if (!todoId) {
    return;
  }

  deleteTodoItemForUser(user.id, todoId);
  revalidateTodoPages();
}

export async function completeTodo(formData: FormData) {
  const user = await requireSignedInUser();
  const todoId = `${formData.get("todoId") ?? ""}`;

  if (!todoId) {
    return;
  }

  completeTodoItemForUser(user.id, todoId);
  revalidateTodoPages();
}

export async function deleteTodoAsAdmin(formData: FormData) {
  await requireAdminUser();
  const todoId = `${formData.get("todoId") ?? ""}`;

  if (!todoId) {
    return;
  }

  deleteTodoItemById(todoId);
  revalidateTodoPages();
}

export async function toggleTodoCheck(formData: FormData) {
  const user = await requireSignedInUser();
  const todoId = `${formData.get("todoId") ?? ""}`;
  const dateKey = `${formData.get("dateKey") ?? ""}`;

  if (!todoId || !/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
    return;
  }

  toggleTodoCheckForUser(user.id, todoId, dateKey);
  revalidateTodoPages();
}

export async function createBoardPost(
  _prevState: CreateBoardPostState,
  formData: FormData,
): Promise<CreateBoardPostState> {
  const user = await requireSignedInUser();
  const subjectSlug = `${formData.get("subjectSlug") ?? ""}`.trim();
  const submissionKey = `${formData.get("submissionKey") ?? ""}`.trim();
  const title = `${formData.get("title") ?? ""}`.trim();
  const content = `${formData.get("content") ?? ""}`.trim();
  const isNotice = formData.get("isNotice") === "on" && isAdminUser(user);
  const attachmentValue = formData.get("attachment");

  if (!submissionKey || !getSubjectBySlug(subjectSlug) || !title || !content) {
    return {
      message: "제목과 내용을 확인한 뒤 다시 올려 주세요.",
      status: "error",
    };
  }

  let attachment: Awaited<ReturnType<typeof saveBoardAttachment>> = null;

  try {
    attachment =
      attachmentValue instanceof File && attachmentValue.size > 0
        ? await saveBoardAttachment(attachmentValue)
        : null;

    const result = createBoardPostRecord({
      attachment,
      content: content.slice(0, 4000),
      isNotice,
      subjectSlug,
      submissionKey,
      title: title.slice(0, 100),
      userId: user.id,
    });

    if (result.status === "duplicate" && attachment) {
      await deleteBoardAttachment(attachment.filePath);
    }

    revalidateBoardPages(subjectSlug);

    return {
      message:
        result.status === "duplicate"
          ? "같은 업로드 요청이 이미 처리되어 중복 저장하지 않았습니다."
          : "게시글을 올렸습니다.",
      status: "success",
    };
  } catch (error) {
    if (attachment) {
      await deleteBoardAttachment(attachment.filePath);
    }

    return {
      message:
        error instanceof Error
          ? error.message
          : "게시글을 올리지 못했습니다. 다시 시도해 주세요.",
      status: "error",
    };
  }
}

export async function updateBoardPostAction(formData: FormData) {
  const user = await requireSignedInUser();
  const postId = `${formData.get("postId") ?? ""}`.trim();
  const subjectSlug = `${formData.get("subjectSlug") ?? ""}`.trim();
  const title = `${formData.get("title") ?? ""}`.trim();
  const content = `${formData.get("content") ?? ""}`.trim();
  const removeAttachment = formData.get("removeAttachment") === "on";
  const isNotice = formData.get("isNotice") === "on";
  const attachmentValue = formData.get("attachment");

  if (!postId || !getSubjectBySlug(subjectSlug) || !title || !content) {
    return;
  }

  const nextAttachment =
    attachmentValue instanceof File && attachmentValue.size > 0
      ? await saveBoardAttachment(attachmentValue)
      : null;

  const result = updateBoardPost({
    actorUserId: user.id,
    attachment: nextAttachment,
    content: content.slice(0, 4000),
    isAdmin: isAdminUser(user),
    isNotice,
    postId,
    removeAttachment,
    title: title.slice(0, 100),
  });

  if (!result && nextAttachment) {
    await deleteBoardAttachment(nextAttachment.filePath);
    return;
  }

  if (result?.shouldDeletePreviousAttachment) {
    await deleteBoardAttachment(result.previousAttachmentPath);
  }

  revalidateBoardPages(subjectSlug);
}

export async function deleteBoardPostAction(formData: FormData) {
  const user = await requireSignedInUser();
  const postId = `${formData.get("postId") ?? ""}`.trim();
  const subjectSlug = `${formData.get("subjectSlug") ?? ""}`.trim();

  if (!postId || !getSubjectBySlug(subjectSlug)) {
    return;
  }

  const result = deleteBoardPost({
    actorUserId: user.id,
    isAdmin: isAdminUser(user),
    postId,
  });

  if (result?.attachmentPath) {
    await deleteBoardAttachment(result.attachmentPath);
  }

  revalidateBoardPages(subjectSlug);
}

export async function deleteBoardPostsAction(formData: FormData) {
  const user = await requireSignedInUser();
  const subjectSlug = `${formData.get("subjectSlug") ?? ""}`.trim();
  const postIds = formData
    .getAll("postIds")
    .map((value) => `${value ?? ""}`.trim())
    .filter(Boolean);

  if (!getSubjectBySlug(subjectSlug) || postIds.length === 0) {
    return;
  }

  const deletedPosts = deleteBoardPosts({
    actorUserId: user.id,
    isAdmin: isAdminUser(user),
    postIds,
    subjectSlug,
  });

  await Promise.all(
    deletedPosts
      .map((post) => post.attachmentPath)
      .filter((path): path is string => Boolean(path))
      .map((path) => deleteBoardAttachment(path)),
  );

  revalidateBoardPages(subjectSlug);
}

export async function toggleBoardLikeAction(formData: FormData) {
  const user = await requireSignedInUser();
  const postId = `${formData.get("postId") ?? ""}`.trim();
  const subjectSlug = `${formData.get("subjectSlug") ?? ""}`.trim();

  if (!postId || !getSubjectBySlug(subjectSlug)) {
    return;
  }

  toggleBoardPostLike(user.id, postId);
  revalidateBoardPages(subjectSlug);
}

export async function createBoardComment(formData: FormData) {
  const user = await requireSignedInUser();
  const postId = `${formData.get("postId") ?? ""}`.trim();
  const subjectSlug = `${formData.get("subjectSlug") ?? ""}`.trim();
  const content = `${formData.get("content") ?? ""}`.trim();

  if (!postId || !getSubjectBySlug(subjectSlug) || !content) {
    return;
  }

  createBoardCommentRecord({
    content: content.slice(0, 2000),
    postId,
    userId: user.id,
  });

  revalidateBoardPages(subjectSlug);
}

export async function updateBoardCommentAction(formData: FormData) {
  const user = await requireSignedInUser();
  const commentId = `${formData.get("commentId") ?? ""}`.trim();
  const subjectSlug = `${formData.get("subjectSlug") ?? ""}`.trim();
  const content = `${formData.get("content") ?? ""}`.trim();

  if (!commentId || !getSubjectBySlug(subjectSlug) || !content) {
    return;
  }

  updateBoardComment({
    actorUserId: user.id,
    commentId,
    content: content.slice(0, 2000),
    isAdmin: isAdminUser(user),
  });

  revalidateBoardPages(subjectSlug);
}

export async function deleteBoardCommentAction(formData: FormData) {
  const user = await requireSignedInUser();
  const commentId = `${formData.get("commentId") ?? ""}`.trim();
  const subjectSlug = `${formData.get("subjectSlug") ?? ""}`.trim();

  if (!commentId || !getSubjectBySlug(subjectSlug)) {
    return;
  }

  deleteBoardComment({
    actorUserId: user.id,
    commentId,
    isAdmin: isAdminUser(user),
  });

  revalidateBoardPages(subjectSlug);
}

function normalizeDateKey(value: FormDataEntryValue | null) {
  const dateKey = `${value ?? ""}`.trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(dateKey) ? dateKey : "";
}

function normalizeImportance(value: FormDataEntryValue | null) {
  const importance = `${value ?? ""}`.trim();
  return importance === "high" || importance === "low" ? importance : "medium";
}

export async function createClassEventAction(formData: FormData) {
  const user = await requireSignedInUser();
  const title = `${formData.get("title") ?? ""}`.trim();
  const description = `${formData.get("description") ?? ""}`.trim();
  const category = `${formData.get("category") ?? ""}`.trim() || "기타";
  const importance = normalizeImportance(formData.get("importance"));
  const subjectSlug = `${formData.get("subjectSlug") ?? ""}`.trim() || null;
  const startsOn = normalizeDateKey(formData.get("startsOn"));
  const endsOn = normalizeDateKey(formData.get("endsOn")) || null;

  if (!title || !description || !startsOn) {
    return;
  }

  createClassEventRecord({
    category: category.slice(0, 20),
    description: description.slice(0, 2000),
    endsOn: endsOn && endsOn >= startsOn ? endsOn : null,
    importance,
    startsOn,
    subjectSlug,
    title: title.slice(0, 100),
    userId: user.id,
  });

  revalidateCalendarPages();
}

export async function updateClassEventAction(formData: FormData) {
  const user = await requireSignedInUser();
  const eventId = `${formData.get("eventId") ?? ""}`.trim();
  const title = `${formData.get("title") ?? ""}`.trim();
  const description = `${formData.get("description") ?? ""}`.trim();
  const category = `${formData.get("category") ?? ""}`.trim() || "기타";
  const importance = normalizeImportance(formData.get("importance"));
  const subjectSlug = `${formData.get("subjectSlug") ?? ""}`.trim() || null;
  const startsOn = normalizeDateKey(formData.get("startsOn"));
  const endsOn = normalizeDateKey(formData.get("endsOn")) || null;

  if (!eventId || !title || !description || !startsOn) {
    return;
  }

  updateClassEventRecord({
    actorUserId: user.id,
    category: category.slice(0, 20),
    description: description.slice(0, 2000),
    endsOn: endsOn && endsOn >= startsOn ? endsOn : null,
    eventId,
    importance,
    isAdmin: isAdminUser(user),
    startsOn,
    subjectSlug,
    title: title.slice(0, 100),
  });

  revalidateCalendarPages();
}

export async function deleteClassEventAction(formData: FormData) {
  const user = await requireSignedInUser();
  const eventId = `${formData.get("eventId") ?? ""}`.trim();

  if (!eventId) {
    return;
  }

  deleteClassEventRecord({
    actorUserId: user.id,
    eventId,
    isAdmin: isAdminUser(user),
  });

  revalidateCalendarPages();
}

export async function signOut() {
  await signOutCurrentSession();
  redirect("/");
}
