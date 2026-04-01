'use server'

import { getPrisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { revalidatePath } from 'next/cache'
import { assertCsrfTokenValue } from '@/lib/csrf'

export async function createReview(rating: number, text: string, photos: string[], csrfToken: string) {
  const prisma = getPrisma()
  const csrf = await assertCsrfTokenValue(csrfToken || null)
  if (!csrf.ok) {
    return { error: csrf.error }
  }

  const session = await getSession()
  if (!session || !session.userId) {
    return { error: 'Не авторизован' }
  }

  if (rating < 1 || rating > 5) {
    return { error: 'Некорректный рейтинг' }
  }

  if (!text || text.trim().length < 5) {
    return { error: 'Отзыв слишком короткий (минимум 5 символов)' }
  }
  if (text.length > 1000) {
    return { error: 'Отзыв слишком длинный (макс. 1000 символов)' }
  }

  try {
    const userId = typeof session.userId === 'string' ? parseInt(session.userId) : session.userId

    if (isNaN(userId)) {
      return { error: 'Некорректный ID пользователя' }
    }

    await prisma.review.create({
      data: {
        userId: userId,
        rating,
        text,
        photos: JSON.stringify(photos),
        status: 'pending'
      }
    })

    // Notify admin? (Optional, skipping for now)

    return { success: true }
  } catch (error) {
    console.error('Create review error:', error)
    // Return detailed error message for debugging
    return { error: error instanceof Error ? error.message : 'Не удалось создать отзыв' }
  }
}

export async function getReviews() {
  const prisma = getPrisma()
  // Public - only approved
  try {
    const reviews = await prisma.review.findMany({
      where: { status: 'approved' },
      include: {
        user: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    return reviews.map(r => ({
      ...r,
      photos: r.photos ? JSON.parse(r.photos) as string[] : []
    }))
  } catch (error) {
    console.error('Get reviews error:', error)
    return []
  }
}

export async function getAllReviews() {
  const prisma = getPrisma()
  // Admin - all
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return []
  }

  try {
    const reviews = await prisma.review.findMany({
      include: {
        user: {
          select: { name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    return reviews.map(r => ({
      ...r,
      photos: r.photos ? JSON.parse(r.photos) as string[] : []
    }))
  } catch (error) {
    console.error('Get all reviews error:', error)
    return []
  }
}

export async function updateReviewStatus(id: number, status: 'approved' | 'rejected', csrfToken: string) {
  const prisma = getPrisma()
  const csrf = await assertCsrfTokenValue(csrfToken || null)
  if (!csrf.ok) {
    return { error: csrf.error }
  }

  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return { error: 'Не авторизован' }
  }

  try {
    await prisma.review.update({
      where: { id },
      data: { status }
    })
    
    revalidatePath('/reviews')
    revalidatePath('/admin/reviews')
    return { success: true }
  } catch (error) {
    console.error('Update review status error:', error)
    return { error: 'Не удалось обновить статус' }
  }
}

export async function deleteReview(id: number, csrfToken: string) {
  const prisma = getPrisma()
  const csrf = await assertCsrfTokenValue(csrfToken || null)
  if (!csrf.ok) {
    return { error: csrf.error }
  }

  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return { error: 'Не авторизован' }
  }

  try {
    await prisma.review.delete({
      where: { id }
    })
    
    revalidatePath('/reviews')
    revalidatePath('/admin/reviews')
    return { success: true }
  } catch (error) {
    console.error('Delete review error:', error)
    return { error: 'Не удалось удалить отзыв' }
  }
}
