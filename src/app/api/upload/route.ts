import { NextRequest, NextResponse } from "next/server"
import { requireAuthApi } from "@/lib/guards"
import { prisma } from "@/lib/prisma"
import { validateFile, uploadToImageKit } from "@/lib/upload"

export async function POST(request: NextRequest) {
  const { session, error } = await requireAuthApi(request)
  if (error) return error

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const threadId = formData.get("threadId") as string | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!threadId) {
      return NextResponse.json(
        { error: "Thread ID is required" },
        { status: 400 }
      )
    }

    // Verify thread ownership
    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
      select: { userId: true },
    })

    if (!thread || thread.userId !== session.user.id) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 })
    }

    // Validate file
    const validation = validateFile(file)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // Upload to ImageKit
    const { url } = await uploadToImageKit(file)

    // Save to database
    const fileRecord = await prisma.file.create({
      data: {
        threadId,
        name: file.name,
        url,
        mimeType: file.type,
        size: file.size,
      },
    })

    return NextResponse.json(
      {
        id: fileRecord.id,
        url: fileRecord.url,
        name: fileRecord.name,
        mimeType: fileRecord.mimeType,
        size: fileRecord.size,
      },
      { status: 201 }
    )
  } catch {
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    )
  }
}
