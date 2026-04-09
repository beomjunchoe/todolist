import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";

import { getBoardUploadsDirectory } from "@/lib/db";

const MAX_ATTACHMENT_SIZE = 8 * 1024 * 1024;

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^\w.\-()\[\]가-힣 ]+/g, "_").slice(0, 120) || "자료";
}

export async function saveBoardAttachment(file: File) {
  if (!file.size) {
    return null;
  }

  if (file.size > MAX_ATTACHMENT_SIZE) {
    throw new Error("첨부 파일은 8MB 이하만 올릴 수 있습니다.");
  }

  const uploadsDir = getBoardUploadsDirectory();
  await fs.mkdir(uploadsDir, { recursive: true });

  const safeName = sanitizeFileName(file.name);
  const extension = path.extname(safeName);
  const storedName = `${randomUUID()}${extension}`;
  const absolutePath = path.join(uploadsDir, storedName);

  await fs.writeFile(absolutePath, Buffer.from(await file.arrayBuffer()));

  return {
    fileName: safeName,
    filePath: absolutePath,
    fileSize: file.size,
    mimeType: file.type || "application/octet-stream",
  };
}

export async function deleteBoardAttachment(filePath: string | null | undefined) {
  if (!filePath) {
    return;
  }

  try {
    await fs.unlink(filePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }
}
