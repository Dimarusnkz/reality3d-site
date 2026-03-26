import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { UPLOAD_CONFIG, isPathSafe } from '@/lib/upload-config'

export async function GET(req: NextRequest, { params }: { params: Promise<{ filename: string }> }) {
  // Public route, no auth check needed for reading images
  
  const { filename } = await params
  
  // Basic path traversal protection
  if (!isPathSafe(filename)) {
    return new NextResponse('Invalid filename', { status: 400 })
  }

  const filePath = join(UPLOAD_CONFIG.publicDir, filename)
  
  try {
    const fileBuffer = await readFile(filePath)
    
    // Determine content type
    const ext = filename.split('.').pop()?.toLowerCase()
    let contentType = 'application/octet-stream'
    if (ext === 'jpg' || ext === 'jpeg') contentType = 'image/jpeg'
    if (ext === 'png') contentType = 'image/png'
    if (ext === 'webp') contentType = 'image/webp'

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    })
  } catch {
    return new NextResponse('File not found', { status: 404 })
  }
}
