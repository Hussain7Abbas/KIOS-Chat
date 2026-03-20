import { v2 as cloudinary } from "cloudinary"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]

const ALLOWED_DOCUMENT_TYPES = [
  "application/pdf",
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]

const ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES]

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export function validateFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `File type "${file.type}" is not allowed. Allowed: images (jpg, png, gif, webp) and documents (pdf, txt, md, csv, docx).`,
    }
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds 10MB limit.`,
    }
  }

  return { valid: true }
}

export function isImageType(mimeType: string): boolean {
  return ALLOWED_IMAGE_TYPES.includes(mimeType)
}

export async function uploadToCloudinary(
  file: File
): Promise<{ url: string; publicId: string }> {
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const resourceType = isImageType(file.type) ? "image" : "raw"

  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          resource_type: resourceType,
          folder: "kios-chat",
        },
        (error, result) => {
          if (error || !result) {
            reject(error ?? new Error("Upload failed"))
            return
          }
          resolve({ url: result.secure_url, publicId: result.public_id })
        }
      )
      .end(buffer)
  })
}
