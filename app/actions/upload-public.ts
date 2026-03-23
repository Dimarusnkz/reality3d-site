'use server'

import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'
import { getSession } from '@/lib/session'
import { assertCsrf } from '@/lib/csrf'

import { z } from 'zod'

const DEFAULT_PUBLIC_UPLOAD_DIR = process.platform === 'win32'
  ? 'C:\\Users\\Dmitry\\Desktop\\reality3d-uploads\\public' // Local dev
  : '/var/www/reality3d-uploads/public' // Production

const PUBLIC_UPLOAD_DIR = process.env.PUBLIC_UPLOAD_DIR || DEFAULT_PUBLIC_UPLOAD_DIR

const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

const publicUploadSchema = z.object({
  file: z.instanceof(File).refine((file) => file.size <= MAX_FILE_SIZE, 'File too large (Max 5MB)')
    .refine((file) => {
      const ext = file.name.split('.').pop()?.toLowerCase() || ''
      return ALLOWED_EXTENSIONS.includes(ext)
    }, 'Invalid file type. Only JPG, PNG, WEBP allowed.')
})

export async function uploadPublicFile(formData: FormData) {
  const csrf = await assertCsrf(formData)
  if (!csrf.ok) {
    return { error: csrf.error }
  }

  const session = await getSession()
  if (!session || !session.userId) {
    return { error: 'Unauthorized' }
  }

  const file = formData.get('file') as File
  const result = publicUploadSchema.safeParse({ file })

  if (!result.success) {
    return { error: result.error.errors[0].message }
  }

  const originalName = file.name
  const extension = originalName.split('.').pop()?.toLowerCase() || ''
  const safeName = `${uuidv4()}.${extension}`
  
  try {
    await mkdir(PUBLIC_UPLOAD_DIR, { recursive: true }) 
    
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const filePath = join(PUBLIC_UPLOAD_DIR, safeName)
    
    await writeFile(filePath, buffer)
    
    return { 
      success: true, 
      file: {
        originalName,
        fileName: safeName,
        size: file.size
      }
    }
  } catch (error) {
    console.error('Upload error:', error)
    return { error: 'Failed to upload file' }
  }
}
