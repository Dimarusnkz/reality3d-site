'use server'

import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'
import { getSession } from '@/lib/session'
import { assertCsrf } from '@/lib/csrf'

import { z } from 'zod'

const DEFAULT_UPLOAD_DIR = process.platform === 'win32'
  ? 'C:\\Users\\Dmitry\\Desktop\\reality3d-uploads' // Local dev
  : '/var/www/reality3d-uploads' // Production

const UPLOAD_DIR = process.env.UPLOAD_DIR || DEFAULT_UPLOAD_DIR

const ALLOWED_EXTENSIONS = ['stl', 'obj', 'step', 'stp']
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

const uploadSchema = z.object({
  file: z.instanceof(File).refine((file) => file.size <= MAX_FILE_SIZE, 'File too large (Max 50MB)')
    .refine((file) => {
      const ext = file.name.split('.').pop()?.toLowerCase() || ''
      return ALLOWED_EXTENSIONS.includes(ext)
    }, 'Invalid file type. Only STL, OBJ, STEP allowed.')
})

export async function uploadFile(formData: FormData) {
  const csrf = await assertCsrf(formData)
  if (!csrf.ok) {
    return { error: csrf.error }
  }

  const session = await getSession()
  if (!session || !session.userId) {
    return { error: 'Unauthorized' }
  }

  const file = formData.get('file') as File
  const result = uploadSchema.safeParse({ file })
  
  if (!result.success) {
    return { 
      success: false,
      error: result.error.errors[0].message 
    }
  }

  const originalName = file.name
  const extension = originalName.split('.').pop()?.toLowerCase() || ''
  const safeName = `${uuidv4()}.${extension}`
  
  try {
    await mkdir(UPLOAD_DIR, { recursive: true }) 
    
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const filePath = join(UPLOAD_DIR, safeName)
    
    await writeFile(filePath, buffer)
    
    return { 
      success: true, 
      file: {
        originalName,
        fileName: safeName,
        size: file.size,
        path: filePath
      }
    }
  } catch (error) {
    console.error('Upload error:', error)
    return { error: 'Failed to upload file' }
  }
}
