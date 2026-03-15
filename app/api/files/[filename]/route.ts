import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { getSession } from '@/lib/session'

const UPLOAD_DIR = process.platform === 'win32' 
  ? 'C:\\Users\\Dmitry\\Desktop\\reality3d-uploads' 
  : '/var/www/reality3d-uploads'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const session = await getSession()
  if (!session) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  // Security: Prevent directory traversal
  const { filename } = await params
  if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return new NextResponse('Invalid filename', { status: 400 })
  }

  try {
    const filePath = join(UPLOAD_DIR, filename)
    const fileBuffer = await readFile(filePath)
    
    // Determine content type (basic)
    const ext = filename.split('.').pop()?.toLowerCase()
    let contentType = 'application/octet-stream'
    if (ext === 'stl') contentType = 'model/stl'
    if (ext === 'obj') contentType = 'model/obj'
    
    // Force download to prevent execution
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })
  } catch (error) {
    console.error('File read error:', error)
    return new NextResponse('File not found', { status: 404 })
  }
}
