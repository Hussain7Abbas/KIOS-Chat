import ImageKit from "imagekit"
import { resolveUploadedMimeType } from "@/lib/mime"
import { validateChatUpload } from "@/lib/fileUploadValidation"

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY!,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT!,
})

export function validateFile(file: File) {
  return validateChatUpload(file)
}

export async function uploadToImageKit(
  file: File
): Promise<{ url: string; publicId: string }> {
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  return new Promise((resolve, reject) => {
    imagekit.upload(
      {
        file: buffer,
        fileName: file.name,
        folder: "/kios-chat",
        useUniqueFileName: true,
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Upload failed"))
          return
        }
        resolve({ url: result.url, publicId: result.fileId })
      }
    )
  })
}
