import { z } from 'zod';

export const knowledgeBaseCategorySchema = z.object({
  name: z.string().min(2, 'Минимум 2 символа').max(100),
  slug: z.string().min(2).max(120).regex(/^[a-z0-9-]+$/i, 'Только латиница, цифры и дефис'),
  description: z.string().max(500).optional().nullable(),
  sortOrder: z.number().int().default(0),
  targetRole: z.enum(['all', 'user', 'employee', 'admin']).default('all'),
});

export const knowledgeBaseArticleSchema = z.object({
  categoryId: z.number().int().positive(),
  title: z.string().min(2, 'Минимум 2 символа').max(200),
  slug: z.string().min(2).max(200).regex(/^[a-z0-9-]+$/i, 'Только латиница, цифры и дефис'),
  content: z.string().min(10, 'Содержание слишком короткое'),
  excerpt: z.string().max(500).optional().nullable(),
  isPublished: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export type KnowledgeBaseCategoryInput = z.infer<typeof knowledgeBaseCategorySchema>;
export type KnowledgeBaseArticleInput = z.infer<typeof knowledgeBaseArticleSchema>;
