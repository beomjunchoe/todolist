"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentUser, signOutCurrentSession } from "@/lib/auth";
import {
  createTodoItem,
  toggleTodoCheckForUser,
  toggleTodoVisibilityForUser,
} from "@/lib/db";

async function requireSignedInUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/");
  }

  return user;
}

export async function createTodo(formData: FormData) {
  const user = await requireSignedInUser();
  const title = `${formData.get("title") ?? ""}`.trim();
  const isPublic = formData.get("isPublic") === "on";

  if (!title) {
    return;
  }

  createTodoItem({
    isPublic,
    title: title.slice(0, 80),
    userId: user.id,
  });

  revalidatePath("/");
}

export async function toggleTodoVisibility(formData: FormData) {
  const user = await requireSignedInUser();
  const todoId = `${formData.get("todoId") ?? ""}`;

  toggleTodoVisibilityForUser(user.id, todoId);
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
