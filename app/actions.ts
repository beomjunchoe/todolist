"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentUser, isAdminUser, signOutCurrentSession } from "@/lib/auth";
import {
  completeTodoItemForUser,
  createTodoItem,
  deleteTodoItemById,
  deleteTodoItemForUser,
  toggleTodoCheckForUser,
  updateTodoItemForUser,
} from "@/lib/db";

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

  revalidatePath("/");
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

  revalidatePath("/");
}

export async function deleteTodo(formData: FormData) {
  const user = await requireSignedInUser();
  const todoId = `${formData.get("todoId") ?? ""}`;

  if (!todoId) {
    return;
  }

  deleteTodoItemForUser(user.id, todoId);
  revalidatePath("/");
}

export async function completeTodo(formData: FormData) {
  const user = await requireSignedInUser();
  const todoId = `${formData.get("todoId") ?? ""}`;

  if (!todoId) {
    return;
  }

  completeTodoItemForUser(user.id, todoId);
  revalidatePath("/");
}

export async function deleteTodoAsAdmin(formData: FormData) {
  await requireAdminUser();
  const todoId = `${formData.get("todoId") ?? ""}`;

  if (!todoId) {
    return;
  }

  deleteTodoItemById(todoId);
  revalidatePath("/");
}

export async function toggleTodoCheck(formData: FormData) {
  const user = await requireSignedInUser();
  const todoId = `${formData.get("todoId") ?? ""}`;
  const dateKey = `${formData.get("dateKey") ?? ""}`;

  if (!todoId || !/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
    return;
  }

  toggleTodoCheckForUser(user.id, todoId, dateKey);
  revalidatePath("/");
}

export async function signOut() {
  await signOutCurrentSession();
  redirect("/");
}
