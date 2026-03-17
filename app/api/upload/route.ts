
import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'
import { getSession } from '@/lib/session'

const DEFAULT_PUBLIC_UPLOAD_DIR = process.platform === 'win32'
  ? 'C:\\Users\\Dmitry\\Desktop\\reality3d-uploads\\public'
  : '/var/www/reality3d-uploads/public'

const PUBLIC_UPLOAD_DIR = process.env.PUBLIC_UPLOAD_DIR || DEFAULT_PUBLIC_UPLOAD_DIR

const ALLOWED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp'])
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp'])
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024

function isSameOrigin(req: NextRequest) {
  const host = req.headers.get('host')
  const origin = req.headers.get('origin')
  if (!host) return false
  if (!origin) return true
  try {
    return new URL(origin).host === host
  } catch {
    return false
  }
}

function getCsrfToken(req: NextRequest, formData: FormData) {
  const cookieToken = req.cookies.get('csrf_token')?.value || null
  const headerToken = req.headers.get('x-csrf-token')
  const bodyToken = formData.get('csrf_token')
  const token = typeof bodyToken === 'string' ? bodyToken : headerToken
  return { cookieToken, token }
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || !['admin', 'manager'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await req.formData()

    if (!isSameOrigin(req)) {
      return NextResponse.json({ error: 'Запрос отклонён' }, { status: 403 })
    }

    const csrf = getCsrfToken(req, formData)
    if (!csrf.cookieToken || !csrf.token || csrf.cookieToken !== csrf.token) {
      return NextResponse.json({ error: 'Сессия формы истекла. Обнови страницу и повтори.' }, { status: 403 })
    }

    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ error: 'File too large (Max 5MB)' }, { status: 400 })
    }

    if (file.type && !ALLOWED_MIME.has(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const ext = file.name.split('.').pop()?.toLowerCase() || ''
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return NextResponse.json({ error: 'Invalid file extension' }, { status: 400 })
    }
    const filename = `${uuidv4()}.${ext}`

    // Ensure directory exists
    await mkdir(PUBLIC_UPLOAD_DIR, { recursive: true })

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
