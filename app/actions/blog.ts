'use server'

import { PrismaClient } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/session'

const prisma = new PrismaClient()

export async function getArticles(publishedOnly = true) {
  const where = publishedOnly ? { published: true } : {}
  
  return await prisma.article.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { author: { select: { name: true } } }
  })
}

export async function getArticleBySlug(slug: string) {
  return await prisma.article.findUnique({
    where: { slug },
    include: { author: { select: { name: true } } }
  })
}

export async function getArticleById(id: number) {
  return await prisma.article.findUnique({
    where: { id },
    include: { author: { select: { name: true } } }
  })
}

export async function createArticle(data: { title: string; slug: string; excerpt: string; content: string; coverImage: string; published: boolean }) {
  const session = await getSession()
  if (!session || !['admin', 'manager'].includes(session.role)) {
    return { error: 'Unauthorized' }
  }

  try {
    await prisma.article.create({
      data: {
        ...data,
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
  const session = await getSession()
  if (!session || !['admin', 'manager'].includes(session.role)) {
    return { error: 'Unauthorized' }
  }

  try {
    await prisma.article.update({
      where: { id },
      data
    })
    revalidatePath('/blog')
    revalidatePath('/admin/blog')
    return { success: true }
  } catch (error) {
    console.error('Error updating article:', error)
    return { error: 'Failed to update article' }
  }
}

export async function deleteArticle(id: number) {
  const session = await getSession()
  if (!session || !['admin', 'manager'].includes(session.role)) {
    return { error: 'Unauthorized' }
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
