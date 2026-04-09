import { createReadStream } from "fs";
import { stat } from "fs/promises";
import { Readable } from "stream";

import { NextResponse } from "next/server";

import { getBoardAttachmentById } from "@/lib/db";

type RouteProps = {
  params: Promise<{
    postId: string;
  }>;
};

export async function GET(_: Request, { params }: RouteProps) {
  const { postId } = await params;
  const attachment = getBoardAttachmentById(postId);

  if (!attachment) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    await stat(attachment.filePath);
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }

  return new NextResponse(Readable.toWeb(createReadStream(attachment.filePath)) as ReadableStream, {
    headers: {
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(
        attachment.fileName,
      )}`,
      "Content-Length": String(attachment.fileSize),
      "Content-Type": attachment.mimeType,
    },
  });
}
