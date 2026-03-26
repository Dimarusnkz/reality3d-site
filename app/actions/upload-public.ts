'use server'

import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'
import { getSession } from '@/lib/session'
import { assertCsrf } from '@/lib/csrf'
import { UPLOAD_CONFIG } from '@/lib/upload-config'

import { z } from 'zod'

const publicUploadSchema = z.object({
  file: z.any()
    .refine((file) => file instanceof File, 'No file provided')
    .refine((file) => file instanceof File && file.size <= UPLOAD_CONFIG.maxFileSizePublic, 'File too large (Max 5MB)')
    .refine((file) => {
      if (!(file instanceof File)) return false;
      const ext = file.name.split('.').pop()?.toLowerCase() || ''
      return UPLOAD_CONFIG.allowedPublicExtensions.has(ext)
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
    return { 
      success: false, 
      error: result.error.format()._errors[0] || 'Invalid file'
    }
  }

  const originalName = file.name
  const extension = originalName.split('.').pop()?.toLowerCase() || ''
  const safeName = `${uuidv4()}.${extension}`
  
  try {
    await mkdir(UPLOAD_CONFIG.publicDir, { recursive: true }) 
    
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const filePath = join(UPLOAD_CONFIG.publicDir, safeName)
    
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
