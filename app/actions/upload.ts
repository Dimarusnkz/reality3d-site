'use server'

import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'
import { getSession } from '@/lib/session'

const UPLOAD_DIR = process.platform === 'win32' 
  ? 'C:\\Users\\Dmitry\\Desktop\\reality3d-uploads' // Local dev
  : '/var/www/reality3d-uploads' // Production

const ALLOWED_EXTENSIONS = ['stl', 'obj', 'step', 'stp']
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

export async function uploadFile(formData: FormData) {
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
    return { error: 'File too large (Max 50MB)' }
  }

  // 2. Validate Extension
  const originalName = file.name
  const extension = originalName.split('.').pop()?.toLowerCase() || ''
  
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return { error: 'Invalid file type. Only STL, OBJ, STEP allowed.' }
  }

  // 3. Sanitize Filename (UUID)
  const safeName = `${uuidv4()}.${extension}`
  
  // 4. Save File
  try {
    // Ensure dir exists
    try { 
      await mkdir(UPLOAD_DIR, { recursive: true }) 
    } catch (e) {
      // Ignore if exists, or log if permission error
      // console.error('Mkdir error:', e)
    }
    
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
