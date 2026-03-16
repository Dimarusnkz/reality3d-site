'use server'

import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { revalidatePath } from 'next/cache'
import { assertCsrfTokenValue } from '@/lib/csrf'

export async function createReview(rating: number, text: string, photos: string[], csrfToken: string) {
  const csrf = await assertCsrfTokenValue(csrfToken || null)
  if (!csrf.ok) {
    return { error: csrf.error }
  }

  const session = await getSession()
  if (!session || !session.userId) {
    return { error: 'Unauthorized' }
  }

  if (rating < 1 || rating > 5) {
    return { error: 'Invalid rating' }
  }

  if (!text || text.trim().length === 0) {
    return { error: 'Text is required' }
  }

  try {
    const userId = typeof session.userId === 'string' ? parseInt(session.userId) : session.userId

    if (isNaN(userId)) {
      return { error: 'Invalid user ID' }
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
    return { error: error instanceof Error ? error.message : 'Failed to create review' }
  }
}

export async function getReviews() {
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
  const csrf = await assertCsrfTokenValue(csrfToken || null)
  if (!csrf.ok) {
    return { error: csrf.error }
  }

  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return { error: 'Unauthorized' }
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
    return { error: 'Failed to update status' }
  }
}

export async function deleteReview(id: number, csrfToken: string) {
  const csrf = await assertCsrfTokenValue(csrfToken || null)
  if (!csrf.ok) {
    return { error: csrf.error }
  }

  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return { error: 'Unauthorized' }
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
    return { error: 'Failed to delete review' }
  }
}
