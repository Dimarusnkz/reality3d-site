
import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'
import { getSession } from '@/lib/session'
import { assertCsrfTokenValue } from '@/lib/csrf'
import { UPLOAD_CONFIG } from '@/lib/upload-config'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || !['admin', 'manager'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const headerToken = req.headers.get('x-csrf-token')
    const bodyToken = formData.get('csrf_token')
    const token = typeof bodyToken === 'string' ? bodyToken : headerToken

    const csrf = await assertCsrfTokenValue(token)
    if (!csrf.ok) {
      return NextResponse.json({ error: csrf.error }, { status: 403 })
    }

    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    if (file.size > UPLOAD_CONFIG.maxFileSizePublic) {
      return NextResponse.json({ error: 'File too large (Max 5MB)' }, { status: 400 })
    }

    if (file.type && !UPLOAD_CONFIG.allowedPublicMime.has(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const ext = file.name.split('.').pop()?.toLowerCase() || ''
    if (!UPLOAD_CONFIG.allowedPublicExtensions.has(ext)) {
      return NextResponse.json({ error: 'Invalid file extension' }, { status: 400 })
    }
    const filename = `${uuidv4()}.${ext}`

    // Ensure directory exists
    await mkdir(UPLOAD_CONFIG.publicDir, { recursive: true })

    const filePath = join(UPLOAD_CONFIG.publicDir, filename)
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
