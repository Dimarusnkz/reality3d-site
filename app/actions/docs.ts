'use server'

import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import { getSession } from '@/lib/session';
import { revalidatePath } from 'next/cache';
import { assertCsrfTokenValue } from '@/lib/csrf';
import { logAudit } from '@/lib/audit';

const DOCS_PATH = path.join(process.cwd(), 'content/docs');

export async function updateDoc(category: string, slug: string, content: string, metadata: any, csrfToken: string) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    throw new Error('Unauthorized');
  }

  const csrf = await assertCsrfTokenValue(csrfToken);
  if (!csrf.ok) {
    throw new Error(csrf.error || 'Invalid CSRF token');
  }

  // Validate path to prevent directory traversal
  const safeCategory = ['public', 'admin', 'lk'].includes(category) ? category : 'public';
  const safeSlug = slug.replace(/[^a-z0-9-]/gi, '');
  const filePath = path.join(DOCS_PATH, safeCategory, `${safeSlug}.md`);

  try {
    const fileContent = matter.stringify(content, {
      ...metadata,
      lastUpdated: new Date().toISOString().split('T')[0]
    });

    await fs.writeFile(filePath, fileContent, 'utf8');

    await logAudit({
      actorUserId: parseInt(session.userId),
      action: 'docs.update',
      target: `${category}/${slug}`,
      metadata: { title: metadata.title }
    });

    revalidatePath(`/info/${slug}`);
    revalidatePath('/admin/docs');
    
    return { ok: true };
  } catch (error: any) {
    console.error('Failed to update doc:', error);
    return { ok: false, error: error.message };
  }
}
