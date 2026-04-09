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
  createBoardComment as createBoardCommentRecord,
  createBoardPost as createBoardPostRecord,
  createTodoItem,
  deleteBoardComment,
  deleteBoardPost,
  deleteTodoItemById,
  deleteTodoItemForUser,
  toggleBoardPostLike,
  toggleTodoCheckForUser,
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

export async function createBoardPost(formData: FormData) {
  const user = await requireSignedInUser();
  const subjectSlug = `${formData.get("subjectSlug") ?? ""}`.trim();
  const title = `${formData.get("title") ?? ""}`.trim();
  const content = `${formData.get("content") ?? ""}`.trim();
  const isNotice = formData.get("isNotice") === "on" && isAdminUser(user);
  const attachmentValue = formData.get("attachment");

  if (!getSubjectBySlug(subjectSlug) || !title || !content) {
    return;
  }

  const attachment =
    attachmentValue instanceof File && attachmentValue.size > 0
      ? await saveBoardAttachment(attachmentValue)
      : null;

  createBoardPostRecord({
    attachment,
    content: content.slice(0, 4000),
    isNotice,
    subjectSlug,
    title: title.slice(0, 100),
    userId: user.id,
  });

  revalidateBoardPages(subjectSlug);
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

export async function signOut() {
  await signOutCurrentSession();
  redirect("/");
}
