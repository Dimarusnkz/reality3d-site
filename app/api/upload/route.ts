
import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'
import { getSession } from '@/lib/session'

const PUBLIC_UPLOAD_DIR = process.platform === 'win32' 
  ? 'C:\\Users\\Dmitry\\Desktop\\reality3d-uploads\\public'
  : '/var/www/reality3d-uploads/public'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || !['admin', 'manager'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const filename = `${uuidv4()}.${ext}`

    // Ensure directory exists
    try {
        await mkdir(PUBLIC_UPLOAD_DIR, { recursive: true })
    } catch (e) {
        // Ignore if exists
    }

    const filePath = join(PUBLIC_UPLOAD_DIR, filename)
    await writeFile(filePath, buffer)

    // Return the URL to access the file
    // Note: This relies on app/api/public/[filename]/route.ts being set up correctly
    const url = `/api/public/${filename}`

    return NextResponse.json({ url })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
