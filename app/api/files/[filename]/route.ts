import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { getSession } from '@/lib/session'
import { UPLOAD_CONFIG, isPathSafe } from '@/lib/upload-config'

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
  if (!isPathSafe(filename)) {
    return new NextResponse('Invalid filename', { status: 400 })
  }

  try {
    const filePath = join(UPLOAD_CONFIG.baseDir, filename)
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
