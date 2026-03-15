'use server'

import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'
import { getSession } from '@/lib/session'

const PUBLIC_UPLOAD_DIR = process.platform === 'win32' 
  ? 'C:\\Users\\Dmitry\\Desktop\\reality3d-uploads\\public' // Local dev
  : '/var/www/reality3d-uploads/public' // Production

const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export async function uploadPublicFile(formData: FormData) {
  const session = await getSession()
  if (!session || !session.userId) {
    return { error: 'Unauthorized' }
  }

  const file = formData.get('file') as File
  if (!file) {
    return { error: 'No file provided' }
  }

  // 1. Validate Size
  if (file.size > MAX_FILE_SIZE) {
    return { error: 'File too large (Max 5MB)' }
  }

  // 2. Validate Extension
  const originalName = file.name
  const extension = originalName.split('.').pop()?.toLowerCase() || ''
  
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return { error: 'Invalid file type. Only JPG, PNG, WEBP allowed.' }
  }

  // 3. Sanitize Filename (UUID)
  const safeName = `${uuidv4()}.${extension}`
  
  // 4. Save File
  try {
    // Ensure dir exists
    try { 
      await mkdir(PUBLIC_UPLOAD_DIR, { recursive: true }) 
    } catch (e) {
      // Ignore if exists
    }
    
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
