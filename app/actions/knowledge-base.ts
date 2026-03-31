'use server';

import { revalidatePath } from 'next/cache';
import { getPrisma } from '@/lib/prisma';
import { assertCsrfTokenValue } from '@/lib/csrf';
import { requirePermission } from '@/lib/access';
import { logAudit } from '@/lib/audit';
import { knowledgeBaseCategorySchema, knowledgeBaseArticleSchema } from '@/lib/schemas/knowledge-base';

// --- Categories ---

export async function createKBCategory(input: unknown, csrfToken: string) {
  const csrf = await assertCsrfTokenValue(csrfToken || null);
  if (!csrf.ok) return { ok: false as const, error: csrf.error };

  const access = await requirePermission('admin.access'); // Only admins can manage KB structure
  if (!access.ok) return access;

  const parsed = knowledgeBaseCategorySchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: 'Некорректные данные' };

  const prisma = getPrisma();
  try {
    const category = await prisma.knowledgeBaseCategory.create({
      data: parsed.data,
    });

    await logAudit({
      actorUserId: access.userId,
      action: 'kb.category.create',
      target: category.slug,
    });

    revalidatePath('/admin/kb');
    revalidatePath('/kb');
    return { ok: true as const, category };
  } catch (e) {
    return { ok: false as const, error: 'Ошибка при создании категории' };
  }
}

export async function updateKBCategory(id: number, input: unknown, csrfToken: string) {
  const csrf = await assertCsrfTokenValue(csrfToken || null);
  if (!csrf.ok) return { ok: false as const, error: csrf.error };

  const access = await requirePermission('admin.access');
  if (!access.ok) return access;

  const parsed = knowledgeBaseCategorySchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: 'Некорректные данные' };

  const prisma = getPrisma();
  try {
    const category = await prisma.knowledgeBaseCategory.update({
      where: { id },
      data: parsed.data,
    });

    await logAudit({
      actorUserId: access.userId,
      action: 'kb.category.update',
      target: category.slug,
    });

    revalidatePath('/admin/kb');
    revalidatePath('/kb');
    return { ok: true as const, category };
  } catch (e) {
    return { ok: false as const, error: 'Ошибка при обновлении категории' };
  }
}

export async function deleteKBCategory(id: number, csrfToken: string) {
  const csrf = await assertCsrfTokenValue(csrfToken || null);
  if (!csrf.ok) return { ok: false as const, error: csrf.error };

  const access = await requirePermission('admin.access');
  if (!access.ok) return access;

  const prisma = getPrisma();
  try {
    const category = await prisma.knowledgeBaseCategory.delete({
      where: { id },
    });

    await logAudit({
      actorUserId: access.userId,
      action: 'kb.category.delete',
      target: category.slug,
    });

    revalidatePath('/admin/kb');
    revalidatePath('/kb');
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: 'Ошибка при удалении категории' };
  }
}

// --- Articles ---

export async function createKBArticle(input: unknown, csrfToken: string) {
  const csrf = await assertCsrfTokenValue(csrfToken || null);
  if (!csrf.ok) return { ok: false as const, error: csrf.error };

  const access = await requirePermission('admin.access');
  if (!access.ok) return access;

  const parsed = knowledgeBaseArticleSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: 'Некорректные данные' };

  const prisma = getPrisma();
  try {
    const article = await prisma.knowledgeBaseArticle.create({
      data: parsed.data,
    });

    await logAudit({
      actorUserId: access.userId,
      action: 'kb.article.create',
      target: article.slug,
    });

    revalidatePath('/admin/kb');
    revalidatePath('/kb');
    revalidatePath(`/kb/${article.slug}`);
    return { ok: true as const, article };
  } catch (e) {
    return { ok: false as const, error: 'Ошибка при создании статьи' };
  }
}

export async function updateKBArticle(id: number, input: unknown, csrfToken: string) {
  const csrf = await assertCsrfTokenValue(csrfToken || null);
  if (!csrf.ok) return { ok: false as const, error: csrf.error };

  const access = await requirePermission('admin.access');
  if (!access.ok) return access;

  const parsed = knowledgeBaseArticleSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: 'Некорректные данные' };

  const prisma = getPrisma();
  try {
    const article = await prisma.knowledgeBaseArticle.update({
      where: { id },
      data: parsed.data,
    });

    await logAudit({
      actorUserId: access.userId,
      action: 'kb.article.update',
      target: article.slug,
    });

    revalidatePath('/admin/kb');
    revalidatePath('/kb');
    revalidatePath(`/kb/${article.slug}`);
    return { ok: true as const, article };
  } catch (e) {
    return { ok: false as const, error: 'Ошибка при обновлении статьи' };
  }
}

export async function deleteKBArticle(id: number, csrfToken: string) {
  const csrf = await assertCsrfTokenValue(csrfToken || null);
  if (!csrf.ok) return { ok: false as const, error: csrf.error };

  const access = await requirePermission('admin.access');
  if (!access.ok) return access;

  const prisma = getPrisma();
  try {
    const article = await prisma.knowledgeBaseArticle.delete({
      where: { id },
    });

    await logAudit({
      actorUserId: access.userId,
      action: 'kb.article.delete',
      target: article.slug,
    });

    revalidatePath('/admin/kb');
    revalidatePath('/kb');
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: 'Ошибка при удалении статьи' };
  }
}
