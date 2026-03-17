'use server'

import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/session'
import { getPrisma } from '@/lib/prisma'
import { assertCsrfTokenValue } from '@/lib/csrf'
import { toKopeks } from '@/lib/shop/money'
import { z } from 'zod'
import { logAudit } from '@/lib/audit'

function requireAdmin(session: { userId?: string; role?: string } | null) {
  if (!session?.userId) return { ok: false as const, error: 'Unauthorized' }
  if (session.role !== 'admin' && session.role !== 'manager') return { ok: false as const, error: 'Unauthorized' }
  return { ok: true as const, userId: parseInt(session.userId, 10) }
}

const categorySchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9-]+$/i),
  parentId: z.number().int().positive().optional().nullable(),
})

export async function createShopCategory(input: unknown, csrfToken: string) {
  const prisma = getPrisma()
  const csrf = await assertCsrfTokenValue(csrfToken || null)
  if (!csrf.ok) return { ok: false as const, error: csrf.error }

  const session = await getSession()
  const admin = requireAdmin(session)
  if (!admin.ok) return admin

  const parsed = categorySchema.safeParse(input)
  if (!parsed.success) return { ok: false as const, error: 'Некорректные данные' }

  try {
    const category = await prisma.shopCategory.create({
      data: {
        name: parsed.data.name,
        slug: parsed.data.slug,
        parentId: parsed.data.parentId ?? null,
      },
      select: { id: true, name: true, slug: true },
    })

    await logAudit({ actorUserId: admin.userId, action: 'shop.category.create', target: category.slug })
    revalidatePath('/admin/shop')
    revalidatePath('/admin/shop/categories')
    revalidatePath('/shop')
    return { ok: true as const, category }
  } catch (e) {
    return { ok: false as const, error: 'Не удалось создать категорию' }
  }
}

const productSchema = z.object({
  name: z.string().trim().min(2).max(200),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(200)
    .regex(/^[a-z0-9-]+$/i),
  sku: z.string().trim().max(80).optional().nullable(),
  shortDescription: z.string().trim().max(400).optional().nullable(),
  description: z.string().trim().max(10000).optional().nullable(),
  priceRub: z.number().min(0),
  compareAtRub: z.number().min(0).optional().nullable(),
  stock: z.number().int().min(0).max(100000),
  isActive: z.boolean(),
  categoryId: z.number().int().positive().optional().nullable(),
  imageUrls: z.array(z.string().url()).max(10).optional().nullable(),
})

export async function createShopProduct(input: unknown, csrfToken: string) {
  const prisma = getPrisma()
  const csrf = await assertCsrfTokenValue(csrfToken || null)
  if (!csrf.ok) return { ok: false as const, error: csrf.error }

  const session = await getSession()
  const admin = requireAdmin(session)
  if (!admin.ok) return admin

  const parsed = productSchema.safeParse(input)
  if (!parsed.success) return { ok: false as const, error: 'Некорректные данные' }

  try {
    const product = await prisma.shopProduct.create({
      data: {
        name: parsed.data.name,
        slug: parsed.data.slug,
        sku: parsed.data.sku || null,
        shortDescription: parsed.data.shortDescription || null,
        description: parsed.data.description || null,
        priceKopeks: toKopeks(parsed.data.priceRub),
        compareAtKopeks: parsed.data.compareAtRub == null ? null : toKopeks(parsed.data.compareAtRub),
        stock: parsed.data.stock,
        isActive: parsed.data.isActive,
        categoryId: parsed.data.categoryId ?? null,
        images:
          parsed.data.imageUrls && parsed.data.imageUrls.length > 0
            ? {
                create: parsed.data.imageUrls.map((url, idx) => ({
                  url,
                  sortOrder: idx,
                })),
              }
            : undefined,
      },
      select: { id: true, name: true, slug: true },
    })

    await logAudit({ actorUserId: admin.userId, action: 'shop.product.create', target: product.slug })
    revalidatePath('/admin/shop/products')
    revalidatePath('/shop')
    return { ok: true as const, product }
  } catch (e) {
    return { ok: false as const, error: 'Не удалось создать товар' }
  }
}

export async function updateShopProduct(id: number, input: unknown, csrfToken: string) {
  const prisma = getPrisma()
  const csrf = await assertCsrfTokenValue(csrfToken || null)
  if (!csrf.ok) return { ok: false as const, error: csrf.error }

  const session = await getSession()
  const admin = requireAdmin(session)
  if (!admin.ok) return admin

  const parsed = productSchema.safeParse(input)
  if (!parsed.success) return { ok: false as const, error: 'Некорректные данные' }

  try {
    await prisma.shopProduct.update({
      where: { id },
      data: {
        name: parsed.data.name,
        slug: parsed.data.slug,
        sku: parsed.data.sku || null,
        shortDescription: parsed.data.shortDescription || null,
        description: parsed.data.description || null,
        priceKopeks: toKopeks(parsed.data.priceRub),
        compareAtKopeks: parsed.data.compareAtRub == null ? null : toKopeks(parsed.data.compareAtRub),
        stock: parsed.data.stock,
        isActive: parsed.data.isActive,
        categoryId: parsed.data.categoryId ?? null,
      },
    })

    await logAudit({ actorUserId: admin.userId, action: 'shop.product.update', target: String(id) })
    revalidatePath('/admin/shop/products')
    revalidatePath('/shop')
    return { ok: true as const }
  } catch (e) {
    return { ok: false as const, error: 'Не удалось обновить товар' }
  }
}

export async function deleteShopProduct(id: number, csrfToken: string) {
  const prisma = getPrisma()
  const csrf = await assertCsrfTokenValue(csrfToken || null)
  if (!csrf.ok) return { ok: false as const, error: csrf.error }

  const session = await getSession()
  const admin = requireAdmin(session)
  if (!admin.ok) return admin

  try {
    await prisma.shopProductImage.deleteMany({ where: { productId: id } })
    await prisma.shopProduct.delete({ where: { id } })
    await logAudit({ actorUserId: admin.userId, action: 'shop.product.delete', target: String(id) })
    revalidatePath('/admin/shop/products')
    revalidatePath('/shop')
    return { ok: true as const }
  } catch (e) {
    return { ok: false as const, error: 'Не удалось удалить товар' }
  }
}
