import { NextRequest, NextResponse } from "next/server"
import { requireAuthApi } from "@/lib/guards"
import { prisma } from "@/lib/prisma"
import { validateFile, uploadToImageKit } from "@/lib/upload"
import { resolveUploadedMimeType } from "@/lib/mime"

export async function POST(request: NextRequest) {
  const { session, error } = await requireAuthApi(request)
  if (error) return error

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const threadId = formData.get("threadId") as string | null

    if (!file) {
      return NextResponse.json({ error: "upload.no-file" }, { status: 400 })
    }

    if (!threadId) {
      return NextResponse.json({ error: "upload.thread-id-required" }, { status: 400 })
    }

    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
      select: { userId: true },
    })

    if (!thread || thread.userId !== session.user.id) {
      return NextResponse.json({ error: "upload.thread-not-found" }, { status: 404 })
    }

    const validation = validateFile(file)
    if (!validation.valid) {
      if (validation.kind === "pdf") {
        return NextResponse.json(
          {
            error: "upload.pdf-use-ocr",
            showOcrModal: true,
          },
          { status: 400 },
        )
      }
      return NextResponse.json(
        {
          error: validation.errorKey,
          errorParams: validation.errorParams,
        },
        { status: 400 },
      )
    }

    const { url } = await uploadToImageKit(file)

    const mimeType = resolveUploadedMimeType(file)

    const fileRecord = await prisma.file.create({
      data: {
        threadId,
        name: file.name,
        url,
        mimeType,
        size: file.size,
      },
    })

    return NextResponse.json(
      {
        id: fileRecord.id,
        url: fileRecord.url,
        name: fileRecord.name,
        mimeType,
        size: fileRecord.size,
      },
      { status: 201 },
    )
  } catch {
    return NextResponse.json({ error: "upload.server-failed" }, { status: 500 })
  }
}
