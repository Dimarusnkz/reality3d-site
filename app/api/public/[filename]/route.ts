import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'

const PUBLIC_UPLOAD_DIR = process.platform === 'win32' 
  ? 'C:\\Users\\Dmitry\\Desktop\\reality3d-uploads\\public'
  : '/var/www/reality3d-uploads/public'

export async function GET(req: NextRequest, { params }: { params: Promise<{ filename: string }> }) {
  // Public route, no auth check needed for reading images
  
  const { filename } = await params
  
  // Basic path traversal protection
  if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return new NextResponse('Invalid filename', { status: 400 })
  }

  const filePath = join(PUBLIC_UPLOAD_DIR, filename)
  
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
  } catch (error) {
    return new NextResponse('File not found', { status: 404 })
  }
}
