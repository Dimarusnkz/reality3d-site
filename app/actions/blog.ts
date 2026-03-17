'use server'

import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/session'
import { assertCsrfTokenValue } from '@/lib/csrf'
import { getPrisma } from '@/lib/prisma'
import sanitizeHtml from 'sanitize-html'

function sanitizeArticleHtml(input: string) {
  return sanitizeHtml(input, {
    allowedTags: [
      'p',
      'br',
      'strong',
      'b',
      'em',
      'i',
      'u',
      's',
      'blockquote',
      'ul',
      'ol',
      'li',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'a',
      'code',
      'pre',
      'hr',
      'img',
      'span',
    ],
    allowedAttributes: {
      a: ['href', 'name', 'target', 'rel'],
      img: ['src', 'alt', 'title'],
      span: ['class'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowProtocolRelative: false,
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer nofollow' }),
    },
  })
}

export async function getArticles(publishedOnly = true) {
  const prisma = getPrisma()
  const where = publishedOnly ? { published: true } : {}

  try {
    return await prisma.article.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { author: { select: { name: true } } },
    })
  } catch {
    return []
  }
}

export async function getArticleBySlug(slug: string) {
  const prisma = getPrisma()
  try {
    return await prisma.article.findUnique({
      where: { slug },
      include: { author: { select: { name: true } } },
    })
  } catch {
    return null
  }
}

export async function getArticleById(id: number) {
  const prisma = getPrisma()
  try {
    return await prisma.article.findUnique({
      where: { id },
      include: { author: { select: { name: true } } },
    })
  } catch {
    return null
  }
}

export async function createArticle(data: { title: string; slug: string; excerpt: string; content: string; coverImage: string; published: boolean }) {
  const prisma = getPrisma()
  const session = await getSession()
  if (!session || !['admin', 'manager'].includes(session.role)) {
    return { error: 'Unauthorized' }
  }

  const csrf = await assertCsrfTokenValue((data as any).csrfToken || null)
  if (!csrf.ok) {
    return { error: csrf.error }
  }

  try {
    const sanitized = sanitizeArticleHtml(data.content)
    await prisma.article.create({
      data: {
        ...data,
        content: sanitized,
        authorId: parseInt(session.userId as string)
      }
    })
    revalidatePath('/blog')
    revalidatePath('/admin/blog')
    return { success: true }
  } catch (error) {
    console.error('Error creating article:', error)
    return { error: 'Failed to create article' }
  }
}

export async function updateArticle(id: number, data: { title: string; slug: string; excerpt: string; content: string; coverImage: string; published: boolean }) {
  const prisma = getPrisma()
  const session = await getSession()
  if (!session || !['admin', 'manager'].includes(session.role)) {
    return { error: 'Unauthorized' }
  }

  const csrf = await assertCsrfTokenValue((data as any).csrfToken || null)
  if (!csrf.ok) {
    return { error: csrf.error }
  }

  try {
    const sanitized = sanitizeArticleHtml(data.content)
    await prisma.article.update({
      where: { id },
      data: { ...data, content: sanitized }
    })
    revalidatePath('/blog')
    revalidatePath('/admin/blog')
    return { success: true }
  } catch (error) {
    console.error('Error updating article:', error)
    return { error: 'Failed to update article' }
  }
}

export async function deleteArticle(id: number, csrfToken: string) {
  const prisma = getPrisma()
  const session = await getSession()
  if (!session || !['admin', 'manager'].includes(session.role)) {
    return { error: 'Unauthorized' }
  }

  const csrf = await assertCsrfTokenValue(csrfToken || null)
  if (!csrf.ok) {
    return { error: csrf.error }
  }

  try {
    await prisma.article.delete({
      where: { id }
    })
    revalidatePath('/blog')
    revalidatePath('/admin/blog')
    return { success: true }
  } catch (error) {
    console.error('Error deleting article:', error)
    return { error: 'Failed to delete article' }
  }
}
